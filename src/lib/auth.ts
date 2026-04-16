import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Check if user is authenticated and redirect to login if not
 * This is used in server components and API routes
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Get current user without redirecting
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Logout user from Supabase
 */
export async function logoutUser() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(`Logout failed: ${error.message}`)
  }

  return true
}