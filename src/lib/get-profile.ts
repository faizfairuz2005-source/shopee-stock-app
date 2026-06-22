import { createClient } from "@/lib/supabase/server"
import { type Role } from "@/lib/permissions"

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { email: "", fullName: "", role: null as Role | null, avatarUrl: "" }
  }

  let fullName = (user.user_metadata?.full_name as string) || ""
  let role: Role | null = null
  let avatarUrl = (user.user_metadata?.avatar_url as string) || ""

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profile) {
      fullName = profile.full_name || fullName
      role = (profile.role as Role) ?? (user.app_metadata?.role as Role) ?? null
      avatarUrl = profile.avatar_url || avatarUrl
    } else {
      // Fallback: baca role dari metadata jika tabel profiles belum ada
      role = (user.app_metadata?.role as Role) ?? (user.user_metadata?.role as Role) ?? null
    }
  } catch {
    // Profiles table mungkin belum ada — fallback ke metadata
    role = (user.app_metadata?.role as Role) ?? (user.user_metadata?.role as Role) ?? null
  }

  return {
    email: user.email ?? "",
    fullName,
    role,
    avatarUrl,
  }
}
