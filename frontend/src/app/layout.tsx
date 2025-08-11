import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers/Providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Riskon - Real-time Prediction Market',
  description:
    'Fast-paced binary prediction market on Somnia blockchain. Bet on price movements in 3-minute rounds.',
  keywords: ['prediction market', 'DeFi', 'Somnia', 'blockchain', 'trading'],
  authors: [{ name: 'Riskon Team' }],
  openGraph: {
    title: 'Riskon - Real-time Prediction Market',
    description: 'Fast-paced binary prediction market on Somnia blockchain',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riskon - Real-time Prediction Market',
    description: 'Fast-paced binary prediction market on Somnia blockchain',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
