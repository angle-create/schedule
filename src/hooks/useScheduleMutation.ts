import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ScheduleData {
  title: string
  description?: string
  start_time: string
  end_time: string
  is_online: boolean
}

interface UpdateScheduleData extends ScheduleData {
  id: string
}

export const useScheduleMutation = () => {
  const [isLoading, setIsLoading] = useState(false)

  const createSchedule = async (data: ScheduleData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('schedules')
        .insert([data])

      if (error) throw error
    } catch (error) {
      console.error('予定の作成に失敗しました:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateSchedule = async (data: UpdateScheduleData) => {
    setIsLoading(true)
    try {
      const { id, ...updateData } = data
      const { error } = await supabase
        .from('schedules')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('予定の更新に失敗しました:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSchedule = async (id: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('予定の削除に失敗しました:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createSchedule,
    updateSchedule,
    deleteSchedule,
    isLoading
  }
} 