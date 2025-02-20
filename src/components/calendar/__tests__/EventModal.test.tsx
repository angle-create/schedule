import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventModal } from '../EventModal'
import { useScheduleMutation } from '@/hooks/useScheduleMutation'
import '@testing-library/jest-dom'

// モックの設定
jest.mock('@/hooks/useScheduleMutation')

const mockUseScheduleMutation = useScheduleMutation as jest.Mock

describe('EventModal', () => {
  const mockDate = new Date('2024-02-20T10:00:00')
  const mockOnClose = jest.fn()
  const mockCreateSchedule = jest.fn()
  const mockUpdateSchedule = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    mockCreateSchedule.mockClear()
    mockUpdateSchedule.mockClear()

    mockUseScheduleMutation.mockReturnValue({
      createSchedule: mockCreateSchedule,
      updateSchedule: mockUpdateSchedule,
      isLoading: false
    })
  })

  it('renders new event form correctly', () => {
    render(<EventModal date={mockDate} onClose={mockOnClose} />)

    expect(screen.getByText('新しい予定')).toBeInTheDocument()
    expect(screen.getByLabelText('タイトル')).toBeInTheDocument()
    expect(screen.getByLabelText('説明')).toBeInTheDocument()
    expect(screen.getByLabelText('開始時間')).toBeInTheDocument()
    expect(screen.getByLabelText('終了時間')).toBeInTheDocument()
    expect(screen.getByLabelText(/オンラインミーティング/)).toBeInTheDocument()
  })

  it('renders edit form with existing event data', () => {
    const mockEvent = {
      id: '1',
      title: 'テストミーティング',
      description: 'テストの説明',
      start: new Date('2024-02-20T10:00:00'),
      end: new Date('2024-02-20T11:00:00'),
      isOnline: true
    }

    render(<EventModal date={mockDate} onClose={mockOnClose} event={mockEvent} />)

    expect(screen.getByText('予定を編集')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テストミーティング')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テストの説明')).toBeInTheDocument()
    expect(screen.getByLabelText(/オンラインミーティング/)).toBeChecked()
  })

  it('creates new schedule when submitting new event form', async () => {
    render(<EventModal date={mockDate} onClose={mockOnClose} />)

    fireEvent.change(screen.getByLabelText('タイトル'), {
      target: { value: '新しいミーティング' }
    })
    fireEvent.change(screen.getByLabelText('説明'), {
      target: { value: 'ミーティングの説明' }
    })
    fireEvent.click(screen.getByLabelText(/オンラインミーティング/))

    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(mockCreateSchedule).toHaveBeenCalledWith(expect.objectContaining({
        title: '新しいミーティング',
        description: 'ミーティングの説明',
        is_online: true
      }))
    })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('updates schedule when submitting edit form', async () => {
    const mockEvent = {
      id: '1',
      title: 'テストミーティング',
      description: 'テストの説明',
      start: new Date('2024-02-20T10:00:00'),
      end: new Date('2024-02-20T11:00:00'),
      isOnline: false
    }

    render(<EventModal date={mockDate} onClose={mockOnClose} event={mockEvent} />)

    fireEvent.change(screen.getByLabelText('タイトル'), {
      target: { value: '更新後のミーティング' }
    })
    fireEvent.click(screen.getByLabelText(/オンラインミーティング/))

    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(mockUpdateSchedule).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
        title: '更新後のミーティング',
        is_online: true
      }))
    })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows loading state when submitting', async () => {
    mockUseScheduleMutation.mockReturnValue({
      createSchedule: mockCreateSchedule,
      updateSchedule: mockUpdateSchedule,
      isLoading: true
    })

    render(<EventModal date={mockDate} onClose={mockOnClose} />)

    expect(screen.getByText('保存中...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存中...' })).toBeDisabled()
  })

  it('closes modal when clicking cancel button', () => {
    render(<EventModal date={mockDate} onClose={mockOnClose} />)

    fireEvent.click(screen.getByText('キャンセル'))
    expect(mockOnClose).toHaveBeenCalled()
  })
}) 