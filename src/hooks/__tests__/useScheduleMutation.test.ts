import { renderHook, act } from '@testing-library/react'
import { useScheduleMutation } from '../useScheduleMutation'
import { supabase } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}))

describe('useScheduleMutation', () => {
  const mockScheduleData = {
    title: 'テストミーティング',
    description: 'テストの説明',
    start_time: '2024-02-20T10:00:00',
    end_time: '2024-02-20T11:00:00',
    is_online: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSchedule', () => {
    it('creates schedule successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      })

      const { result } = renderHook(() => useScheduleMutation())

      await act(async () => {
        await result.current.createSchedule(mockScheduleData)
      })

      expect(mockInsert).toHaveBeenCalledWith([mockScheduleData])
      expect(result.current.isLoading).toBe(false)
    })

    it('handles create error', async () => {
      const mockError = new Error('作成に失敗しました')
      const mockInsert = jest.fn().mockResolvedValue({ error: mockError })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      })

      const { result } = renderHook(() => useScheduleMutation())

      await expect(
        act(async () => {
          await result.current.createSchedule(mockScheduleData)
        })
      ).rejects.toThrow()

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('updateSchedule', () => {
    const mockUpdateData = {
      id: '1',
      ...mockScheduleData
    }

    it('updates schedule successfully', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ error: null })
      const mockEq = jest.fn().mockReturnValue({ update: mockUpdate })
      ;(supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: mockEq
        })
      })

      const { result } = renderHook(() => useScheduleMutation())

      await act(async () => {
        await result.current.updateSchedule(mockUpdateData)
      })

      expect(mockEq).toHaveBeenCalledWith('id', '1')
      expect(result.current.isLoading).toBe(false)
    })

    it('handles update error', async () => {
      const mockError = new Error('更新に失敗しました')
      const mockUpdate = jest.fn().mockResolvedValue({ error: mockError })
      const mockEq = jest.fn().mockReturnValue({ update: mockUpdate })
      ;(supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: mockEq
        })
      })

      const { result } = renderHook(() => useScheduleMutation())

      await expect(
        act(async () => {
          await result.current.updateSchedule(mockUpdateData)
        })
      ).rejects.toThrow()

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('deleteSchedule', () => {
    it('deletes schedule successfully', async () => {
      const mockDelete = jest.fn().mockResolvedValue({ error: null })
      const mockEq = jest.fn().mockReturnValue({ delete: mockDelete })
      ;(supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: mockEq
        })
      })

      const { result } = renderHook(() => useScheduleMutation())

      await act(async () => {
        await result.current.deleteSchedule('1')
      })

      expect(mockEq).toHaveBeenCalledWith('id', '1')
      expect(result.current.isLoading).toBe(false)
    })

    it('handles delete error', async () => {
      const mockError = new Error('削除に失敗しました')
      const mockDelete = jest.fn().mockResolvedValue({ error: mockError })
      const mockEq = jest.fn().mockReturnValue({ delete: mockDelete })
      ;(supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: mockEq
        })
      })

      const { result } = renderHook(() => useScheduleMutation())

      await expect(
        act(async () => {
          await result.current.deleteSchedule('1')
        })
      ).rejects.toThrow()

      expect(result.current.isLoading).toBe(false)
    })
  })
}) 