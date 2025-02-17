import { renderHook, act } from '@testing-library/react'
import { useSchedules } from '../useSchedules'
import { supabase } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn()
    }))
  }
}))

describe('useSchedules', () => {
  const mockSchedules = [
    {
      id: '1',
      title: 'テストミーティング1',
      start_time: '2024-02-20T10:00:00',
      end_time: '2024-02-20T11:00:00',
      is_online: true,
      creator_id: 'user1',
      participant_status: 'accepted'
    },
    {
      id: '2',
      title: 'テストミーティング2',
      start_time: '2024-02-21T14:00:00',
      end_time: '2024-02-21T15:00:00',
      is_online: false,
      creator_id: 'user2',
      participant_status: 'pending'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches schedules successfully', async () => {
    const mockSelect = jest.fn().mockResolvedValue({
      data: mockSchedules,
      error: null
    })
    const mockOrder = jest.fn().mockReturnValue({ select: mockSelect })
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: mockOrder
      })
    })

    const { result } = renderHook(() => useSchedules())

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.schedules).toEqual(mockSchedules)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles fetch error', async () => {
    const mockError = new Error('データの取得に失敗しました')
    const mockSelect = jest.fn().mockResolvedValue({
      data: null,
      error: mockError
    })
    const mockOrder = jest.fn().mockReturnValue({ select: mockSelect })
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: mockOrder
      })
    })

    const { result } = renderHook(() => useSchedules())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.schedules).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('sets up realtime subscription', () => {
    renderHook(() => useSchedules())

    expect(supabase.channel).toHaveBeenCalled()
  })
}) 