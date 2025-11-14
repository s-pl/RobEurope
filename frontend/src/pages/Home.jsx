import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Bot, CircuitBoard, Globe2, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

const pillarIcons = [CircuitBoard, Globe2, ShieldCheck];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [highlights, setHighlights] = useState({ competitions: [], streams: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const robotRef = useRef(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!robotRef.current) return;

      gsap.to(robotRef.current, {
        y: 12,
        rotate: 6,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      gsap.to('.robot-orbit-dot', {
        rotate: 360,
        duration: 10,
        repeat: -1,
        ease: 'linear',
        transformOrigin: 'center'
      });
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.callout-card',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.pillar-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.1 }
      );
    });

    return () => ctx.revert();
  }, [highlights, i18n.language]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!isAuthenticated) {
        setHighlights({ competitions: [], streams: [] });
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [competitions, streams] = await Promise.all([
          api('/competitions'),
          api('/streams')
        ]);
        if (active) {
          setHighlights({ competitions, streams });
        }
      } catch (err) {
        if (active) setError(err.message || 'No se pudo cargar la información');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [api, isAuthenticated]);

  const callouts = useMemo(
    () => [
      {
        label: t('home.callouts.nextQualifier.label'),
        value: highlights.competitions?.[0]?.title || t('home.callouts.nextQualifier.fallback'),
        detail: highlights.competitions?.[0]?.start_date
          ? new Date(highlights.competitions[0].start_date).toLocaleDateString()
          : ''
      },
      {
        label: t('home.callouts.streaming.label'),
        value: highlights.streams?.[0]?.title || t('home.callouts.streaming.fallback'),
        detail: highlights.streams?.[0]?.platform || ''
      },
      {
        label: t('home.callouts.teams.label'),
        value: highlights.competitions?.reduce((acc, comp) => acc + (comp?.teams_registered || 0), 0) || '120+',
        detail: t('home.callouts.teams.detail')
      }
    ],
    [highlights, t]
  );

  const pillars = useMemo(
    () => [
      { title: t('home.pillars.stem.title'), body: t('home.pillars.stem.body'), icon: pillarIcons[0] },
      { title: t('home.pillars.europe.title'), body: t('home.pillars.europe.body'), icon: pillarIcons[1] },
      { title: t('home.pillars.impact.title'), body: t('home.pillars.impact.body'), icon: pillarIcons[2] }
    ],
    [t]
  );

  return (
    <div className="space-y-10">
      <Card className="border-slate-200 bg-white">
        <CardHeader className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{t('home.hero.tagline')}</p>
            <CardTitle className="text-4xl leading-tight">{t('home.hero.title')}</CardTitle>
            <CardDescription>{t('home.hero.description')}</CardDescription>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/competitions" className="flex items-center gap-2">
                  {t('home.hero.primaryCta')}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <a href="http://46.101.255.106:85/api-docs" target="_blank" rel="noreferrer">
                  {t('home.hero.secondaryCta')}
                </a>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div
              ref={robotRef}
              className="relative flex h-48 w-48 items-center justify-center rounded-[40px] border border-slate-200 bg-slate-50 shadow-inner"
            >
              <span className="absolute inset-0 rounded-[40px] border border-dashed border-slate-200" />
              <span className="absolute left-6 top-6 robot-orbit-dot h-4 w-4 rounded-full bg-blue-500/70" />
              <span className="absolute right-8 bottom-10 robot-orbit-dot h-2.5 w-2.5 rounded-full bg-slate-400" />
              <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-slate-900 text-white">
                <Bot className="h-12 w-12" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {callouts.map((item) => (
          <Card key={item.label} className="callout-card bg-white">
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
            {item.detail && <p className="text-xs text-slate-500">{item.detail}</p>}
          </Card>
        ))}
      </section>

      {!isAuthenticated && (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardDescription className="text-slate-700">{t('home.locked')}</CardDescription>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="pillar-card border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
                <pillar.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">{t('home.pillarLabel')}</p>
                <h3 className="text-lg font-semibold text-slate-900">{pillar.title}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{pillar.body}</p>
          </Card>
        ))}
      </section>

      {loading && <p className="text-sm text-slate-500">{t('home.loading')}</p>}
      {error && <p className="text-sm text-red-500">{t('home.error')}</p>}
    </div>
  );
};

export default Home;
