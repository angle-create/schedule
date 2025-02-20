import { render, screen, fireEvent } from '@testing-library/react'
import { MiniCalendar } from '../MiniCalendar'
import '@testing-library/jest-dom'

describe('MiniCalendar', () => {
  beforeEach(() => {
    // 日付を固定
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-02-17'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders current month and year', () => {
    render(<MiniCalendar />)
    expect(screen.getByText('2024年2月')).toBeInTheDocument()
  })

  it('renders weekday headers', () => {
    render(<MiniCalendar />)
    const weekDays = ['日', '月', '火', '水', '木', '金', '土']
    weekDays.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument()
    })
  })

  it('highlights current day', () => {
    render(<MiniCalendar />)
    const today = screen.getByText('17')
    expect(today.closest('button')).toHaveClass('bg-indigo-600')
  })

  it('navigates to previous month', () => {
    render(<MiniCalendar />)
    fireEvent.click(screen.getByText('←'))
    expect(screen.getByText('2024年1月')).toBeInTheDocument()
  })

  it('navigates to next month', () => {
    render(<MiniCalendar />)
    fireEvent.click(screen.getByText('→'))
    expect(screen.getByText('2024年3月')).toBeInTheDocument()
  })

  it('returns to current month when clicking today button', () => {
    render(<MiniCalendar />)
    fireEvent.click(screen.getByText('←')) // 前月に移動
    fireEvent.click(screen.getByText('今日'))
    expect(screen.getByText('2024年2月')).toBeInTheDocument()
  })
}) 