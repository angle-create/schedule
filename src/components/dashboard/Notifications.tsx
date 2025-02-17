'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Notification {
  id: string
  schedule_id: string
  title: string
  start_time: string
  creator_name: string
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('schedule_participants')
          .select(`
            id,
            schedule_id,
            schedules (
              title,
              start_time,
              creator:users (display_name)
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) throw error

        const formattedData = data?.map(item => ({
          id: item.id,
          schedule_id: item.schedule_id,
          title: item.schedules.title,
          start_time: item.schedules.start_time,
          creator_name: item.schedules.creator.display_name
        })) || []

        setNotifications(formattedData)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const handleAccept = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedule_participants')
        .update({ status: 'accepted' })
        .eq('id', id)

      if (error) throw error
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error accepting invitation:', error)
    }
  }

  const handleDecline = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedule_participants')
        .update({ status: 'declined' })
        .eq('id', id)

      if (error) throw error
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error declining invitation:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-2">🔔</span>
          未確認の予定
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-rose-50 rounded-xl" data-testid="loading-skeleton"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-2">🔔</span>
        未確認の予定
      </h2>
      {notifications.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center">
          <p className="text-gray-500">未確認の予定はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white/50 backdrop-blur-sm border border-rose-100 rounded-xl p-4 hover:bg-white/80 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                  <p className="text-sm text-rose-600 font-medium">
                    {format(new Date(notification.start_time), 'M月d日(E) HH:mm', { locale: ja })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center">
                    <span className="bg-gray-100 p-1 rounded-full mr-2">👤</span>
                    {notification.creator_name}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAccept(notification.id)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  参加
                </button>
                <button
                  onClick={() => handleDecline(notification.id)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm rounded-lg font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  不参加
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 