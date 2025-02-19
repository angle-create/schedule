import { AppLayout } from '@/components/layout/AppLayout'
import { TodaySchedules } from '@/components/dashboard/TodaySchedules'
import { TodoList } from '@/components/dashboard/TodoList'
import { Clock } from '@/components/dashboard/Clock'

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-3.5rem)] py-2">
        <div className="lg:w-1/2 flex flex-col gap-6">
          <div className="h-44">
            <Clock />
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <TodaySchedules />
          </div>
        </div>
        <div className="lg:w-1/2 flex flex-col min-h-0 overflow-auto">
          <TodoList />
        </div>
      </div>
    </AppLayout>
  )
}

