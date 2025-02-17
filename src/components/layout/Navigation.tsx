'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarIcon, UsersIcon, CogIcon, HomeIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: HomeIcon },
  { name: 'カレンダー', href: '/calendar', icon: CalendarIcon },
  { name: 'チーム', href: '/team', icon: UsersIcon },
  { name: '設定', href: '/settings', icon: CogIcon },
]

export const Navigation = () => {
  const pathname = usePathname()

  return (
    <>
      {/* モバイル用トップバー */}
      <div className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 sm:pl-64">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold sm:hidden">スケジュール管理</span>
          </div>
        </div>
      </div>

      {/* サイドナビゲーション */}
      <div className="fixed left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0">
        <div className="h-full px-3 py-4 overflow-y-auto bg-white border-r border-gray-200">
          <div className="mb-10 mt-4">
            <span className="text-xl font-semibold">スケジュール管理</span>
          </div>
          <ul className="space-y-2">
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
        </div>
      </div>
    </>
  )
} 