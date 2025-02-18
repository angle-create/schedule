import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// デバッグ用：環境変数の確認
console.log('Environment variables check:', {
  url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})

export const supabase = createClientComponentClient()

// デバッグ用：クライアントの初期化状態を確認
console.log('Supabase client initialized') 