import { AppLayout } from '@/components/layout/AppLayout'
import { TodaySchedules } from '@/components/dashboard/TodaySchedules'
import { TodoList } from '@/components/dashboard/TodoList'
import { Clock } from '@/components/dashboard/Clock'

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-2rem)]">
        <div className="lg:w-1/2 flex flex-col gap-6">
          <div className="h-44">
            <Clock />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <TodaySchedules />
          </div>
        </div>
        <div className="lg:w-1/2 flex flex-col min-h-0 overflow-hidden">
          <TodoList />
        </div>
      </div>
    </AppLayout>
  )
}

