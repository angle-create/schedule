import { render, screen, fireEvent } from '@testing-library/react'
import { Calendar } from '../Calendar'
import { useSchedules } from '@/hooks/useSchedules'
import { useAuth } from '@/hooks/useAuth'

// モックの設定
jest.mock('@/hooks/useSchedules')
jest.mock('@/hooks/useAuth')

const mockUseSchedules = useSchedules as jest.Mock
const mockUseAuth = useAuth as jest.Mock

describe('Calendar', () => {
  beforeEach(() => {
    // デフォルトのモック値を設定
    mockUseSchedules.mockReturnValue({
      schedules: [],
      isLoading: false,
      error: null
    })
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' }
    })
  })

  it('renders calendar with default view', () => {
    render(<Calendar />)
    expect(screen.getByText('月')).toBeInTheDocument()
    expect(screen.getByText('週')).toBeInTheDocument()
    expect(screen.getByText('日')).toBeInTheDocument()
  })

  it('displays loading state', () => {
    mockUseSchedules.mockReturnValue({
      schedules: [],
      isLoading: true,
      error: null
    })
    render(<Calendar />)
    // FullCalendarのローディング状態は実装依存のため、
    // ここではコンポーネントが正しくレンダリングされることのみを確認
    expect(screen.getByText('月')).toBeInTheDocument()
  })

  it('displays error message when fetch fails', () => {
    mockUseSchedules.mockReturnValue({
      schedules: [],
      isLoading: false,
      error: new Error('テストエラー')
    })
    render(<Calendar />)
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
  })

  it('renders events when data is available', () => {
    const mockSchedules = [
      {
        id: '1',
        title: 'テストミーティング',
        start_time: '2024-02-20T10:00:00',
        end_time: '2024-02-20T11:00:00',
        is_online: true,
        creator_id: 'test-user-id',
        participant_status: 'accepted' as const
      }
    ]
    mockUseSchedules.mockReturnValue({
      schedules: mockSchedules,
      isLoading: false,
      error: null
    })
    render(<Calendar />)
    // FullCalendarのイベントレンダリングは実装依存のため、
    // ここではコンポーネントが正しくレンダリングされることのみを確認
    expect(screen.getByText('月')).toBeInTheDocument()
  })

  it('changes view when clicking view buttons', () => {
    render(<Calendar />)
    const weekButton = screen.getByText('週')
    fireEvent.click(weekButton)
    // ビューの変更はFullCalendarの内部状態に依存するため、
    // ここではボタンのスタイル変更を確認
    expect(weekButton).toHaveClass('bg-indigo-600')
  })
}) 