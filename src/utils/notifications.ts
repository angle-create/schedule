import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Schedule {
  id: string
  title: string
  start_time: string
  end_time: string
  description?: string
}

export const formatSlackMessage = (schedule: Schedule, type: 'create' | 'update' | 'status_change') => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const scheduleUrl = `${baseUrl}/schedule/${schedule.id}`
  const startDate = new Date(schedule.start_time)

  const messageTypes = {
    create: '📅 スケジュール追加のお知らせ',
    update: '🔄 スケジュール更新のお知らせ',
    status_change: '👥 参加ステータス更新のお知らせ'
  }

  return `${messageTypes[type]}
━━━━━━━━━━━━━━━━━━
📌 イベント名: ${schedule.title}
📅 日付: ${format(startDate, 'yyyy/MM/dd', { locale: ja })}
🕒 時間: ${format(startDate, 'HH:mm', { locale: ja })}
🔗 詳細: ${scheduleUrl}

❗予定の確認をお願いします。`
}

export const sendSlackNotification = async (
  webhookUrl: string,
  message: string,
  mentionType: 'none' | 'direct' | 'here' | 'channel',
  userIds?: string[]
) => {
  const mention = {
    none: '',
    direct: userIds ? userIds.map(id => `<@${id}>`).join(' ') : '',
    here: '<!here>',
    channel: '<!channel>'
  }

  const payload = {
    text: `${mention[mentionType]}\n${message}`
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Slack通知の送信に失敗しました')
    }
  } catch (error) {
    console.error('Slack通知の送信に失敗しました:', error)
    throw error
  }
} 