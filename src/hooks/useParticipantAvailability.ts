import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_id: string;
}

interface ParticipantAvailability {
  userId: string;
  displayName: string;
  schedules: Schedule[];
  isAvailable: boolean;
}

export const useParticipantAvailability = (
  participantIds: string[],
  startTime: Date,
  endTime: Date
) => {
  const [availabilities, setAvailabilities] = useState<ParticipantAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 参加者の情報を取得
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, display_name')
          .in('id', participantIds);

        if (usersError) throw usersError;

        // 各参加者のスケジュールを取得
        const availabilityPromises = users.map(async (user) => {
          const { data: schedules, error: schedulesError } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', user.id)
            .or(`start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()}`);

          if (schedulesError) throw schedulesError;

          // スケジュールの重複をチェック
          const isAvailable = !schedules.some(schedule => {
            const scheduleStart = new Date(schedule.start_time);
            const scheduleEnd = new Date(schedule.end_time);
            return (
              (scheduleStart <= endTime && scheduleEnd >= startTime) ||
              (scheduleStart >= startTime && scheduleStart <= endTime) ||
              (scheduleEnd >= startTime && scheduleEnd <= endTime)
            );
          });

          return {
            userId: user.id,
            displayName: user.display_name,
            schedules,
            isAvailable
          };
        });

        const results = await Promise.all(availabilityPromises);
        setAvailabilities(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    if (participantIds.length > 0) {
      fetchAvailabilities();
    } else {
      setAvailabilities([]);
      setIsLoading(false);
    }
  }, [participantIds, startTime, endTime]);

  return { availabilities, isLoading, error };
}; 