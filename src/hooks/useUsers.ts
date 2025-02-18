import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface User {
  id: string
  display_name: string
  email: string
  timezone: string
  role: 'admin' | 'member'
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // セッションの確認
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('認証が必要です')
      }
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('display_name')

      if (fetchError) {
        if (fetchError.code === 'PGRST301') {
          throw new Error('認証が必要です')
        }
        throw fetchError
      }

      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err : new Error('ユーザーの取得に失敗しました'))
      setUsers([]) // エラー時はユーザーリストをクリア
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 認証状態の監視
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUsers()
      } else {
        setUsers([])
        setError(new Error('認証が必要です'))
      }
    })

    // 初回データ取得
    fetchUsers()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUsers])

  return { users, isLoading, error, refetch: fetchUsers }
} 