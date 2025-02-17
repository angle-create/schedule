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
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('display_name')

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('ユーザーの取得に失敗しました'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return { users, isLoading, error, refetch: fetchUsers }
} 