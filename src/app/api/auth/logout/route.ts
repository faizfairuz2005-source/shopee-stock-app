import { NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth'

export async function POST() {
  try {
    await logoutUser()

    // Create response that clears all Supabase-related cookies
    const response = NextResponse.json({ success: true })

    // Clear all Supabase cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-[a-zA-Z0-9-]+-auth-token', // Project-specific tokens
    ]

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        domain: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || undefined,
      })
    })

    // Also clear cookies with different patterns
    response.cookies.set('sb-access-token', '', {
      expires: new Date(0),
      path: '/',
    })
    response.cookies.set('sb-refresh-token', '', {
      expires: new Date(0),
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}