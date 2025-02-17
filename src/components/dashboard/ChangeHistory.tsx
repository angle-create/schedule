'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ChangeHistory {
  id: string
  schedule_id: string
  changed_by: string
  change_type: 'created' | 'updated' | 'deleted'
  changes: any
  created_at: string
  schedule_title: string
}

export const ChangeHistory = () => {
  const [history, setHistory] = useState<ChangeHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('schedule_changes')
          .select(`
            *,
            schedules (title),
            changed_by:users (display_name)
          `)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        const formattedData = data?.map(item => ({
          id: item.id,
          schedule_id: item.schedule_id,
          changed_by: item.changed_by.display_name,
          change_type: item.change_type,
          changes: item.changes,
          created_at: item.created_at,
          schedule_title: item.schedules?.title || '削除された予定'
        })) || []

        setHistory(formattedData)
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const getChangeTypeText = (type: string) => {
    switch (type) {
      case 'created':
        return '作成'
      case 'updated':
        return '更新'
      case 'deleted':
        return '削除'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">変更履歴</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">変更履歴</h2>
      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-4">変更履歴はありません</p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{item.schedule_title}</h3>
                  <p className="text-sm text-gray-500">
                    {item.changed_by}が
                    <span className="font-medium">{getChangeTypeText(item.change_type)}</span>
                    しました
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(item.created_at), 'M月d日(E) HH:mm', { locale: ja })}
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