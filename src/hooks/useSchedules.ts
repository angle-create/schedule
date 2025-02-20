import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RRule } from 'rrule'
import { addDays, startOfMonth, endOfMonth } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'

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
  const { user, hasPermission, isInitialized } = useAuth()
  const isMounted = useRef(true)
  const lastFetchTime = useRef<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout>()

  const fetchSchedules = useCallback(async () => {
    // 最後のフェッチから1秒以内の場合はスキップ
    const now = Date.now()
    if (now - lastFetchTime.current < 1000) {
      return
    }
    lastFetchTime.current = now

    if (!isInitialized || !isMounted.current) return
    
    console.log('fetchSchedules開始')
    try {
      setIsLoading(true)
      setError(null)

      if (!user) {
        console.log('ユーザーが未認証')
        setSchedules([])
        setIsLoading(false)
        setError(new Error('認証が必要です'))
        return
      }

      // セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('セッションエラー:', sessionError)
        setSchedules([])
        setError(new Error('認証セッションの取得に失敗しました'))
        setIsLoading(false)
        return
      }

      // 日付範囲の設定
      const viewStart = start || startOfMonth(new Date())
      const viewEnd = end || endOfMonth(new Date())
      console.log('日付範囲:', { viewStart, viewEnd })

      const { data, error } = await supabase
        .from('user_schedules')
        .select('*')
        .gte('start_time', viewStart.toISOString())
        .lte('end_time', viewEnd.toISOString())
        .order('start_time')

      if (!isMounted.current) return
      console.log('データ取得結果:', { data: data?.length, error })

      if (error) {
        console.error('スケジュール取得エラー:', error)
        throw error
      }

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

      if (!isMounted.current) return
      console.log('展開後のスケジュール数:', expandedSchedules.length)
      setSchedules(expandedSchedules)
      setError(null)
    } catch (err) {
      if (!isMounted.current) return
      console.error('スケジュールの取得に失敗しました:', err)
      setError(err instanceof Error ? err : new Error('スケジュールの取得に失敗しました'))
      setSchedules([])
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
        console.log('fetchSchedules完了')
      }
    }
  }, [user, isInitialized, start, end])

  const debouncedFetchSchedules = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
    fetchTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        fetchSchedules()
      }
    }, 300)
  }, [fetchSchedules])

  useEffect(() => {
    return () => {
      isMounted.current = false
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (user && isInitialized) {
      debouncedFetchSchedules()

      // visibilitychangeイベントのハンドラー
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('カレンダーページがアクティブになりました')
          debouncedFetchSchedules()
        }
      }

      // visibilitychangeイベントリスナーを追加
      document.addEventListener('visibilitychange', handleVisibilityChange)

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
            debouncedFetchSchedules();
          }
        )
        .subscribe()

      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current)
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        subscription.unsubscribe()
      }
    } else if (isInitialized && !user) {
      // 認証が初期化され、ユーザーがいない場合はスケジュールをクリア
      setSchedules([])
      setError(new Error('認証が必要です'))
    }
  }, [debouncedFetchSchedules, user, isInitialized, start, end])

  return {
    schedules: schedules.map(schedule => ({
      ...schedule,
      canEdit: hasPermission('canEditSchedule') || schedule.creator_id === user?.id,
      canUpdateStatus: hasPermission('canUpdateParticipantStatus')
    })),
    isLoading,
    error,
    refetch: debouncedFetchSchedules
  }
} 