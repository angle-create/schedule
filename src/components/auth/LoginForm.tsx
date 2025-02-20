'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/

export const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validatePassword = (password: string): string | null => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      return 'パスワードは8文字以上である必要があります'
    }
    if (!PASSWORD_REGEX.test(password)) {
      return 'パスワードは英字と数字を含む必要があります'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // パスワードのバリデーション
        const passwordError = validatePassword(password)
        if (passwordError) {
          setError(passwordError)
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
              role: 'member'
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        if (error) throw error

        setError('確認メールを送信しました。メールをご確認ください。')
      } else {
        // ログイン処理
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('メールアドレスまたはパスワードが正しくありません')
          }
          throw signInError
        }

        // ログイン成功後、即座にリダイレクト
        router.push(redirectPath)
      }
    } catch (error) {
      console.error('認証エラー:', error)
      setError(error instanceof Error ? error.message : '認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSignUp && (
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
            表示名
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="表示名を入力"
            disabled={loading}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレスを入力"
          disabled={loading}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          パスワード
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            placeholder={isSignUp ? "8文字以上の英数字を含むパスワード" : "パスワード"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {isSignUp && (
          <p className="mt-1 text-sm text-gray-500">
            ※ 8文字以上の英字と数字を組み合わせてください
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '処理中...' : (isSignUp ? '新規登録' : 'ログイン')}
      </button>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          disabled={loading}
          className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSignUp ? 'ログインする' : '新規登録する'}
        </button>
        <div className="border-t border-gray-200" />
        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500 block">
          パスワードをお忘れの方はこちら
        </a>
      </div>
    </form>
  )
} 