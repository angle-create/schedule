import { AppLayout } from '@/components/layout/AppLayout'
import { TeamMembers } from '@/components/team/TeamMembers'

export default function TeamPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">チームメンバー</h1>
        <TeamMembers />
      </div>
    </AppLayout>
  )
} 