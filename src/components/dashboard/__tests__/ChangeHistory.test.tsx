import { render, screen } from '@testing-library/react'
import { ChangeHistory } from '../ChangeHistory'
import { supabase } from '@/lib/supabase/client'

describe('ChangeHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<ChangeHistory />)
    expect(screen.getByText('変更履歴')).toBeInTheDocument()
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(3)
  })

  it('renders empty state when no history', async () => {
    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null })
    }))

    render(<ChangeHistory />)
    expect(await screen.findByText('変更履歴はありません')).toBeInTheDocument()
  })

  it('renders history items when data is available', async () => {
    const mockHistory = [{
      id: '1',
      schedule_id: '1',
      changed_by: {
        display_name: 'テストユーザー'
      },
      change_type: 'created',
      created_at: '2024-02-17T10:00:00',
      schedules: {
        title: 'テストミーティング'
      }
    }]

    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
    }))

    render(<ChangeHistory />)
    
    expect(await screen.findByText('テストミーティング')).toBeInTheDocument()
    expect(screen.getByText(/テストユーザーが作成しました/)).toBeInTheDocument()
  })

  it('displays correct change type text', async () => {
    const mockHistory = [
      {
        id: '1',
        schedule_id: '1',
        changed_by: {
          display_name: 'テストユーザー'
        },
        change_type: 'created',
        created_at: '2024-02-17T10:00:00',
        schedules: {
          title: 'テストミーティング1'
        }
      },
      {
        id: '2',
        schedule_id: '2',
        changed_by: {
          display_name: 'テストユーザー'
        },
        change_type: 'updated',
        created_at: '2024-02-17T11:00:00',
        schedules: {
          title: 'テストミーティング2'
        }
      },
      {
        id: '3',
        schedule_id: '3',
        changed_by: {
          display_name: 'テストユーザー'
        },
        change_type: 'deleted',
        created_at: '2024-02-17T12:00:00',
        schedules: null
      }
    ]

    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
    }))

    render(<ChangeHistory />)
    
    expect(await screen.findByText(/作成/)).toBeInTheDocument()
    expect(screen.getByText(/更新/)).toBeInTheDocument()
    expect(screen.getByText(/削除/)).toBeInTheDocument()
  })
}) 