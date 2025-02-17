import { render, screen, fireEvent } from '@testing-library/react'
import { ViewFilter } from '../ViewFilter'

describe('ViewFilter', () => {
  const mockOnViewChange = jest.fn()

  beforeEach(() => {
    mockOnViewChange.mockClear()
  })

  it('renders all view options', () => {
    render(
      <ViewFilter
        currentView="dayGridMonth"
        onViewChange={mockOnViewChange}
      />
    )
    expect(screen.getByText('月')).toBeInTheDocument()
    expect(screen.getByText('週')).toBeInTheDocument()
    expect(screen.getByText('日')).toBeInTheDocument()
  })

  it('highlights current view button', () => {
    render(
      <ViewFilter
        currentView="dayGridMonth"
        onViewChange={mockOnViewChange}
      />
    )
    expect(screen.getByText('月')).toHaveClass('bg-indigo-600')
    expect(screen.getByText('週')).toHaveClass('bg-gray-100')
    expect(screen.getByText('日')).toHaveClass('bg-gray-100')
  })

  it('calls onViewChange with correct view when clicking buttons', () => {
    render(
      <ViewFilter
        currentView="dayGridMonth"
        onViewChange={mockOnViewChange}
      />
    )

    fireEvent.click(screen.getByText('週'))
    expect(mockOnViewChange).toHaveBeenCalledWith('timeGridWeek')

    fireEvent.click(screen.getByText('日'))
    expect(mockOnViewChange).toHaveBeenCalledWith('timeGridDay')

    fireEvent.click(screen.getByText('月'))
    expect(mockOnViewChange).toHaveBeenCalledWith('dayGridMonth')
  })

  it('applies correct styles to buttons based on current view', () => {
    const { rerender } = render(
      <ViewFilter
        currentView="dayGridMonth"
        onViewChange={mockOnViewChange}
      />
    )
    expect(screen.getByText('月')).toHaveClass('bg-indigo-600', 'text-white')

    rerender(
      <ViewFilter
        currentView="timeGridWeek"
        onViewChange={mockOnViewChange}
      />
    )
    expect(screen.getByText('週')).toHaveClass('bg-indigo-600', 'text-white')

    rerender(
      <ViewFilter
        currentView="timeGridDay"
        onViewChange={mockOnViewChange}
      />
    )
    expect(screen.getByText('日')).toHaveClass('bg-indigo-600', 'text-white')
  })
}) 