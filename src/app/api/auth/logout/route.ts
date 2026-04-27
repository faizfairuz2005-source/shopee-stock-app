import { NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth'

export async function POST() {
  try {
    await logoutUser()

    // Create response that clears all Supabase-related cookies
    const response = NextResponse.json({ success: true })

    // Clear the known Supabase auth cookies.
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-auth-token',
    ]

    cookiesToClear.forEach((cookieName) => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
      })
    })

    // Ensure the main auth cookies are cleared.
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