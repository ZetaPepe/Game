import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Game For Genius',
  description: 'Game For Genius',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* 设置favicon图标 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
