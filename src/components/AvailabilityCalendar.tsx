import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useParticipantAvailability } from '@/hooks/useParticipantAvailability';
import { EventInput } from '@fullcalendar/core';

interface AvailabilityCalendarProps {
  participantIds: string[];
  startDate: Date;
  endDate: Date;
}

export const AvailabilityCalendar = ({
  participantIds,
  startDate,
  endDate
}: AvailabilityCalendarProps) => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const { availabilities, isLoading } = useParticipantAvailability(
    participantIds,
    startDate,
    endDate
  );

  useEffect(() => {
    if (!isLoading && availabilities.length > 0) {
      const newEvents = availabilities.flatMap(availability => 
        availability.schedules.map(schedule => ({
          title: `${availability.displayName}の予定`,
          start: schedule.start_time,
          end: schedule.end_time,
          backgroundColor: '#FDA4AF',
          borderColor: '#F43F5E',
          textColor: '#000000'
        }))
      );
      setEvents(newEvents);
    }
  }, [availabilities, isLoading]);

  return (
    <div className="h-[600px] bg-white rounded-lg shadow-sm p-4">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <p>Loading...</p>
        </div>
      ) : (
        <FullCalendar
          plugins={[timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
          }}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          events={events}
          locale="ja"
          allDaySlot={false}
          nowIndicator
          height="100%"
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
          }}
        />
      )}
    </div>
  );
}; 