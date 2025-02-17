import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface NotificationSettings {
  id: string;
  userId: string;
  slackChannel: string | null;
  slackMentionType: 'none' | 'direct' | 'here' | 'channel';
  emailNotifications: boolean;
  systemNotifications: boolean;
  reminderBeforeMinutes: number;
}

interface UseNotificationSettingsReturn {
  settings: NotificationSettings | null;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
}

export const useNotificationSettings = (userId: string): UseNotificationSettingsReturn => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setSettings({
            id: data.id,
            userId: data.user_id,
            slackChannel: data.slack_channel,
            slackMentionType: data.slack_mention_type,
            emailNotifications: data.email_notifications,
            systemNotifications: data.system_notifications,
            reminderBeforeMinutes: data.reminder_before_minutes
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchSettings();
    }
  }, [userId]);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          slack_channel: newSettings.slackChannel,
          slack_mention_type: newSettings.slackMentionType,
          email_notifications: newSettings.emailNotifications,
          system_notifications: newSettings.systemNotifications,
          reminder_before_minutes: newSettings.reminderBeforeMinutes
        });

      if (updateError) throw updateError;

      // 更新後の設定を再取得
      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          slackChannel: data.slack_channel,
          slackMentionType: data.slack_mention_type,
          emailNotifications: data.email_notifications,
          systemNotifications: data.system_notifications,
          reminderBeforeMinutes: data.reminder_before_minutes
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    }
  };

  return { settings, isLoading, error, updateSettings };
}; 