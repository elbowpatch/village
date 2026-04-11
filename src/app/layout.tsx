import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CC — Your Community',
  description: 'CC — connect, share, and vibe with your community.',
  icons: {
    icon: [
      { url: '/cc-logo.png', type: 'image/png', sizes: '32x32' },
      { url: '/cc-logo.png', sizes: 'any' },
    ],
    apple: { url: '/cc-logo.png', sizes: '180x180' },
    shortcut: '/cc-logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/cc-logo.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/cc-logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
