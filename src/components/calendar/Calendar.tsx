import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import jaLocale from '@fullcalendar/core/locales/ja'
import { ViewFilter } from './ViewFilter'
import { EventModal } from './EventModal'
import { useSchedules } from '@/hooks/useSchedules'
import { useScheduleMutation } from '@/hooks/useScheduleMutation'
import { useAuth } from '@/hooks/useAuth'
import { differenceInMinutes } from 'date-fns'

export const Calendar = () => {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const { schedules, isLoading, error } = useSchedules()
  const { updateSchedule } = useScheduleMutation()
  const { user } = useAuth()

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start)
    setSelectedEvent(null)
    setShowEventModal(true)
  }

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    setSelectedEvent({
      id: event.id,
      title: event.title,
      description: event.extendedProps.description,
      startTime: event.start,
      endTime: event.end,
      isOnline: event.extendedProps.isOnline,
      location: event.extendedProps.location,
      participantIds: event.extendedProps.participantIds,
      rrule: event.extendedProps.rrule
    })
    setShowEventModal(true)
  }

  const handleEventDrop = async (dropInfo: any) => {
    const event = dropInfo.event
    const delta = dropInfo.delta
    
    // 繰り返し予定の場合は確認を求める
    if (event.extendedProps.original_id) {
      const confirmed = window.confirm(
        '繰り返し予定の1つを移動しようとしています。\n' +
        'このイベントのみを移動しますか？\n' +
        '「キャンセル」を選択すると、すべての繰り返しイベントを移動します。'
      )

      if (confirmed) {
        // この1回のみの予定として新規作成
        try {
          const newEvent = {
            title: event.title,
            description: event.extendedProps.description,
            start_time: event.start.toISOString(),
            end_time: event.end.toISOString(),
            is_online: event.extendedProps.isOnline,
            location: event.extendedProps.location,
            participant_ids: event.extendedProps.participantIds,
            exception_dates: [event.start.toISOString().split('T')[0]]
          }
          await updateSchedule({ id: event.extendedProps.original_id, ...newEvent })
        } catch (error) {
          console.error('予定の更新に失敗しました:', error)
          dropInfo.revert()
        }
      } else {
        // 繰り返し予定全体を移動
        try {
          const originalEvent = schedules.find(s => s.id === event.extendedProps.original_id)
          if (originalEvent) {
            const minutesDelta = differenceInMinutes(event.start, new Date(originalEvent.start_time))
            await updateSchedule({
              id: event.extendedProps.original_id,
              start_time: event.start.toISOString(),
              end_time: event.end.toISOString()
            })
          }
        } catch (error) {
          console.error('予定の更新に失敗しました:', error)
          dropInfo.revert()
        }
      }
    } else {
      // 通常の予定の移動
      try {
        await updateSchedule({
          id: event.id,
          start_time: event.start.toISOString(),
          end_time: event.end.toISOString()
        })
      } catch (error) {
        console.error('予定の更新に失敗しました:', error)
        dropInfo.revert()
      }
    }
  }

  const handleEventResize = async (resizeInfo: any) => {
    const event = resizeInfo.event
    
    try {
      await updateSchedule({
        id: event.id,
        start_time: event.start.toISOString(),
        end_time: event.end.toISOString()
      })
    } catch (error) {
      console.error('予定の更新に失敗しました:', error)
      resizeInfo.revert()
    }
  }

  const events = schedules?.map(schedule => ({
    id: schedule.recurrence_id || schedule.id,
    title: schedule.title,
    start: schedule.start_time,
    end: schedule.end_time,
    backgroundColor: schedule.is_online ? '#3B82F6' : '#10B981',
    borderColor: schedule.is_online ? '#2563EB' : '#059669',
    extendedProps: {
      description: schedule.description,
      isOnline: schedule.is_online,
      location: schedule.location,
      creatorId: schedule.creator_id,
      participantIds: schedule.participant_ids,
      participantStatus: schedule.participant_status,
      original_id: schedule.original_id,
      rrule: schedule.rrule
    },
    editable: schedule.creator_id === user?.id
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
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          editable={true}
          loading={isLoading}
        />
      </div>
      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
          initialData={selectedEvent}
          currentUserId={user?.id || ''}
          onSubmit={async (eventData) => {
            try {
              if (selectedEvent?.id) {
                await updateSchedule({
                  id: selectedEvent.id,
                  ...eventData
                })
              }
              setShowEventModal(false)
              setSelectedEvent(null)
            } catch (error) {
              console.error('予定の更新に失敗しました:', error)
            }
          }}
        />
      )}
    </div>
  )
} 