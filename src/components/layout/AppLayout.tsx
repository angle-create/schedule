'use client'

import { ReactNode } from 'react'
import { Navigation } from './Navigation'

interface AppLayoutProps {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="p-4 sm:ml-64 mt-16">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
} 