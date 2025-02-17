import { AppLayout } from '@/components/layout/AppLayout'
import { TodaySchedules } from '@/components/dashboard/TodaySchedules'
import { MiniCalendar } from '@/components/dashboard/MiniCalendar'
import { Notifications } from '@/components/dashboard/Notifications'
import { ChangeHistory } from '@/components/dashboard/ChangeHistory'

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TodaySchedules />
          <ChangeHistory />
        </div>
        <div className="space-y-6">
          <MiniCalendar />
          <Notifications />
        </div>
      </div>
    </AppLayout>
  )
}
