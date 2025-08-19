import type { Metadata } from 'next'
import './globals.css'

// 使用系统字体替代Google Fonts，避免网络依赖
const fontClass = 'font-sans'

export const metadata: Metadata = {
  title: 'AI产品经理 - 从想法到实现的完整解决方案',
  description: '基于AI的端到端产品开发助手，提供智能问答、需求确认、PRD生成和编程解决方案',
  keywords: 'AI产品经理,产品需求文档,PRD生成,智能问答,编程解决方案,产品开发',
  authors: [{ name: 'AI产品经理团队' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#667eea',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className={fontClass}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* 背景装饰 */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-4 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-4 right-1/3 w-72 h-72 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
          </div>

          {/* 主要内容 */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
