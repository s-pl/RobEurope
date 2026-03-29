import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Trophy, Users, Newspaper, Image as ImageIcon, CheckCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

const TOUR_SEEN_KEY = 'robeurope_tour_seen_v1';
const TOUR_FORCE_KEY = 'robeurope_tour_force';

const OnboardingTour = ({ isAuthenticated }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const steps = useMemo(() => [
    {
      icon: Bot,
      title: t('tour.welcome.title') || 'Bienvenido a RobEurope',
      description: t('tour.welcome.description') || 'Aqui gestionas equipo, competiciones, publicaciones y galeria en un solo sitio.',
      cta: null,
    },
    {
      icon: Users,
      title: t('tour.team.title') || '1) Crea o unete a un equipo',
      description: t('tour.team.description') || 'Desde Teams puedes crear tu equipo o solicitar union a uno existente.',
      cta: { label: t('tour.team.cta') || 'Ir a Teams', to: '/teams' },
    },
    {
      icon: Trophy,
      title: t('tour.competitions.title') || '2) Compite y envia registros',
      description: t('tour.competitions.description') || 'En My Team gestionas miembros y te registras en competiciones.',
      cta: { label: t('tour.competitions.cta') || 'Ver competiciones', to: '/competitions' },
    },
    {
      icon: Newspaper,
      title: t('tour.news.title') || '3) Sigue noticias y avisos',
      description: t('tour.news.description') || 'Posts y notificaciones te mantienen al dia de cambios y eventos.',
      cta: { label: t('tour.news.cta') || 'Abrir Posts', to: '/posts' },
    },
    {
      icon: ImageIcon,
      title: t('tour.gallery.title') || '4) Explora la galeria interactiva',
      description: t('tour.gallery.description') || 'Abre imagenes, navega con teclado y marca tus favoritas.',
      cta: { label: t('tour.gallery.cta') || 'Abrir galeria', to: '/gallery' },
    },
  ], [t]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const hasSeen = localStorage.getItem(TOUR_SEEN_KEY) === '1';
    const force = localStorage.getItem(TOUR_FORCE_KEY) === '1';
    if (!hasSeen || force) {
      setOpen(true);
      if (force) localStorage.removeItem(TOUR_FORCE_KEY);
    }
  }, [isAuthenticated]);

  const finishTour = useCallback(() => {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
    setOpen(false);
    setStep(0);
  }, []);

  const skipTour = useCallback(() => {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
    setOpen(false);
    setStep(0);
  }, []);

  const goNext = useCallback(() => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    }
  }, [step, steps.length]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (step < steps.length - 1) goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        skipTour();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, step, steps.length, goNext, goPrev, skipTour]);

  const current = steps[step];
  const Icon = current?.icon || Bot;
  const isLastStep = step === steps.length - 1;
  const progressPercent = ((step + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) skipTour(); }}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-stone-800">
        <div className="px-8 pt-8 pb-2">
          {/* Top bar: progress label + skip */}
          <DialogHeader>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('tour.progress') || 'Guia'}
              </span>
              <button
                onClick={skipTour}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
              >
                <X className="h-3 w-3" />
                {t('tour.skip') || 'Saltar tour'}
              </button>
            </div>

            {/* Solid progress bar */}
            <div className="h-1.5 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
              <div
                className="h-full bg-stone-900 dark:bg-stone-50 dark:bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </DialogHeader>
        </div>

        <div className="px-8 pb-4 pt-4">
          <div className="space-y-5">
            {/* Icon in bordered circle */}
            <div className="flex h-14 w-14 items-center justify-center border-2 border-stone-200 text-stone-700 dark:border-stone-700 dark:text-stone-300">
              <Icon className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <DialogTitle
                className="text-xl font-bold leading-tight text-stone-900 dark:text-stone-50"
                style={{ fontFamily: 'var(--font-display, inherit)' }}
              >
                {current.title}
              </DialogTitle>
              <DialogDescription
                className="text-sm leading-relaxed text-stone-500 dark:text-stone-400"
                style={{ fontFamily: 'var(--font-body, inherit)' }}
              >
                {current.description}
              </DialogDescription>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {step > 0 && (
                <Button variant="ghost" size="lg" className="" onClick={goPrev}>
                  {t('actions.back') || 'Atras'}
                </Button>
              )}

              {current.cta && (
                <Button
                  variant="outline"
                  size="lg"
                  className="border-stone-200 dark:border-stone-700"
                  onClick={() => {
                    navigate(current.cta.to);
                    setOpen(false);
                  }}
                >
                  {current.cta.label}
                </Button>
              )}

              <div className="ml-auto" />

              {!isLastStep ? (
                <Button
                  size="lg"
                  onClick={goNext}
                  className="bg-stone-900 hover:bg-stone-800 text-white"
                >
                  {t('actions.next') || 'Siguiente'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={finishTour}
                  className="gap-2 bg-stone-900 hover:bg-stone-800 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" /> {t('tour.finish') || 'Empezar'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dot step indicator */}
        <div className="flex items-center justify-center gap-2 pb-6">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="group relative p-1"
              aria-label={`Step ${i + 1}`}
            >
              <div
                className={`rounded-full transition-all duration-200 ${
                  i === step
                    ? 'w-6 h-2 bg-blue-600 dark:bg-blue-500'
                    : i < step
                      ? 'w-2 h-2 bg-stone-400 dark:bg-stone-500'
                      : 'w-2 h-2 bg-stone-200 dark:bg-stone-700'
                }`}
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
