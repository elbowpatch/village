import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChitChat — Your Community',
  description: 'ChitChat — connect, share, and vibe with your community.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/chitchat-logo.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: { url: '/chitchat-logo.png', sizes: '180x180' },
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/chitchat-logo.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/chitchat-logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
