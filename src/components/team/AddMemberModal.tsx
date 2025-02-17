'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTimezones } from '@/hooks/useTimezones'
import { supabase } from '@/lib/supabase/client'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AddMemberModal = ({ isOpen, onClose, onSuccess }: AddMemberModalProps) => {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [timezone, setTimezone] = useState('Asia/Tokyo')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { timezones } = useTimezones()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // ランダムなパスワードを生成
      const tempPassword = Math.random().toString(36).slice(-12)

      // 新規ユーザーを作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            display_name: displayName
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // ユーザープロフィールを作成
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email,
              display_name: displayName,
              timezone,
              role: 'member'
            }
          ])

        if (profileError) throw profileError

        onSuccess()
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メンバーの追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
          <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
            メンバーを追加
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                タイムゾーン
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                {timezones.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-md disabled:opacity-50"
              >
                {isLoading ? '追加中...' : '追加'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 