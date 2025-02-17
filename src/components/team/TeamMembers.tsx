'use client'

import { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { UserAvatar } from '@/components/user/UserAvatar'
import { AddMemberModal } from './AddMemberModal'
import { ManageRoleModal } from './ManageRoleModal'

export const TeamMembers = () => {
  const { users, isLoading, error, refetch } = useUsers()
  const { user: currentUser, isAdmin } = useAuth()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{
    id: string
    display_name: string
    role: string
  } | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg shadow-sm animate-pulse"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">エラーが発生しました: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((member) => (
          <div
            key={member.id}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start space-x-4">
              <UserAvatar size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {member.display_name}
                  </h3>
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                      member.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => {
                      if (isAdmin() && member.id !== currentUser?.id) {
                        setSelectedMember(member)
                      }
                    }}
                  >
                    {member.role === 'admin' ? '管理者' : 'メンバー'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{member.email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  タイムゾーン: {member.timezone || 'Asia/Tokyo'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdmin() && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors duration-200"
          >
            メンバーを追加
          </button>
        </div>
      )}

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch()
          setIsAddModalOpen(false)
        }}
      />

      {selectedMember && (
        <ManageRoleModal
          isOpen={true}
          onClose={() => setSelectedMember(null)}
          onSuccess={() => {
            refetch()
            setSelectedMember(null)
          }}
          member={selectedMember}
        />
      )}
    </div>
  )
} 