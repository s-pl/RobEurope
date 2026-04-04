import { Bot } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-foreground hover:text-blue-600 transition-colors">
          <Bot className="h-6 w-6 text-blue-600" />
          RobEurope
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} RobEurope · Plataforma europea de robótica educativa
      </footer>
    </div>
  )
}
