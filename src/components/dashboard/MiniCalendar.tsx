'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'

export const MiniCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="p-2 hover:bg-gray-100 rounded"
          >
            今日
          </button>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isCurrentDay = isToday(day)

          return (
            <button
              key={day.toISOString()}
              className={`
                p-2 text-sm rounded-full
                ${!isCurrentMonth && 'text-gray-300'}
                ${isCurrentDay && 'bg-indigo-600 text-white'}
                ${isCurrentMonth && !isCurrentDay && 'hover:bg-gray-100'}
              `}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
} 