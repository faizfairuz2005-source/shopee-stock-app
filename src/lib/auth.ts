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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    user,
    profile: {
      id: user.id,
      email: user.email ?? '',
      full_name: profile?.full_name ?? (user.user_metadata?.full_name as string) ?? '',
      role: profile?.role ?? 'Viewer',
      avatar_url: profile?.avatar_url ?? '',
      created_at: profile?.created_at ?? user.created_at,
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email ?? '',
      full_name: profile?.full_name ?? (user.user_metadata?.full_name as string) ?? '',
      role: profile?.role ?? 'Viewer',
      avatar_url: profile?.avatar_url ?? '',
      created_at: profile?.created_at ?? user.created_at,
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
