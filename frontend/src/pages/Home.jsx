import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Bot, CircuitBoard, Globe2, ShieldCheck, Users, Trophy, Zap } from 'lucide-react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
          : '',
        icon: Trophy,
        badge: highlights.competitions?.[0] ? 'Próxima' : null,
        color: 'text-blue-600'
      },
      {
        label: t('home.callouts.streaming.label'),
        value: highlights.streams?.[0]?.title || t('home.callouts.streaming.fallback'),
        detail: highlights.streams?.[0]?.platform || '',
        icon: Zap,
        badge: highlights.streams?.[0]?.is_live ? 'En vivo' : null,
        color: 'text-green-600'
      },
      {
        label: t('home.callouts.teams.label'),
        value: highlights.competitions?.reduce((acc, comp) => acc + (comp?.teams_registered || 0), 0) || '120+',
        detail: t('home.callouts.teams.detail'),
        icon: Users,
        badge: 'Activos',
        color: 'text-purple-600'
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
      <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/50 shadow-lg">
        <CardHeader className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium uppercase tracking-wide">
              <Bot className="h-3 w-3" />
              {t('home.hero.tagline')}
            </div>
            <CardTitle className="text-4xl leading-tight text-blue-900">{t('home.hero.title')}</CardTitle>
            <CardDescription className="text-blue-700 text-lg">{t('home.hero.description')}</CardDescription>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="shadow-md hover:shadow-lg transition-shadow">
                <Link to="/competitions" className="flex items-center gap-2">
                  {t('home.hero.primaryCta')}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <a href="http://46.101.255.106:85/api-docs" target="_blank" rel="noreferrer">
                  {t('home.hero.secondaryCta')}
                </a>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div
              ref={robotRef}
              className="relative flex h-48 w-48 items-center justify-center rounded-[40px] border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-xl"
            >
              <span className="absolute inset-0 rounded-[40px] border border-dashed border-blue-300" />
              <span className="absolute left-6 top-6 robot-orbit-dot h-4 w-4 rounded-full bg-blue-500 shadow-lg" />
              <span className="absolute right-8 bottom-10 robot-orbit-dot h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span className="absolute top-8 right-6 robot-orbit-dot h-3 w-3 rounded-full bg-blue-300" />
              <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
                <Bot className="h-12 w-12" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {callouts.map((item) => (
          <Card key={item.label} className="callout-card bg-gradient-to-br from-white to-blue-50/30 border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-blue-100`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.4em] text-blue-500 font-medium">{item.label}</p>
                  <p className="mt-1 text-xl font-bold text-blue-900">{item.value}</p>
                  {item.detail && <p className="text-xs text-blue-600 mt-1">{item.detail}</p>}
                </div>
              </div>
              {item.badge && (
                <Badge variant={item.badge === 'En vivo' ? 'destructive' : 'default'} className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </section>

      {!isAuthenticated && (
        <Card className="border-dashed border-blue-300 bg-gradient-to-br from-blue-50/50 to-white">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            </div>
            <CardDescription className="text-blue-700 text-lg font-medium">{t('home.locked')}</CardDescription>
            <p className="text-blue-600 text-sm mt-2">Regístrate para acceder a todas las funcionalidades</p>
          </div>
        </Card>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar, index) => (
          <Card key={pillar.title} className="pillar-card border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 group-hover:scale-110 transition-transform duration-300">
                <pillar.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-blue-500 font-medium">{t('home.pillarLabel')}</p>
                <h3 className="text-lg font-bold text-blue-900 mt-1">{pillar.title}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-blue-700 leading-relaxed">{pillar.body}</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 flex-1 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${(index + 1) * 25}%`}}></div>
              </div>
              <span className="text-xs text-blue-500 font-medium">{(index + 1) * 25}%</span>
            </div>
          </Card>
        ))}
      </section>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600"></div>
            <p className="text-sm font-medium">{t('home.loading')}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200">
            <ShieldCheck className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{t('home.error')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
