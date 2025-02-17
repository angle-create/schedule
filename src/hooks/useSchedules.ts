import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Schedule {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  is_online: boolean
  creator_id: string
  participant_status: 'pending' | 'accepted' | 'declined'
}

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data, error } = await supabase
          .from('user_schedules')
          .select('*')
          .order('start_time')

        if (error) throw error
        setSchedules(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('スケジュールの取得に失敗しました'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedules()

    // リアルタイム更新のサブスクリプション
    const subscription = supabase
      .channel('schedule_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules'
        },
        () => {
          fetchSchedules()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { schedules, isLoading, error }
} 