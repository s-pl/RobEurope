import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Trophy, Users, Newspaper, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
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
      description: t('tour.welcome.description') || 'Aquí gestionas equipo, competiciones, publicaciones y galería en un solo sitio.',
      cta: null,
    },
    {
      icon: Users,
      title: t('tour.team.title') || '1) Crea o únete a un equipo',
      description: t('tour.team.description') || 'Desde Teams puedes crear tu equipo o solicitar unión a uno existente.',
      cta: { label: t('tour.team.cta') || 'Ir a Teams', to: '/teams' },
    },
    {
      icon: Trophy,
      title: t('tour.competitions.title') || '2) Compite y envía registros',
      description: t('tour.competitions.description') || 'En My Team gestionas miembros y te registras en competiciones.',
      cta: { label: t('tour.competitions.cta') || 'Ver competiciones', to: '/competitions' },
    },
    {
      icon: Newspaper,
      title: t('tour.news.title') || '3) Sigue noticias y avisos',
      description: t('tour.news.description') || 'Posts y notificaciones te mantienen al día de cambios y eventos.',
      cta: { label: t('tour.news.cta') || 'Abrir Posts', to: '/posts' },
    },
    {
      icon: ImageIcon,
      title: t('tour.gallery.title') || '4) Explora la galería interactiva',
      description: t('tour.gallery.description') || 'Abre imágenes, navega con teclado y marca tus favoritas.',
      cta: { label: t('tour.gallery.cta') || 'Abrir galería', to: '/gallery' },
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

  const finishTour = () => {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
    setOpen(false);
    setStep(0);
  };

  const current = steps[step];
  const Icon = current?.icon || Bot;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finishTour(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{t('tour.progress') || 'Guía'}</span>
            <span>{step + 1}/{steps.length}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-blue-600"
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            />
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24 }}
            className="space-y-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Icon className="h-6 w-6" />
            </div>
            <DialogTitle>{current.title}</DialogTitle>
            <DialogDescription>{current.description}</DialogDescription>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  {t('actions.back') || 'Atrás'}
                </Button>
              )}

              {current.cta && (
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate(current.cta.to);
                    setOpen(false);
                  }}
                >
                  {current.cta.label}
                </Button>
              )}

              <div className="ml-auto" />

              {step < steps.length - 1 ? (
                <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
                  {t('actions.next') || 'Siguiente'}
                </Button>
              ) : (
                <Button onClick={finishTour} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {t('tour.finish') || 'Empezar'}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
