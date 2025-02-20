import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

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
  const { user, isInitialized } = useAuth()

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
        .order('role', { ascending: false })
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

  useEffect(() => {
    if (user && isInitialized) {
      fetchUsers()

      const subscription = supabase
        .channel('users_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users'
          },
          () => {
            fetchUsers()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } else if (isInitialized && !user) {
      setUsers([])
      setError(new Error('認証が必要です'))
    }
  }, [fetchUsers, user, isInitialized])

  return { users, isLoading, error, refetch: fetchUsers }
} 