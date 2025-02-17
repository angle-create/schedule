import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import jaLocale from '@fullcalendar/core/locales/ja'
import { ViewFilter } from './ViewFilter'
import { EventModal } from './EventModal'
import { useSchedules } from '@/hooks/useSchedules'
import { useAuth } from '@/hooks/useAuth'

export const Calendar = () => {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const { schedules, isLoading, error } = useSchedules()
  const { user } = useAuth()

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start)
    setShowEventModal(true)
  }

  const handleEventClick = (clickInfo: any) => {
    // イベントクリック時の処理を実装
  }

  const events = schedules?.map(schedule => ({
    id: schedule.id,
    title: schedule.title,
    start: schedule.start_time,
    end: schedule.end_time,
    backgroundColor: schedule.is_online ? '#3B82F6' : '#10B981',
    borderColor: schedule.is_online ? '#2563EB' : '#059669',
    extendedProps: {
      description: schedule.description,
      isOnline: schedule.is_online,
      creatorId: schedule.creator_id,
      participantStatus: schedule.participant_status
    }
  })) || []

  if (error) {
    return <div className="text-red-500">エラーが発生しました</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ViewFilter currentView={view} onViewChange={setView} />
      <div className="mt-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          locale={jaLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          loading={isLoading}
        />
      </div>
      {showEventModal && selectedDate && (
        <EventModal
          date={selectedDate}
          onClose={() => setShowEventModal(false)}
        />
      )}
    </div>
  )
} 