import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rendezvous — Your Community',
  description: 'A community platform for creators, thinkers, and explorers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
