import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// 認証が必要なパス
const authRequiredPaths = ['/', '/calendar', '/team', '/settings']
// 認証済みユーザーがアクセスできないパス
const publicOnlyPaths = ['/login']
// 常に許可するパス
const allowedPaths = ['/auth/callback', '/_next', '/static', '/favicon.ico']

export async function middleware(req: NextRequest) {
  // 常に許可するパスの場合は早期リターン
  const path = req.nextUrl.pathname
  if (allowedPaths.some(allowedPath => path.startsWith(allowedPath))) {
    return NextResponse.next()
  }

  // レスポンスの作成
  const res = NextResponse.next()
  
  // Supabaseクライアントの作成
  const supabase = createMiddlewareClient({ req, res })

  try {
    // セッションの取得と更新
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // セッションエラーの場合はログに記録して続行
    if (sessionError) {
      console.error('Session error:', sessionError)
    }

    // ログインページへのアクセス
    if (publicOnlyPaths.includes(path)) {
      // セッションがある場合はダッシュボードへ
      if (session?.user?.id && session?.access_token) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return res
    }

    // 認証が必要なページへのアクセス
    if (authRequiredPaths.includes(path)) {
      // セッションがない場合はログインページへ
      if (!session?.user?.id || !session?.access_token) {
        const loginUrl = new URL('/login', req.url)
        // 現在のページをリダイレクト先として保存
        if (path !== '/') {
          loginUrl.searchParams.set('redirect', path)
        }
        return NextResponse.redirect(loginUrl)
      }
    }

    // その他のページはアクセスを許可
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // エラーの場合でもアクセスを許可
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 