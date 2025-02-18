'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { EventSourceInput, DateSelectArg, EventClickArg, EventDropArg, EventResizeDuringDragArg } from '@fullcalendar/core'
import { EventResizeArg, EventResizeDoneArg } from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import jaLocale from '@fullcalendar/core/locales/ja'
import { EventModal } from './EventModal'
import { useSchedules } from '@/hooks/useSchedules'
import { useScheduleMutation } from '@/hooks/useScheduleMutation'
import { useAuth } from '@/hooks/useAuth'
import { differenceInMinutes } from 'date-fns'
import { eventColors } from '@/utils/eventColors'
import { canEditSchedule } from '@/utils/permissions'

// FullCalendarをクライアントサイドでのみ読み込むように設定
const FullCalendarComponent = dynamic(
  () => import('@fullcalendar/react'),
  { 
    ssr: false,
    loading: () => <div className="h-[600px] bg-white rounded-lg shadow-sm p-4 flex items-center justify-center">Loading...</div>
  }
)

// 型定義の追加
interface ExpandedSchedule {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  is_online: boolean
  location?: string
  creator_id: string
  participant_ids?: string[]
  participant_status?: string
  original_id?: string
  rrule?: string
  recurrence_id?: string
}

interface UpdateScheduleData {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  is_online: boolean
  location?: string
  participant_ids?: string[]
  exception_dates?: string[]
}

interface Schedule {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  is_online: boolean
  location?: string
  creator_id: string
  participant_ids?: string[]
  participant_status?: 'pending' | 'accepted' | 'declined'
  original_id?: string
  rrule?: string
  recurrence_id?: string
}

interface ScheduleEventColors {
  backgroundColor: string
  borderColor: string
  textColor: string
}

interface EventColors {
  online: ScheduleEventColors
  offline: ScheduleEventColors
  pending: ScheduleEventColors
  accepted: ScheduleEventColors
  declined: ScheduleEventColors
  created: ScheduleEventColors
  [key: string]: ScheduleEventColors
}

interface EventModalProps {
  onClose: () => void
  initialData: Schedule | null
  currentUserId: string
  onSubmit: (eventData: UpdateScheduleData) => Promise<void>
}

export const Calendar = () => {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const { schedules, isLoading, error } = useSchedules()
  const { updateSchedule } = useScheduleMutation()
  const { user } = useAuth()

  // イベントハンドラーをuseCallbackでメモ化
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start)
    setSelectedEvent(null)
    setShowEventModal(true)
  }, [])

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
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
  }, [])

  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const event = dropInfo.event
    if (!event.start || !event.end) {
      dropInfo.revert()
      return
    }
    
    try {
      await updateSchedule({
        id: event.id,
        title: event.title,
        is_online: event.extendedProps.isOnline,
        start_time: event.start.toISOString(),
        end_time: event.end.toISOString()
      })
    } catch (error) {
      console.error('予定の更新に失敗しました:', error)
      dropInfo.revert()
    }
  }, [updateSchedule])

  const handleEventResize = useCallback(async (resizeInfo: EventResizeDoneArg) => {
    const event = resizeInfo.event
    if (!event.start || !event.end) {
      resizeInfo.revert()
      return
    }
    
    try {
      await updateSchedule({
        id: event.id,
        title: event.title,
        is_online: event.extendedProps.isOnline,
        start_time: event.start.toISOString(),
        end_time: event.end.toISOString()
      })
    } catch (error) {
      console.error('予定の更新に失敗しました:', error)
      resizeInfo.revert()
    }
  }, [updateSchedule, user])

  const getEventColors = useCallback((schedule: Schedule) => {
    // 自分が作成した予定
    if (schedule.creator_id === user?.id) {
      return eventColors.created
    }

    // 参加ステータスによる色分け
    if (schedule.participant_status && eventColors[schedule.participant_status]) {
      return eventColors[schedule.participant_status]
    }

    // オンライン/オフラインの色分け
    return schedule.is_online ? eventColors.online : eventColors.offline
  }, [user?.id])

  const events: EventSourceInput = schedules?.map((schedule: Schedule) => ({
    id: schedule.recurrence_id || schedule.id,
    title: schedule.title,
    start: schedule.start_time,
    end: schedule.end_time,
    backgroundColor: getEventColors(schedule).backgroundColor,
    borderColor: getEventColors(schedule).borderColor,
    textColor: getEventColors(schedule).textColor,
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
    editable: canEditSchedule(schedule, user)
  })) || []

  const renderEventContent = useCallback((eventInfo: any) => {
    const { event } = eventInfo
    return (
      <>
        {event.title}
      </>
    )
  }, [])

  if (error) {
    return <div className="text-red-500">エラーが発生しました</div>
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="flex-none flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">カレンダー</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#8B5CF6]"></span>
            <span className="text-gray-600">作成した予定</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
            <span className="text-gray-600">未回答</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
            <span className="text-gray-600">参加</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
            <span className="text-gray-600">不参加</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-xl p-4 min-h-0">
        <style>{`
          .fc {
            background: transparent;
            height: 100% !important;
          }
          .fc .fc-toolbar-title {
            color: #1f2937;
            font-size: 1.25rem;
            font-weight: 700;
          }
          .fc .fc-button {
            background-color: transparent;
            border: none;
            color: #4b5563;
            padding: 0.5rem;
            transition: background-color 0.2s;
            border-radius: 0.5rem;
          }
          .fc .fc-button:hover {
            background-color: #f3f4f6;
          }
          .fc .fc-today-button {
            padding: 0.25rem 0.5rem;
            background-color: transparent !important;
            color: #4b5563 !important;
            font-weight: 500;
            margin: 0 !important;
            white-space: nowrap;
          }
          .fc .fc-today-button:hover {
            background-color: #f3f4f6 !important;
            border-color: transparent !important;
          }
          .fc .fc-prev-button,
          .fc .fc-next-button {
            background-color: transparent !important;
            border: none !important;
            color: #4b5563 !important;
            padding: 0.25rem !important;
            font-size: 1rem !important;
            width: 1.75rem !important;
            height: 1.75rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .fc .fc-prev-button::after,
          .fc .fc-next-button::after {
            content: "←" !important;
            font-family: system-ui, -apple-system, sans-serif !important;
          }
          .fc .fc-next-button::after {
            content: "→" !important;
          }
          .fc .fc-icon {
            display: none !important;
          }
          .fc .fc-prev-button:hover,
          .fc .fc-next-button:hover {
            background-color: #f3f4f6 !important;
          }
          .fc .fc-button-primary:not(:disabled).fc-button-active,
          .fc .fc-button-primary:not(:disabled):active {
            background-color: #4f46e5;
            color: white;
          }
          .fc .fc-daygrid-day.fc-day-today {
            background-color: transparent;
          }
          .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
            background-color: #4f46e5;
            color: white;
            border-radius: 0.5rem;
          }
          .fc .fc-daygrid-day-frame {
            padding: 0.5rem;
          }
          .fc .fc-daygrid-day-number {
            font-size: 0.875rem;
            color: #4b5563;
            padding: 0.25rem 0.5rem;
            border-radius: 0.5rem;
            transition: background-color 0.2s;
          }
          .fc .fc-daygrid-day-number:hover {
            background-color: #f3f4f6;
          }
          .fc .fc-col-header-cell {
            padding: 0.25rem 0 !important;
            font-size: 0.75rem !important;
            font-weight: 500;
            color: #4b5563;
          }
          .fc .fc-toolbar {
            margin-bottom: 0.5rem !important;
          }
          .fc .fc-toolbar-chunk {
            display: flex;
            gap: 0;
            align-items: center;
          }
          .fc .fc-toolbar-chunk:first-child {
            display: flex;
            gap: 0;
            width: 8rem;
            justify-content: space-between;
          }
          .fc .fc-toolbar-chunk:first-child .fc-button {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .fc .fc-view-harness {
            height: calc(100% - 3rem) !important;
          }
          .fc .fc-scrollgrid {
            height: 100% !important;
            border: none !important;
          }
          .fc .fc-scrollgrid-section-header {
            height: 1.75rem !important;
          }
          .fc .fc-scrollgrid-section-body {
            height: calc(100% - 1.75rem) !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-body {
            height: 100% !important;
            min-height: 0 !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-body > table {
            height: 100% !important;
          }
          .fc-dayGridMonth-view .fc-scrollgrid-sync-table {
            height: 100% !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-body > table > tbody {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-body > table > tbody > tr {
            flex: 1 1 0 !important;
            display: flex !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-body > table > tbody > tr > td {
            flex: 1 1 0 !important;
            height: auto !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-day-frame {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: 0 !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-day-top {
            flex: 0 0 auto !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-day-events {
            flex: 1 1 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-day-bottom {
            flex: 0 0 auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border: 1px solid #f0f1f3 !important;
          }
          .fc-theme-standard .fc-scrollgrid {
            border: 1px solid #f0f1f3 !important;
          }
          .fc .fc-scrollgrid-section-sticky > * {
            background: #fff !important;
          }
          .fc-col-header-cell {
            background-color: #f9fafb !important;
            border: none !important;
          }
          .fc-day-other {
            background-color: #f9fafb !important;
          }
          .fc-day-today {
            background-color: #eef2ff !important;
          }
          .fc-daygrid-day-number {
            font-weight: 500 !important;
          }
          .fc-day-today .fc-daygrid-day-number {
            background-color: #4f46e5 !important;
            color: white !important;
            font-weight: 600 !important;
          }
        `}</style>
        <FullCalendarComponent
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin
          ]}
          initialView={view}
          fixedWeekCount={false}
          showNonCurrentDates={true}
          headerToolbar={{
            left: 'prev today next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          datesSet={(dateInfo) => {
            setView(dateInfo.view.type as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay')
          }}
          height="100%"
          aspectRatio={1.35}
          expandRows={true}
          dayMaxEventRows={true}
          dayMaxEvents={4}
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          selectable={true}
          selectMirror={true}
          weekends={true}
          locale="ja"
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
          }}
          buttonText={{
            today: '今日'
          }}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
          }}
          dayHeaderFormat={{
            weekday: 'short',
            month: 'numeric',
            day: 'numeric',
            omitCommas: true
          }}
          titleFormat={{
            year: 'numeric',
            month: 'long'
          }}
          views={{
            dayGridMonth: { 
              buttonText: '月',
              dayHeaderFormat: { weekday: 'short' },
              fixedWeekCount: true,
              height: '100%'
            },
            timeGridWeek: { buttonText: '週' },
            timeGridDay: { buttonText: '日' }
          }}
          eventClassNames="text-gray-800"
          dayCellClassNames="text-gray-800 h-24"
          slotLabelClassNames="text-gray-800"
          dayHeaderClassNames="text-gray-800 py-2"
          viewClassNames="text-gray-800"
          headerClassNames={{
            toolbar: 'text-gray-800 font-bold'
          }}
          buttonClassNames={{
            today: 'bg-white hover:bg-gray-100',
            prev: 'bg-white hover:bg-gray-100',
            next: 'bg-white hover:bg-gray-100',
            dayGridMonth: 'bg-white hover:bg-gray-100',
            timeGridWeek: 'bg-white hover:bg-gray-100',
            timeGridDay: 'bg-white hover:bg-gray-100'
          }}
        />
      </div>
      {showEventModal && (
        <EventModal
          {...{
            onClose: () => {
              setShowEventModal(false)
              setSelectedEvent(null)
            },
            initialData: selectedEvent,
            currentUserId: user?.id || '',
            onSubmit: async (eventData: UpdateScheduleData) => {
              try {
                if (selectedEvent?.id) {
                  await updateSchedule(eventData)
                }
                setShowEventModal(false)
                setSelectedEvent(null)
              } catch (error) {
                console.error('予定の更新に失敗しました:', error)
              }
            }
          }}
        />
      )}
    </div>
  )
} 