import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RRule } from 'rrule'
import { addDays } from 'date-fns'

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

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data, error } = await supabase
          .from('user_schedules')
          .select('*')
          .order('start_time')

        if (error) throw error

        // 繰り返し予定を展開
        const expandedSchedules = (data || []).flatMap(schedule => {
          if (!schedule.rrule) {
            return [schedule]
          }

          const rule = RRule.fromString(schedule.rrule)
          const viewStart = start || new Date()
          const viewEnd = end || addDays(viewStart, 30)
          
          // 繰り返しの日付を取得
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
        })

        setSchedules(expandedSchedules)
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
  }, [start, end])

  return { schedules, isLoading, error }
} 