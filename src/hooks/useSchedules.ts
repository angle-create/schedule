import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RRule } from 'rrule'
import { addDays, startOfMonth, endOfMonth } from 'date-fns'

interface Schedule {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  is_online: boolean
  creator_id: string
  participant_status: 'pending' | 'accepted' | 'declined'
  rrule?: string
}

interface ExpandedSchedule extends Omit<Schedule, 'rrule'> {
  original_id?: string
  recurrence_id?: string
}

export const useSchedules = (start?: Date, end?: Date) => {
  const [schedules, setSchedules] = useState<ExpandedSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // セッションの確認
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setSchedules([])
        return
      }

      // 日付範囲の設定
      const viewStart = start || startOfMonth(new Date())
      const viewEnd = end || endOfMonth(new Date())

      const { data, error } = await supabase
        .from('user_schedules')
        .select('*')
        .gte('start_time', viewStart.toISOString())
        .lte('end_time', viewEnd.toISOString())
        .order('start_time')

      if (error) throw error

      // 繰り返し予定を展開
      const expandedSchedules = (data || []).flatMap(schedule => {
        if (!schedule.rrule) {
          return [schedule]
        }

        try {
          const rule = RRule.fromString(schedule.rrule)
          const dates = rule.between(viewStart, viewEnd, true)
          
          return dates.map(date => {
            const duration = new Date(schedule.end_time).getTime() - new Date(schedule.start_time).getTime()
            const recurrenceStart = new Date(date)
            const recurrenceEnd = new Date(date.getTime() + duration)

            return {
              ...schedule,
              original_id: schedule.id,
              recurrence_id: `${schedule.id}_${date.toISOString()}`,
              start_time: recurrenceStart.toISOString(),
              end_time: recurrenceEnd.toISOString(),
            }
          })
        } catch (ruleError) {
          console.error('繰り返しルールの解析に失敗しました:', ruleError)
          return [schedule]
        }
      })

      setSchedules(expandedSchedules)
    } catch (err) {
      console.error('スケジュールの取得に失敗しました:', err)
      setError(err instanceof Error ? err : new Error('スケジュールの取得に失敗しました'))
      setSchedules([])
    } finally {
      setIsLoading(false)
    }
  }, [start, end])

  useEffect(() => {
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
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.debug('Schedule update received:', payload);
          }
          fetchSchedules();
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchSchedules])

  return { schedules, isLoading, error }
} 