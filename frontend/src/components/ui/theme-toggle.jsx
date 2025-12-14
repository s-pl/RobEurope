import { Moon, Sun } from "lucide-react"
import { useTranslation } from 'react-i18next';
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { useTheme } from "../../context/ThemeContext"

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme()

  const effectiveTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light')
    : theme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group relative overflow-hidden rounded-full focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          aria-label={t('theme.toggle')}
          aria-pressed={effectiveTheme === 'dark'}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-blue-50 to-white opacity-100 transition-opacity duration-300 dark:from-slate-900 dark:to-slate-800 motion-reduce:transition-none"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-blue-500/10 opacity-0 transition-opacity duration-300 dark:opacity-100 motion-reduce:transition-none"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-blue-400/10 motion-reduce:transition-none"
          />

          <Sun
            className="relative h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 motion-reduce:transition-none"
            aria-hidden="true"
          />
          <Moon
            className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 motion-reduce:transition-none"
            aria-hidden="true"
          />
          <span className="sr-only">{t('theme.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t('theme.light')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t('theme.dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t('theme.system')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
