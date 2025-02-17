interface Timezone {
  value: string
  label: string
}

export const useTimezones = () => {
  const timezones: Timezone[] = [
    { value: 'Asia/Tokyo', label: '東京 (UTC+9)' },
    { value: 'Asia/Seoul', label: 'ソウル (UTC+9)' },
    { value: 'Asia/Shanghai', label: '上海 (UTC+8)' },
    { value: 'Asia/Singapore', label: 'シンガポール (UTC+8)' },
    { value: 'Australia/Sydney', label: 'シドニー (UTC+10/11)' },
    { value: 'Europe/London', label: 'ロンドン (UTC+0/1)' },
    { value: 'Europe/Paris', label: 'パリ (UTC+1/2)' },
    { value: 'America/New_York', label: 'ニューヨーク (UTC-5/4)' },
    { value: 'America/Los_Angeles', label: 'ロサンゼルス (UTC-8/7)' },
    { value: 'Pacific/Honolulu', label: 'ホノルル (UTC-10)' }
  ]

  return { timezones }
} 