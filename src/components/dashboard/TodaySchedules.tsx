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
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-2">📅</span>
          今日の予定
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-indigo-50 rounded-xl" data-testid="loading-skeleton"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-2">📅</span>
        今日の予定
      </h2>
      {schedules.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center">
          <p className="text-gray-500">予定はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white/50 backdrop-blur-sm border border-indigo-100 rounded-xl p-4 hover:bg-white/80 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{schedule.title}</h3>
                  <p className="text-sm text-indigo-600 font-medium">
                    {format(new Date(schedule.start_time), 'HH:mm', { locale: ja })} - 
                    {format(new Date(schedule.end_time), 'HH:mm', { locale: ja })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  schedule.is_online 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {schedule.is_online ? 'オンライン' : 'オフライン'}
                </span>
              </div>
              <div className="mt-3 text-sm border-t border-indigo-50 pt-3 flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <span className="bg-gray-100 p-1 rounded-full mr-2">👤</span>
                  {schedule.creator_name}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  {
                    'pending': 'bg-amber-100 text-amber-700',
                    'accepted': 'bg-emerald-100 text-emerald-700',
                    'declined': 'bg-red-100 text-red-700'
                  }[schedule.participant_status] || 'bg-gray-100 text-gray-700'
                }`}>
                  {
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