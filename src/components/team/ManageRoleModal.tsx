'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { supabase } from '@/lib/supabase/client'

interface ManageRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  member: {
    id: string
    display_name: string
    role: string
  }
}

export const ManageRoleModal = ({ isOpen, onClose, onSuccess, member }: ManageRoleModalProps) => {
  const [role, setRole] = useState(member.role)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', member.id)

      if (updateError) throw updateError

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '権限の更新に失敗しました')
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
            権限を管理: {member.display_name}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ロール
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="member">メンバー</option>
                <option value="admin">管理者</option>
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
                {isLoading ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 