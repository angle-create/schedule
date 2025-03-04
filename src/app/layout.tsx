import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { RootLayoutClient } from '@/components/layout/RootLayoutClient'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '社内スケジュール管理システム',
  description: '社内の予定を効率的に管理するためのシステム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="light">
      <body className={inter.className}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}
