import { formatSlackMessage, sendSlackNotification } from '../notifications'

describe('notifications', () => {
  const mockSchedule = {
    id: 'test-schedule-id',
    title: 'テストミーティング',
    start_time: '2024-02-20T10:00:00',
    end_time: '2024-02-20T11:00:00',
    description: 'テストの説明'
  }

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
  })

  describe('formatSlackMessage', () => {
    it('formats create message correctly', () => {
      const message = formatSlackMessage(mockSchedule, 'create')
      
      expect(message).toContain('📅 スケジュール追加のお知らせ')
      expect(message).toContain('📌 イベント名: テストミーティング')
      expect(message).toContain('📅 日付: 2024/02/20')
      expect(message).toContain('🕒 時間: 10:00')
      expect(message).toContain('🔗 詳細: https://example.com/schedule/test-schedule-id')
      expect(message).toContain('❗予定の確認をお願いします。')
    })

    it('formats update message correctly', () => {
      const message = formatSlackMessage(mockSchedule, 'update')
      expect(message).toContain('🔄 スケジュール更新のお知らせ')
    })

    it('formats status change message correctly', () => {
      const message = formatSlackMessage(mockSchedule, 'status_change')
      expect(message).toContain('👥 参加ステータス更新のお知らせ')
    })
  })

  describe('sendSlackNotification', () => {
    const mockFetch = jest.fn()
    global.fetch = mockFetch

    beforeEach(() => {
      mockFetch.mockClear()
      mockFetch.mockResolvedValue({ ok: true })
    })

    it('sends notification without mention', async () => {
      await sendSlackNotification(
        'https://hooks.slack.com/services/xxx',
        'テストメッセージ',
        'none'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/xxx',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: '\nテストメッセージ'
          })
        })
      )
    })

    it('sends notification with direct mention', async () => {
      await sendSlackNotification(
        'https://hooks.slack.com/services/xxx',
        'テストメッセージ',
        'direct',
        ['U123', 'U456']
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/xxx',
        expect.objectContaining({
          body: JSON.stringify({
            text: '<@U123> <@U456>\nテストメッセージ'
          })
        })
      )
    })

    it('sends notification with here mention', async () => {
      await sendSlackNotification(
        'https://hooks.slack.com/services/xxx',
        'テストメッセージ',
        'here'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/xxx',
        expect.objectContaining({
          body: JSON.stringify({
            text: '<!here>\nテストメッセージ'
          })
        })
      )
    })

    it('sends notification with channel mention', async () => {
      await sendSlackNotification(
        'https://hooks.slack.com/services/xxx',
        'テストメッセージ',
        'channel'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/xxx',
        expect.objectContaining({
          body: JSON.stringify({
            text: '<!channel>\nテストメッセージ'
          })
        })
      )
    })

    it('handles error when notification fails', async () => {
      mockFetch.mockResolvedValue({ ok: false })
      
      await expect(
        sendSlackNotification(
          'https://hooks.slack.com/services/xxx',
          'テストメッセージ',
          'none'
        )
      ).rejects.toThrow('Slack通知の送信に失敗しました')
    })

    it('handles network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      await expect(
        sendSlackNotification(
          'https://hooks.slack.com/services/xxx',
          'テストメッセージ',
          'none'
        )
      ).rejects.toThrow()
    })
  })
}) 