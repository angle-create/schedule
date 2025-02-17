import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../LoginForm'
import { supabase } from '@/lib/supabase/client'

// Supabaseのモック
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}))

describe('LoginForm', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(<LoginForm />)
    
    // フォーム要素の存在確認
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
    expect(screen.getByText('パスワードをお忘れの方はこちら')).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    // Supabaseの認証成功をモック
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
    mockSignIn.mockResolvedValueOnce({ error: null })

    render(<LoginForm />)

    // フォームに値を入力
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' },
    })

    // ログインボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    // Supabaseの認証関数が正しい引数で呼ばれたことを確認
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    // エラーメッセージが表示されていないことを確認
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('handles login error', async () => {
    // Supabaseの認証エラーをモック
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
    mockSignIn.mockResolvedValueOnce({
      error: new Error('Invalid credentials'),
    })

    render(<LoginForm />)

    // フォームに値を入力
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'wrongpassword' },
    })

    // ログインボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows loading state during login', async () => {
    // Supabaseの認証を遅延させる
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
    mockSignIn.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<LoginForm />)

    // フォームに値を入力してログインボタンをクリック
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    // ローディング状態を確認
    expect(screen.getByText('ログイン中...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
}) 