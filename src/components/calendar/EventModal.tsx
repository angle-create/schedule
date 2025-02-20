import { useState } from 'react'
import { format } from 'date-fns'
import * as Dialog from '@radix-ui/react-dialog'
import { useScheduleMutation } from '@/hooks/useScheduleMutation'
import { useUsers } from '@/hooks/useUsers'
import { useTimezones } from '@/hooks/useTimezones'

interface EventModalProps {
  date: Date
  onClose: () => void
  event?: {
    id: string
    title: string
    description?: string
    start: Date
    end: Date
    isOnline: boolean
    location?: string
    participants?: string[]
    timezone?: string
    notifications?: {
      slack: boolean
      email: boolean
      system: boolean
    }
  }
}

export const EventModal = ({ date, onClose, event }: EventModalProps) => {
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [startTime, setStartTime] = useState(
    format(event?.start || date, "yyyy-MM-dd'T'HH:mm")
  )
  const [endTime, setEndTime] = useState(
    format(
      event?.end || new Date(date.getTime() + 60 * 60 * 1000),
      "yyyy-MM-dd'T'HH:mm"
    )
  )
  const [isOnline, setIsOnline] = useState(event?.isOnline || false)
  const [location, setLocation] = useState(event?.location || '')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    event?.participants || []
  )
  const [timezone, setTimezone] = useState(event?.timezone || 'Asia/Tokyo')
  const [notifications, setNotifications] = useState(event?.notifications || {
    slack: true,
    email: true,
    system: true
  })

  const { createSchedule, updateSchedule, isLoading } = useScheduleMutation()
  const { users } = useUsers()
  const { timezones } = useTimezones()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const scheduleData = {
      title,
      description,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      is_online: isOnline,
      location,
      timezone,
      participants: selectedParticipants,
      notifications
    }

    try {
      if (event) {
        await updateSchedule({ id: event.id, ...scheduleData })
      } else {
        await createSchedule(scheduleData)
      }
      onClose()
    } catch (error) {
      console.error('予定の保存に失敗しました:', error)
    }
  }

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold mb-4">
            {event ? '予定を編集' : '新しい予定'}
          </Dialog.Title>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    開始時間
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    終了時間
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  タイムゾーン
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    オンラインミーティング
                  </span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={isOnline ? "URLを入力" : "場所を入力"}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  参加者
                </label>
                <select
                  multiple
                  value={selectedParticipants}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(option => option.value)
                    setSelectedParticipants(selected)
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知設定
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notifications.slack}
                      onChange={(e) => setNotifications(prev => ({
                        ...prev,
                        slack: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Slack通知
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => setNotifications(prev => ({
                        ...prev,
                        email: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      メール通知
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notifications.system}
                      onChange={(e) => setNotifications(prev => ({
                        ...prev,
                        system: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      システム内通知
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 