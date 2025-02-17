import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useParticipantAvailability } from '@/hooks/useParticipantAvailability';
import { useUsers } from '@/hooks/useUsers';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { NotificationSettingsForm } from './NotificationSettingsForm';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: EventData) => void;
  initialData?: EventData;
  currentUserId: string;
}

interface EventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  participantIds: string[];
  location?: string;
  isOnline: boolean;
  notificationSettings?: {
    slackChannel?: string;
    slackMentionType?: 'none' | 'direct' | 'here' | 'channel';
    emailNotifications?: boolean;
    systemNotifications?: boolean;
    reminderBeforeMinutes?: number;
  };
}

export const EventModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  currentUserId
}: EventModalProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startTime, setStartTime] = useState<Date>(
    initialData?.startTime || new Date()
  );
  const [endTime, setEndTime] = useState<Date>(
    initialData?.endTime || new Date()
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    initialData?.participantIds || []
  );
  const [location, setLocation] = useState(initialData?.location || '');
  const [isOnline, setIsOnline] = useState(initialData?.isOnline || false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const { users, isLoading: isLoadingUsers } = useUsers();
  const { availabilities, isLoading: isLoadingAvailabilities } = useParticipantAvailability(
    selectedParticipants,
    startTime,
    endTime
  );
  const { settings: notificationSettings, updateSettings: updateNotificationSettings } = useNotificationSettings(currentUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      startTime,
      endTime,
      participantIds: selectedParticipants,
      location,
      isOnline,
      notificationSettings: {
        slackChannel: notificationSettings?.slackChannel,
        slackMentionType: notificationSettings?.slackMentionType,
        emailNotifications: notificationSettings?.emailNotifications,
        systemNotifications: notificationSettings?.systemNotifications,
        reminderBeforeMinutes: notificationSettings?.reminderBeforeMinutes
      }
    });
    onClose();
  };

  const handleParticipantToggle = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-4">
            {initialData ? 'スケジュールを編集' : '新しいスケジュール'}
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                タイトル *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                説明
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-md px-3 py-2 h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                  開始時間 *
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  value={startTime.toISOString().slice(0, 16)}
                  onChange={(e) => setStartTime(new Date(e.target.value))}
                  required
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium mb-1">
                  終了時間 *
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime.toISOString().slice(0, 16)}
                  onChange={(e) => setEndTime(new Date(e.target.value))}
                  required
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">
                場所
              </label>
              <div className="flex items-center space-x-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={!isOnline}
                    onChange={() => setIsOnline(false)}
                    className="rounded-full border-gray-300"
                  />
                  <span className="text-sm">オフライン</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={isOnline}
                    onChange={() => setIsOnline(true)}
                    className="rounded-full border-gray-300"
                  />
                  <span className="text-sm">オンライン</span>
                </label>
              </div>
              {!isOnline && (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="場所を入力"
                  className="w-full border rounded-md px-3 py-2"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                参加者
              </label>
              {isLoadingUsers ? (
                <p>Loading users...</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {users?.map(user => {
                    const availability = availabilities.find(a => a.userId === user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(user.id)}
                            onChange={() => handleParticipantToggle(user.id)}
                            className="rounded border-gray-300"
                          />
                          <span>{user.display_name}</span>
                        </label>
                        {selectedParticipants.includes(user.id) && (
                          <span className={`text-sm ${
                            isLoadingAvailabilities
                              ? 'text-gray-400'
                              : availability?.isAvailable
                                ? 'text-green-500'
                                : 'text-red-500'
                          }`}>
                            {isLoadingAvailabilities
                              ? '確認中...'
                              : availability?.isAvailable
                                ? '空き有り'
                                : '予定有り'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {showNotificationSettings ? '通知設定を閉じる' : '通知設定を開く'}
              </button>
              {showNotificationSettings && (
                <div className="mt-2 p-4 border rounded-md">
                  <NotificationSettingsForm
                    settings={notificationSettings}
                    onUpdate={updateNotificationSettings}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {initialData ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
