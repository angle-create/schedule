import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserAvatar } from '../UserAvatar'
import { useAuth } from '@/hooks/useAuth'
import { uploadAvatar, deleteAvatar } from '@/lib/supabase/storage'

// モックの設定
jest.mock('@/hooks/useAuth')
jest.mock('@/lib/supabase/storage')

const mockUseAuth = useAuth as jest.Mock
const mockUploadAvatar = uploadAvatar as jest.Mock
const mockDeleteAvatar = deleteAvatar as jest.Mock

describe('UserAvatar', () => {
  const mockUser = {
    id: 'test-user-id',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser })
  })

  it('renders avatar image when user has avatar_url', () => {
    render(<UserAvatar />)
    const avatarImage = screen.getByRole('img')
    expect(avatarImage).toHaveAttribute('src', mockUser.avatar_url)
  })

  it('renders fallback with user initial when no avatar_url', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, avatar_url: null }
    })
    render(<UserAvatar />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('applies correct size class based on size prop', () => {
    const { rerender } = render(<UserAvatar size="sm" />)
    expect(screen.getByRole('img').parentElement).toHaveClass('w-8 h-8')

    rerender(<UserAvatar size="lg" />)
    expect(screen.getByRole('img').parentElement).toHaveClass('w-16 h-16')
  })

  it('shows file input and delete button when editable is true', () => {
    render(<UserAvatar editable />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('handles file upload successfully', async () => {
    mockUploadAvatar.mockResolvedValueOnce('https://example.com/new-avatar.jpg')
    
    render(<UserAvatar editable />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith(file, mockUser.id)
    })
  })

  it('handles avatar deletion', async () => {
    render(<UserAvatar editable />)
    
    const deleteButton = screen.getByRole('button')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockDeleteAvatar).toHaveBeenCalledWith(mockUser.id)
    })
  })

  it('shows loading spinner during upload', async () => {
    mockUploadAvatar.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<UserAvatar editable />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByRole('textbox', { hidden: true })).toBeDisabled()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('handles upload error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    mockUploadAvatar.mockRejectedValueOnce(new Error('Upload failed'))
    
    render(<UserAvatar editable />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })
}) 