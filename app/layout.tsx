import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Game For Genius',
  description: 'Game For Genius',
  generator: 'v0.dev',
  // 设置 favicon 和其他平台图标
  icons: {
    icon: '/favicon.ico', // 默认favicon
    apple: '/apple-touch-icon.png', // 苹果设备的桌面图标
    android: '/android-chrome-192x192.png', // 安卓设备图标
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png', // 32x32 版本的 favicon
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png', // 16x16 版本的 favicon
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest', // 网站的 web app 配置文件
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  )
}
