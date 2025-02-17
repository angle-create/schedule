import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // 認証が必要なパス
  const authRequiredPaths = ['/', '/calendar', '/team', '/settings']
  // 認証済みユーザーがアクセスできないパス
  const publicOnlyPaths = ['/login']

  const path = req.nextUrl.pathname
  const isAuthRequired = authRequiredPaths.includes(path)
  const isPublicOnly = publicOnlyPaths.includes(path)

  if (isAuthRequired && !session) {
    // 認証が必要なページに未認証でアクセスした場合
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  if (isPublicOnly && session) {
    // ログインページに認証済みでアクセスした場合
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
} 