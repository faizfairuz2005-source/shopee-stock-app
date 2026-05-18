"use server";

import { createClient } from "@/lib/supabase/server";
import { ALL_ROLES, type Role } from "@/lib/permissions";

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

export async function getUsers(): Promise<UserManagementItem[]> {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) return [];

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (currentProfile?.role !== "Admin") return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (!profiles) return [];

  const users: UserManagementItem[] = (profiles as ProfileRecord[]).map((p) => ({
    id: p.id,
    email: "",
    full_name: p.full_name || "",
    role: p.role as Role,
    avatar_url: p.avatar_url || "",
    created_at: p.created_at,
    is_active: true,
  }));

  // Try to get emails from auth admin API
  try {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    if (authUsers?.users) {
      for (const user of users) {
        const match = (authUsers.users as AuthUserRecord[]).find((au) => au.id === user.id);
        if (match) {
          user.email = match.email ?? "";
        }
      }
    }
  } catch {
    // Admin API might not be available, emails will be empty
  }

  return users;
}

export async function updateUserRole(userId: string, newRole: Role): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) return { success: false, error: "Not authenticated" };

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (currentProfile?.role !== "Admin") return { success: false, error: "Only admins can change roles" };

  if (!ALL_ROLES.includes(newRole)) return { success: false, error: "Invalid role" };

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

export async function updateUserActiveStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) return { success: false, error: "Not authenticated" };

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (currentProfile?.role !== "Admin") return { success: false, error: "Only admins can manage users" };

  try {
    if (isActive) {
      await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
    } else {
      await supabase.auth.admin.updateUserById(userId, { ban_duration: "999999" });
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user status";
    return { success: false, error: message + ". Make sure Service Role key is configured." };
  }
}

export async function inviteUser(email: string, fullName: string, role: Role): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) return { success: false, error: "Not authenticated" };

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (currentProfile?.role !== "Admin") return { success: false, error: "Only admins can invite users" };

  if (!ALL_ROLES.includes(role)) return { success: false, error: "Invalid role" };

  try {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });

    if (error) return { success: false, error: error.message };

    if (data?.user) {
      await supabase
        .from("profiles")
        .update({ role, full_name: fullName })
        .eq("id", data.user.id);
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to invite user";
    return { success: false, error: message + ". Make sure Service Role key is configured." };
  }
}
