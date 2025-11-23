import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Bot, CircuitBoard, Globe2, ShieldCheck, Users, Trophy, Zap, Calendar, Newspaper, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

const pillarIcons = [CircuitBoard, Globe2, ShieldCheck];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [highlights, setHighlights] = useState({ competitions: [], streams: [], posts: [] });
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
      setLoading(true);
      setError('');
      try {
        const [competitions, streams, posts] = await Promise.all([
          api('/competitions'),
          api('/streams'),
          api('/posts?limit=3')
        ]);
        if (active) {
          setHighlights({ 
            competitions: Array.isArray(competitions) ? competitions : [], 
            streams: Array.isArray(streams) ? streams : [],
            posts: Array.isArray(posts) ? posts : []
          });
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
    () => [],
    []
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
      <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/50 shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50">
        <CardHeader className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium uppercase tracking-wide dark:bg-blue-900/30 dark:text-blue-300">
              <Bot className="h-3 w-3" />
              {t('home.hero.tagline')}
            </div>
            <CardTitle className="text-3xl md:text-4xl lg:text-5xl leading-tight text-blue-900 dark:text-blue-100">{t('home.hero.title')}</CardTitle>
            <CardDescription className="text-base md:text-lg text-blue-700 dark:text-blue-300">{t('home.hero.description')}</CardDescription>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="shadow-md hover:shadow-lg transition-shadow">
                <Link to="/competitions" className="flex items-center gap-2">
                  {t('home.hero.primaryCta')}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800">
                <a href="http://46.101.255.106:85/api-docs" target="_blank" rel="noreferrer">
                  {t('home.hero.secondaryCta')}
                </a>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div
              ref={robotRef}
              className="relative flex h-48 w-48 items-center justify-center rounded-[40px] border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-xl dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
            >
              <span className="absolute inset-0 rounded-[40px] border border-dashed border-blue-300 dark:border-slate-600" />
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
        {/* Callouts removed as per request */}
      </section>

      {/* Latest News Section */}
      {highlights.posts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Últimas Noticias</h2>
            </div>
            <Button variant="ghost" asChild className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              <Link to="/posts" className="flex items-center gap-1">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="h-40 w-full bg-slate-100 dark:bg-slate-800">
                    <img src={post.media_urls[0]} alt={post.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <CardHeader className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs font-normal">Noticia</Badge>
                    <span className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 leading-tight">
                    <Link to={`/posts`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-2 text-sm">
                    {post.content}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Competitions Section */}
      {highlights.competitions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Próximas Competiciones</h2>
            </div>
            <Button variant="ghost" asChild className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              <Link to="/competitions" className="flex items-center gap-1">
                Ver calendario <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights.competitions.slice(0, 3).map((comp) => (
              <Card key={comp.id} className="group hover:border-blue-300 transition-colors dark:border-slate-800 dark:hover:border-slate-700 dark:bg-slate-900">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                      {comp.status}
                    </Badge>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(comp.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-lg group-hover:text-blue-600 transition-colors">
                    {comp.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Globe2 className="h-3 w-3" /> {comp.location || 'Online'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 line-clamp-2 dark:text-slate-400">{comp.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!isAuthenticated && (
        <Card className="border-dashed border-blue-300 bg-gradient-to-br from-blue-50/50 to-white dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/50">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 dark:bg-slate-800">
              <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardDescription className="text-blue-700 text-lg font-medium dark:text-slate-300">{t('home.locked')}</CardDescription>
            <p className="text-blue-600 text-sm mt-2 dark:text-slate-400">Regístrate para acceder a todas las funcionalidades</p>
          </div>
        </Card>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar, index) => (
          <Card key={pillar.title} className="pillar-card border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group dark:border-slate-800 dark:hover:border-slate-700">
            <div className="flex items-center gap-4 p-6 pb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 group-hover:scale-110 transition-transform duration-300 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-blue-400">
                <pillar.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-blue-500 font-medium dark:text-slate-400">{t('home.pillarLabel')}</p>
                <h3 className="text-lg font-bold text-blue-900 mt-1 dark:text-slate-100">{pillar.title}</h3>
              </div>
            </div>
            <CardContent>
              <p className="text-sm text-blue-700 leading-relaxed dark:text-slate-400">{pillar.body}</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1 flex-1 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full dark:from-slate-800 dark:to-slate-700">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${(index + 1) * 25}%`}}></div>
                </div>
                <span className="text-xs text-blue-500 font-medium dark:text-slate-500">{(index + 1) * 25}%</span>
              </div>
            </CardContent>
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

