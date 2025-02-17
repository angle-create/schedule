'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { EventSourceInput, DateSelectArg, EventClickArg, EventDropArg, EventResizeDuringDragArg } from '@fullcalendar/core'
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
    
    // 権限チェック
    const hasPermission = canEditSchedule({
      id: event.id,
      creator_id: event.extendedProps.creatorId,
      participant_ids: event.extendedProps.participantIds
    }, user)

    if (!hasPermission) {
      dropInfo.revert()
      alert('この予定を編集する権限がありません')
      return
    }

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
  }, [schedules, updateSchedule, user])

  const handleEventResize = useCallback(async (resizeInfo: EventResizeDuringDragArg) => {
    const event = resizeInfo.event
    
    // 権限チェック
    const hasPermission = canEditSchedule({
      id: event.id,
      creator_id: event.extendedProps.creatorId,
      participant_ids: event.extendedProps.participantIds
    }, user)

    if (!hasPermission) {
      resizeInfo.revert()
      alert('この予定を編集する権限がありません')
      return
    }

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
  }, [updateSchedule, user])

  const getEventColors = useCallback((schedule: any) => {
    // 自分が作成した予定
    if (schedule.creator_id === user?.id) {
      return eventColors.created;
    }

    // 参加ステータスによる色分け
    if (schedule.participant_status) {
      return eventColors[schedule.participant_status];
    }

    // オンライン/オフラインの色分け
    return schedule.is_online ? eventColors.online : eventColors.offline;
  }, [user?.id])

  const events: EventSourceInput = schedules?.map(schedule => ({
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
    editable: canEditSchedule({
      id: schedule.id,
      creator_id: schedule.creator_id,
      participant_ids: schedule.participant_ids
    }, user)
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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <ViewFilter currentView={view} onViewChange={setView} />
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#8B5CF6]"></span>
            <span>作成した予定</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
            <span>未回答</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
            <span>参加</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
            <span>不参加</span>
          </div>
        </div>
      </div>
      <div className="mt-4 h-[600px]">
        <FullCalendarComponent
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin
          ]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          height="100%"
          firstDay={1}
          allDaySlot={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          expandRows={true}
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
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
            day: 'numeric'
          }}
          titleFormat={{
            year: 'numeric',
            month: 'long'
          }}
          views={{
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
            },
            timeGridDay: {
              titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
            }
          }}
          eventClassNames="text-gray-800"
          dayCellClassNames="text-gray-800"
          slotLabelClassNames="text-gray-800"
          dayHeaderClassNames="text-gray-800"
          viewClassNames="text-gray-800"
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