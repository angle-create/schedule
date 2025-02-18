'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'

export const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const monthStart = startOfMonth(currentTime)
  const monthEnd = endOfMonth(currentTime)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl shadow-lg h-full">
      <div className="flex h-full gap-6">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-4xl font-bold text-gray-800 mb-1">
            {format(currentTime, 'HH:mm', { locale: ja })}
          </div>
          <div className="text-lg text-gray-600">
            {format(currentTime, 'yyyy年M月d日(E)', { locale: ja })}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {weekDays.map((day) => (
              <div
                key={day}
                className={`py-1 font-medium ${
                  day === '日' ? 'text-red-500' : 
                  day === '土' ? 'text-blue-500' : 
                  'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentTime)
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`py-1 text-xs ${
                    !isCurrentMonth ? 'text-gray-300' :
                    isCurrentDay ? 'bg-blue-600 text-white rounded-full' :
                    format(day, 'E', { locale: ja }) === '日' ? 'text-red-500' :
                    format(day, 'E', { locale: ja }) === '土' ? 'text-blue-500' :
                    'text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 