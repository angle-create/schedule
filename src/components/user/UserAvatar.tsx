import { useState } from 'react'
import * as Avatar from '@radix-ui/react-avatar'
import { uploadAvatar, deleteAvatar } from '@/lib/supabase/storage'
import { useAuth } from '@/hooks/useAuth'

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
}

export const UserAvatar = ({ size = 'md', editable = false }: UserAvatarProps) => {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setIsUploading(true)
      await uploadAvatar(file, user.id)
    } catch (error) {
      console.error('アバターのアップロードに失敗しました:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    
    try {
      setIsUploading(true)
      await deleteAvatar(user.id)
    } catch (error) {
      console.error('アバターの削除に失敗しました:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative">
      <Avatar.Root className={`relative inline-flex ${sizeClasses[size]} rounded-full overflow-hidden`}>
        <Avatar.Image
          src={user?.avatar_url || ''}
          className="w-full h-full object-cover"
        />
        <Avatar.Fallback
          className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600"
          delayMs={600}
        >
          {user?.display_name?.[0]?.toUpperCase() || 'U'}
        </Avatar.Fallback>
      </Avatar.Root>

      {editable && (
        <div className="absolute inset-0 flex items-center justify-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          {user?.avatar_url && (
            <button
              onClick={handleDelete}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              disabled={isUploading}
            >
              ×
            </button>
          )}
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
} 