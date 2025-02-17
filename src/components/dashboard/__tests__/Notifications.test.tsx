import { render, screen, fireEvent } from '@testing-library/react'
import { Notifications } from '../Notifications'
import { supabase } from '@/lib/supabase/client'

describe('Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<Notifications />)
    expect(screen.getByText('未確認の予定')).toBeInTheDocument()
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(2)
  })

  it('renders empty state when no notifications', async () => {
    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null })
    }))

    render(<Notifications />)
    expect(await screen.findByText('未確認の予定はありません')).toBeInTheDocument()
  })

  it('renders notifications when data is available', async () => {
    const mockNotifications = [{
      id: '1',
      schedule_id: '1',
      schedules: {
        title: 'テストミーティング',
        start_time: '2024-02-17T10:00:00',
        creator: {
          display_name: 'テストユーザー'
        }
      }
    }]

    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockNotifications, error: null })
    }))

    render(<Notifications />)
    
    expect(await screen.findByText('テストミーティング')).toBeInTheDocument()
    expect(screen.getByText(/作成者: テストユーザー/)).toBeInTheDocument()
  })

  it('handles accept action', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ error: null })
    jest.spyOn(supabase, 'from').mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{
          id: '1',
          schedule_id: '1',
          schedules: {
            title: 'テストミーティング',
            start_time: '2024-02-17T10:00:00',
            creator: {
              display_name: 'テストユーザー'
            }
          }
        }],
        error: null
      }),
      update: mockUpdate
    }))

    render(<Notifications />)
    
    const acceptButton = await screen.findByText('参加')
    fireEvent.click(acceptButton)

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'accepted' })
  })

  it('handles decline action', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ error: null })
    jest.spyOn(supabase, 'from').mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{
          id: '1',
          schedule_id: '1',
          schedules: {
            title: 'テストミーティング',
            start_time: '2024-02-17T10:00:00',
            creator: {
              display_name: 'テストユーザー'
            }
          }
        }],
        error: null
      }),
      update: mockUpdate
    }))

    render(<Notifications />)
    
    const declineButton = await screen.findByText('不参加')
    fireEvent.click(declineButton)

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'declined' })
  })
}) 