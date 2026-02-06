import React from "react"
import type { Metadata } from 'next'
import { IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from '../components/providers'

const _ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '500', '600', '700'], subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ZYNX - Non-Custodial Onchain Strategy Builder',
  description: 'Create non-custodial automations for smart contracts. IF/THEN rules with permissionless execution.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
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
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
