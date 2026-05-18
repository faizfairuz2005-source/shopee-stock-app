import { createClient } from "@/lib/supabase/server"
import { type Role } from "@/lib/permissions"

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { email: "", fullName: "", role: null as Role | null }
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const fullName = profile?.full_name || (user.user_metadata?.full_name as string) || ""
    // Jika role null/belum diset, fallback ke null = unrestricted
    const role: Role | null = profile?.role as Role | null | undefined ?? null

    return {
      email: user.email ?? "",
      fullName,
      role,
    }
  } catch {
    // Profiles table mungkin belum ada — fallback: role null = unrestricted
    const fullName = (user.user_metadata?.full_name as string) || ""
    return {
      email: user.email ?? "",
      fullName,
      role: null as Role | null,
    }
  }
}
