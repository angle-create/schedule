import { render, screen } from '@testing-library/react'
import { TodaySchedules } from '../TodaySchedules'
import { supabase } from '@/lib/supabase/client'

describe('TodaySchedules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<TodaySchedules />)
    expect(screen.getByText('今日の予定')).toBeInTheDocument()
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(3)
  })

  it('renders empty state when no schedules', async () => {
    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null })
    }))

    render(<TodaySchedules />)
    expect(await screen.findByText('予定はありません')).toBeInTheDocument()
  })

  it('renders schedules when data is available', async () => {
    const mockSchedules = [
      {
        id: '1',
        title: 'テストミーティング',
        start_time: '2024-02-17T10:00:00',
        end_time: '2024-02-17T11:00:00',
        is_online: true,
        creator_name: 'テストユーザー',
        participant_status: 'accepted'
      }
    ]

    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockSchedules, error: null })
    }))

    render(<TodaySchedules />)
    
    expect(await screen.findByText('テストミーティング')).toBeInTheDocument()
    expect(screen.getByText('オンライン')).toBeInTheDocument()
    expect(screen.getByText('作成者: テストユーザー')).toBeInTheDocument()
    expect(screen.getByText(/ステータス: 参加/)).toBeInTheDocument()
  })

  it('handles error state', async () => {
    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to fetch') })
    }))

    render(<TodaySchedules />)
    expect(await screen.findByText('予定はありません')).toBeInTheDocument()
  })
}) 