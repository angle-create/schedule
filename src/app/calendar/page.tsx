import { Calendar } from '@/components/calendar/Calendar'
import { AppLayout } from '@/components/layout/AppLayout'

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-2rem)]">
        <Calendar />
      </div>
    </AppLayout>
  )
} 