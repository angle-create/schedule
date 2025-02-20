'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarIcon, UsersIcon, CogIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: HomeIcon },
  { name: 'カレンダー', href: '/calendar', icon: CalendarIcon },
  { name: 'チーム', href: '/team', icon: UsersIcon },
  { name: '設定', href: '/settings', icon: CogIcon },
]

export const Navigation = () => {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      window.location.href = '/login'
    } catch (error) {
      console.error('ログアウトに失敗しました:', error)
    }
  }

  return (
    <div className="fixed left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0">
      <div className="h-full px-3 py-4 overflow-y-auto bg-white border-r border-gray-200 flex flex-col">
        <div className="mb-10 mt-4">
          <span className="text-xl font-semibold text-gray-800">スケジュール管理</span>
        </div>
        <ul className="space-y-2 flex-grow">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-lg hover:bg-gray-100 group ${
                    isActive ? 'bg-gray-100' : ''
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  />
                  <span className={`ml-3 ${
                    isActive ? 'text-indigo-600 font-medium' : 'text-gray-500'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="pt-4 border-t border-gray-200">
          <div className="mb-2 text-sm text-gray-500">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors duration-200"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
} 