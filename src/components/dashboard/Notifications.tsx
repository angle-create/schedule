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
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">未確認の予定</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">未確認の予定</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-4">未確認の予定はありません</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="border rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(notification.start_time), 'M月d日(E) HH:mm', { locale: ja })}
                  </p>
                  <p className="text-sm text-gray-500">
                    作成者: {notification.creator_name}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleAccept(notification.id)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  参加
                </button>
                <button
                  onClick={() => handleDecline(notification.id)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
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