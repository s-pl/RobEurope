import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'

interface AppLayoutProps {
  children: React.ReactNode
  locale: string
}

export default function AppLayout({ children, locale }: AppLayoutProps) {
  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-stone-900 focus:shadow dark:focus:bg-stone-900 dark:focus:text-stone-50"
      >
        Skip to content
      </a>

      <div className="relative z-10 flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile navbar */}
          <div className="lg:hidden">
            <Navbar />
          </div>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
          >
            {children}
          </main>
          <Footer locale={locale} />
        </div>
      </div>
    </div>
  )
}
