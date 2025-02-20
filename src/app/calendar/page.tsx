'use client'

import { Suspense } from 'react'
import { Calendar } from '@/components/calendar/Calendar'
import { AppLayout } from '@/components/layout/AppLayout'

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-5rem)] py-2">
        <Suspense fallback={<div>Loading calendar...</div>}>
          <Calendar />
        </Suspense>
      </div>
    </AppLayout>
  )
} 