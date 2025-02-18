import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Required environment variables are missing:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
  throw new Error('Required environment variables are missing')
}

export const supabase = createClientComponentClient<Database>({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
  options: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
})

// デバッグ用：クライアントの初期化状態を確認
console.log('Supabase client initialized with URL:', supabaseUrl) 