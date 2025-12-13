import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bot, Home, Radar } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 lg:px-0">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-800 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-200">
            <Radar className="h-3.5 w-3.5" aria-hidden="true" />
            {t('notFound.badge') || 'Página no encontrada'}
          </p>

          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            <span className="text-blue-700 dark:text-blue-400">404</span>{' '}
            {t('notFound.title') || 'Ups…'}
          </h1>

          <p className="max-w-prose text-lg text-slate-600 dark:text-slate-300">
            {t('notFound.description') || 'La ruta que buscas no existe o ha cambiado. Puedes volver atrás o ir al inicio.'}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('notFound.goBack') || 'Volver'}
            </Button>

            <Button asChild variant="outline" className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" aria-hidden="true" />
                {t('notFound.goHome') || 'Ir al inicio'}
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-blue-100/70 blur-2xl dark:bg-blue-900/20" aria-hidden="true" />

            <div className="relative grid place-items-center rounded-3xl border border-blue-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="relative">
                <div className="grid h-28 w-28 place-items-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400">
                  <Bot className="h-14 w-14 motion-safe:animate-bounce motion-reduce:animate-none" aria-hidden="true" />
                </div>

                <div
                  className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden rounded-2xl"
                  aria-hidden="true"
                >
                  <div className="absolute inset-x-0 top-4 h-0.5 bg-blue-400/70 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-blue-500/50" />
                </div>

                <div
                  className="pointer-events-none absolute -right-4 -top-4 grid h-9 w-9 place-items-center rounded-full border border-blue-200 bg-white text-blue-700 motion-safe:animate-spin motion-reduce:animate-none dark:border-slate-800 dark:bg-slate-950 dark:text-blue-300"
                  style={{ animationDuration: '6s' }}
                  aria-hidden="true"
                >
                  <Radar className="h-4 w-4" />
                </div>
              </div>

              <p className="mt-6 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('notFound.robotHint') || 'Mi radar no detecta esa página.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
