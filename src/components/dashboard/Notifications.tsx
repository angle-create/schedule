'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'schedule' | 'change'
  schedule_id: string
  title: string
  start_time?: string
  creator_name: string
  change_type?: 'created' | 'updated' | 'deleted'
  created_at: string
  is_read: boolean
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // セッションの確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session) {
          setNotifications([])
          return
        }

        // 未確認の予定を取得
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule_participants')
          .select(`
            id,
            schedule_id,
            schedules!inner (
              title,
              start_time,
              creator:users!inner (display_name)
            )
          `)
          .eq('status', 'pending')
          .eq('is_read', false)
          .eq('user_id', session.user.id)

        if (scheduleError) {
          console.error('Schedule fetch error:', scheduleError)
          throw scheduleError
        }

        // 未読の変更履歴を取得
        const { data: changeData, error: changeError } = await supabase
          .from('schedule_changes')
          .select(`
            id,
            schedule_id,
            schedules!inner (title),
            changed_by:users!inner (display_name),
            change_type,
            created_at
          `)
          .eq('is_read', false)
          .neq('changed_by', session.user.id)
          .order('created_at', { ascending: false })

        if (changeError) {
          console.error('Change history fetch error:', changeError)
          throw changeError
        }

        // 通知データを統合
        const scheduleNotifications = (scheduleData || []).map(item => ({
          id: item.id,
          type: 'schedule' as const,
          schedule_id: item.schedule_id,
          title: item.schedules.title,
          start_time: item.schedules.start_time,
          creator_name: item.schedules.creator.display_name,
          created_at: item.schedules.start_time,
          is_read: false
        }))

        const changeNotifications = (changeData || []).map(item => ({
          id: item.id,
          type: 'change' as const,
          schedule_id: item.schedule_id,
          title: item.schedules?.title || '削除された予定',
          creator_name: item.changed_by.display_name,
          change_type: item.change_type,
          created_at: item.created_at,
          is_read: false
        }))

        setNotifications([...scheduleNotifications, ...changeNotifications].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
      } catch (error) {
        console.error('Error details:', error)
        setError(error instanceof Error ? error.message : '通知の取得に失敗しました')
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // リアルタイム更新のサブスクリプション
    const scheduleSubscription = supabase
      .channel('schedule-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'schedule_participants' 
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      scheduleSubscription.unsubscribe()
    }
  }, [])

  const getNotificationIcon = (type: string, changeType?: string) => {
    if (type === 'schedule') return '📅'
    if (type === 'change') {
      switch (changeType) {
        case 'created': return '✨'
        case 'updated': return '🔄'
        case 'deleted': return '🗑️'
        default: return '📝'
      }
    }
    return '🔔'
  }

  const getNotificationText = (type: string, changeType?: string) => {
    if (type === 'schedule') return '予定の確認が必要です'
    if (type === 'change') {
      switch (changeType) {
        case 'created': return 'が新しい予定を作成しました'
        case 'updated': return 'が予定を更新しました'
        case 'deleted': return 'が予定を削除しました'
        default: return 'が予定を変更しました'
      }
    }
    return ''
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl shadow-lg h-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-2">🔔</span>
          未確認の通知
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-rose-50 rounded-xl" data-testid="loading-skeleton"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl shadow-lg h-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-2">🔔</span>
          未確認の通知
        </h2>
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center flex-shrink-0">
        <span className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-2">🔔</span>
        未確認の通知
      </h2>
      {notifications.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center flex-1 flex items-center justify-center">
          <p className="text-gray-500">未確認の通知はありません</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white/50 backdrop-blur-sm border border-rose-100 rounded-xl p-4 hover:bg-white/80 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                  <p className="text-sm text-rose-600 font-medium flex items-center mt-1">
                    <span className="bg-rose-100 text-rose-600 p-1 rounded-lg mr-2">
                      {getNotificationIcon(notification.type, notification.change_type)}
                    </span>
                    {notification.creator_name}
                    <span className="ml-1">
                      {getNotificationText(notification.type, notification.change_type)}
                    </span>
                  </p>
                  {notification.start_time && (
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(notification.start_time), 'M月d日(E) HH:mm', { locale: ja })}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(notification.created_at), 'M月d日(E) HH:mm', { locale: ja })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 