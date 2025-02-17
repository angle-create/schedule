import { Calendar } from '@/components/calendar/Calendar'
import { AppLayout } from '@/components/layout/AppLayout'

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">カレンダー</h1>
        <Calendar />
      </div>
    </AppLayout>
  )
} 