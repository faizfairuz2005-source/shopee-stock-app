"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_ROLES, type Role } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export interface UserManagementItem {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string;
  created_at: string;
  is_active: boolean;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthUserRecord {
  id: string;
  email?: string;
}

/**
 * Helper: cek role user saat ini dengan fallback ke app_metadata
 * (karena tabel profiles mungkin belum ada)
 */
async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Coba dari tabel profiles dulu
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) return profile.role as Role;
  } catch {
    // Tabel profiles belum ada — fall through ke metadata
  }

  // Fallback ke app_metadata / user_metadata
  return (user.app_metadata?.role as Role) ?? (user.user_metadata?.role as Role) ?? null;
}

export async function getUsers(): Promise<UserManagementItem[]> {
  const supabase = await createClient();

  const role = await getCurrentUserRole();
  if (role !== "Admin") return [];

  // Coba ambil user dari tabel profiles dulu
  try {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profiles && profiles.length > 0) {
      const users: UserManagementItem[] = (profiles as ProfileRecord[]).map((p) => ({
        id: p.id,
        email: "",
        full_name: p.full_name || "",
        role: p.role as Role,
        avatar_url: p.avatar_url || "",
        created_at: p.created_at,
        is_active: true,
      }));

      // Enrich emails from auth admin API
      try {
        const admin = createAdminClient();
        const { data: authUsers } = await admin.auth.admin.listUsers();
        if (authUsers?.users) {
          for (const user of users) {
            const match = (authUsers.users as AuthUserRecord[]).find((au) => au.id === user.id);
            if (match) {
              user.email = match.email ?? "";
            }
          }
        }
      } catch {
        // Admin API mungkin tidak tersedia (service key belum dikonfigurasi)
      }

      return users;
    }
  } catch {
    // Tabel profiles belum ada — fall through ke auth API
  }

  // Fallback: ambil user dari Auth Admin API (termasuk metadata)
  try {
    const admin = createAdminClient();
    const { data: authUsers } = await admin.auth.admin.listUsers();
    if (!authUsers?.users) return [];

    return authUsers.users.map((au: any) => ({
      id: au.id,
      email: au.email ?? "",
      full_name: au.user_metadata?.full_name ?? "",
      role: (au.app_metadata?.role as Role) ?? (au.user_metadata?.role as Role) ?? "Viewer",
      avatar_url: "",
      created_at: au.created_at,
      is_active: !au.banned_until,
    }));
  } catch {
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: Role): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) return { success: false, error: "Not authenticated" };

  const role = await getCurrentUserRole();
  if (role !== "Admin") return { success: false, error: "Only admins can change roles" };

  if (!ALL_ROLES.includes(newRole)) return { success: false, error: "Invalid role" };

  // Update role via profiles table (if exists) or fallback to admin API
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
  } catch {
    // Fallback: update via admin API (app_metadata)
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(userId, {
        app_metadata: { role: newRole },
        user_metadata: { role: newRole },
      });
    } catch (adminErr: unknown) {
      const message = adminErr instanceof Error ? adminErr.message : "Failed to update role";
      return { success: false, error: message };
    }
  }

  // Audit log
  auditLog({
    action: "user.role_change",
    entity_type: "user",
    entity_id: userId,
    details: { new_role: newRole, changed_by: currentUser.id },
  });

  return { success: true };
}

export async function updateUserActiveStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) return { success: false, error: "Not authenticated" };

  const role = await getCurrentUserRole();
  if (role !== "Admin") return { success: false, error: "Only admins can manage users" };

  try {
    const admin = createAdminClient();
    if (isActive) {
      await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
    } else {
      await admin.auth.admin.updateUserById(userId, { ban_duration: "999999" });
    }

    // Audit log
    auditLog({
      action: isActive ? "user.activate" : "user.deactivate",
      entity_type: "user",
      entity_id: userId,
      details: { is_active: isActive, changed_by: currentUser.id },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user status";
    return { success: false, error: message + ". Make sure Service Role key is configured." };
  }
}

export async function inviteUser(email: string, fullName: string, newRole: Role): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) return { success: false, error: "Not authenticated" };

  const currentUserRole = await getCurrentUserRole();
  if (currentUserRole !== "Admin") return { success: false, error: "Only admins can invite users" };

  if (!ALL_ROLES.includes(newRole)) return { success: false, error: "Invalid role" };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });

    if (error) return { success: false, error: error.message };

    if (data?.user) {
      await supabase
        .from("profiles")
        .update({ role: newRole, full_name: fullName })
        .eq("id", data.user.id);
    }

    // Audit log
    auditLog({
      action: "user.invite",
      entity_type: "user",
      entity_id: data?.user?.id,
      entity_name: email,
      details: { role: newRole, full_name: fullName, invited_by: currentUser.id },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to invite user";
    return { success: false, error: message + ". Make sure Service Role key is configured." };
  }
}
