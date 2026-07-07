import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Curve Engine',
  description: 'Fixed income curve engine and bond analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center gap-8">
          <span className="text-white font-semibold tracking-tight text-sm">
            CURVE ENGINE
          </span>
          <div className="flex gap-6 text-sm">
            <Link
              href="/curve"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Curve
            </Link>
            <Link
              href="/bond"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Bond Analyzer
            </Link>
            <Link
              href="/risk"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Risk Tools
            </Link>
          </div>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  )
}