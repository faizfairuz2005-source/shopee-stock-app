import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type Role } from '@/lib/permissions'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: Role
  avatar_url: string
  created_at: string
}

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireAuthWithProfile(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof requireAuth>>>, profile: UserProfile }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let role: Role = 'Viewer'
  let fullName = (user.user_metadata?.full_name as string) ?? ''
  let avatarUrl = ''
  let createdAt = user.created_at

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      role = (profile.role as Role) ?? (user.app_metadata?.role as Role) ?? 'Viewer'
      fullName = profile.full_name ?? fullName
      avatarUrl = profile.avatar_url ?? ''
      createdAt = profile.created_at ?? user.created_at
    } else {
      // Fallback: baca role dari metadata jika tabel profiles belum ada
      role = (user.app_metadata?.role as Role) ?? (user.user_metadata?.role as Role) ?? 'Viewer'
    }
  } catch {
    // Fallback jika tabel profiles belum ada
    role = (user.app_metadata?.role as Role) ?? (user.user_metadata?.role as Role) ?? 'Viewer'
  }

  return {
    user,
    profile: {
      id: user.id,
      email: user.email ?? '',
      full_name: fullName,
      role,
      avatar_url: avatarUrl,
      created_at: createdAt,
    },
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<UserProfile> {
  const { profile } = await requireAuthWithProfile()

  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard')
  }

  return profile
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    let role: Role = 'Viewer'
    let fullName = (user.user_metadata?.full_name as string) ?? ''
    let avatarUrl = ''
    let createdAt = user.created_at

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        role = (profile.role as Role) ?? (user.app_metadata?.role as Role) ?? 'Viewer'
        fullName = profile.full_name ?? fullName
        avatarUrl = profile.avatar_url ?? ''
        createdAt = profile.created_at ?? user.created_at
      } else {
        role = (user.app_metadata?.role as Role) ?? (user.user_metadata?.role as Role) ?? 'Viewer'
      }
    } catch {
      role = (user.app_metadata?.role as Role) ?? (user.user_metadata?.role as Role) ?? 'Viewer'
    }

    return {
      id: user.id,
      email: user.email ?? '',
      full_name: fullName,
      role,
      avatar_url: avatarUrl,
      created_at: createdAt,
    }
  } catch {
    return null
  }
}

export async function logoutUser() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(`Logout failed: ${error.message}`)
  }

  return true
}
