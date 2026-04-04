import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'RobEurope', template: '%s · RobEurope' },
  description: 'Plataforma europea de robótica educativa para equipos, competiciones y comunidad.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // lang and dark class are set by [locale]/layout + ThemeProvider
    <html suppressHydrationWarning>
      <body className={`${bricolage.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  )
}
