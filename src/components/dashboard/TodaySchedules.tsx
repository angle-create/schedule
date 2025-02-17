'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Schedule {
  id: string
  title: string
  start_time: string
  end_time: string
  is_online: boolean
  creator_name: string
  participant_status: string
}

export const TodaySchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTodaySchedules = async () => {
      try {
        const { data, error } = await supabase
          .from('today_schedules')
          .select('*')
          .order('start_time')

        if (error) throw error
        setSchedules(data || [])
      } catch (error) {
        console.error('Error fetching schedules:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodaySchedules()
  }, [])

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">今日の予定</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">今日の予定</h2>
      {schedules.length === 0 ? (
        <p className="text-gray-500 text-center py-4">予定はありません</p>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{schedule.title}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(schedule.start_time), 'HH:mm', { locale: ja })} - 
                    {format(new Date(schedule.end_time), 'HH:mm', { locale: ja })}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  schedule.is_online 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {schedule.is_online ? 'オンライン' : 'オフライン'}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span>作成者: {schedule.creator_name}</span>
                <span className="ml-4">
                  ステータス: {
                    {
                      'pending': '未回答',
                      'accepted': '参加',
                      'declined': '不参加'
                    }[schedule.participant_status] || '未回答'
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 