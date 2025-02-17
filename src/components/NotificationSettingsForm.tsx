import { useState } from 'react';
import type { NotificationSettings } from '@/hooks/useNotificationSettings';

interface NotificationSettingsFormProps {
  settings: NotificationSettings | null;
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>;
  isLoading?: boolean;
}

export const NotificationSettingsForm = ({
  settings,
  onUpdate,
  isLoading = false
}: NotificationSettingsFormProps) => {
  const [slackChannel, setSlackChannel] = useState(settings?.slackChannel || '');
  const [slackMentionType, setSlackMentionType] = useState<NotificationSettings['slackMentionType']>(
    settings?.slackMentionType || 'none'
  );
  const [emailNotifications, setEmailNotifications] = useState(
    settings?.emailNotifications ?? true
  );
  const [systemNotifications, setSystemNotifications] = useState(
    settings?.systemNotifications ?? true
  );
  const [reminderBeforeMinutes, setReminderBeforeMinutes] = useState(
    settings?.reminderBeforeMinutes || 15
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      slackChannel,
      slackMentionType,
      emailNotifications,
      systemNotifications,
      reminderBeforeMinutes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Slack通知
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={slackChannel || ''}
            onChange={(e) => setSlackChannel(e.target.value)}
            placeholder="Slackチャンネル名"
            className="w-full border rounded-md px-3 py-2"
          />
          <select
            value={slackMentionType}
            onChange={(e) => setSlackMentionType(e.target.value as NotificationSettings['slackMentionType'])}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="none">メンションなし</option>
            <option value="direct">個別メンション</option>
            <option value="here">@here</option>
            <option value="channel">@channel</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm">メール通知</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={systemNotifications}
            onChange={(e) => setSystemNotifications(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm">システム内通知</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          リマインダー（何分前）
        </label>
        <select
          value={reminderBeforeMinutes}
          onChange={(e) => setReminderBeforeMinutes(Number(e.target.value))}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value={5}>5分前</option>
          <option value={10}>10分前</option>
          <option value={15}>15分前</option>
          <option value={30}>30分前</option>
          <option value={60}>1時間前</option>
        </select>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? '更新中...' : '設定を保存'}
        </button>
      </div>
    </form>
  );
}; 