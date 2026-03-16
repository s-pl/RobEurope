import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Bot, Users, Trophy, Calendar, Newspaper,
  UserPlus, Medal, ChevronDown,
} from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { ScrollReveal } from '../components/ui/scroll-reveal';

/* ------------------------------------------------------------------ */
/*  AnimatedCounter                                                    */
/* ------------------------------------------------------------------ */
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      setCount(target);
      return;
    }

    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [isInView, target, duration, reduceMotion]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Home page                                                          */
/* ------------------------------------------------------------------ */
const Home = () => {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [highlights, setHighlights] = useState({ competitions: [], streams: [], posts: [] });
  const [stats, setStats] = useState({ teams: 50, competitions: 12, viewers: 10000, countries: 3 });
  const howItWorksRef = useRef(null);
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  /* Fetch highlights */
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [competitions, streams, posts] = await Promise.all([
          api('/competitions'),
          api('/streams'),
          api('/posts?limit=3'),
        ]);
        if (active) {
          setHighlights({
            competitions: Array.isArray(competitions) ? competitions : [],
            streams: Array.isArray(streams) ? streams : [],
            posts: Array.isArray(posts) ? posts : [],
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [api, isAuthenticated]);

  /* Fetch stats */
  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const data = await api('/stats');
        if (active && data) {
          setStats({
            teams: data.teams ?? 50,
            competitions: data.competitions ?? 12,
            viewers: data.viewers ?? 10000,
            countries: data.countries ?? 3,
          });
        }
      } catch {
        /* keep defaults */
      }
    };
    fetchStats();
    return () => { active = false; };
  }, [api]);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const steps = [
    {
      title: t('home.howItWorks.steps.register.title'),
      description: t('home.howItWorks.steps.register.description'),
      icon: UserPlus,
    },
    {
      title: t('home.howItWorks.steps.team.title'),
      description: t('home.howItWorks.steps.team.description'),
      icon: Users,
    },
    {
      title: t('home.howItWorks.steps.enroll.title'),
      description: t('home.howItWorks.steps.enroll.description'),
      icon: Trophy,
    },
    {
      title: t('home.howItWorks.steps.compete.title'),
      description: t('home.howItWorks.steps.compete.description'),
      icon: Medal,
    },
  ];

  const fade = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, delay, ease: 'easeOut' },
        };

  const fadeInView = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.3, delay, ease: 'easeOut' },
        };

  return (
    <div className="flex flex-col gap-24 pb-24">

      {/* ============================================================= */}
      {/*  HERO                                                          */}
      {/* ============================================================= */}
      <section className="relative pt-16 lg:pt-28 pb-4 text-center">
        {/* Dot grid background */}
        <div className="dot-grid absolute inset-0 -z-10" />

        <div className="relative z-10 mx-auto max-w-4xl space-y-8 px-4">
          {/* Tagline badge */}
          <motion.div {...fade(0)} className="flex justify-center">
            <span className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              {t('home.hero.tagline')}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            {...fade(0.05)}
            className="font-display text-6xl md:text-8xl font-bold tracking-tight leading-[1.05] text-stone-900 dark:text-stone-50"
          >
            {t('home.hero.title')}
          </motion.h1>

          {/* Description */}
          <motion.p
            {...fade(0.1)}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-stone-500 dark:text-stone-400 leading-relaxed"
          >
            {t('home.hero.description')}
          </motion.p>

          {/* CTAs */}
          <motion.div {...fade(0.15)} className="flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-13 rounded-lg bg-blue-600 px-8 text-lg text-white hover:bg-blue-700"
            >
              <Link to="/competitions">
                {t('home.hero.primaryCta')} <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-13 rounded-lg border-stone-300 px-8 text-lg text-stone-900 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-50 dark:hover:bg-stone-800"
              onClick={scrollToHowItWorks}
            >
              <ChevronDown className="mr-2 h-5 w-5" aria-hidden="true" />
              {t('home.howItWorks.title')}
            </Button>
          </motion.div>

          {/* Robot icon */}
          <motion.div {...fade(0.2)} className="flex justify-center pt-6">
            <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 transition-transform duration-200 hover:scale-105">
              <Bot className="h-16 w-16 text-blue-600 dark:text-blue-500" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================= */}
      {/*  STATS                                                         */}
      {/* ============================================================= */}
      <section className="mx-auto w-full max-w-4xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { value: stats.teams, suffix: '+', label: t('home.stats.teams') },
            { value: stats.competitions, suffix: '', label: t('home.stats.competitions') },
            { value: stats.viewers, suffix: '+', label: t('home.stats.viewers') },
            { value: stats.countries, suffix: '', label: t('home.stats.countries') },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="space-y-1"
              {...fadeInView(i * 0.05)}
            >
              <div className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-50">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================================= */}
      {/*  HOW IT WORKS                                                  */}
      {/* ============================================================= */}
      <section ref={howItWorksRef} className="space-y-16 scroll-mt-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-50">
              {t('home.howItWorks.title')}
            </h2>
            <p className="text-lg text-stone-500 dark:text-stone-400">
              {t('home.howItWorks.description')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-[12%] right-[12%] h-px bg-stone-200 dark:bg-stone-800 -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              {...fadeInView(index * 0.05)}
            >
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {index + 1}
              </div>

              <div className="flex flex-col items-center text-center space-y-4 p-8 pt-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
                <div className="h-14 w-14 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-blue-600 dark:text-blue-500">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-50">{step.title}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================================= */}
      {/*  LATEST NEWS & COMPETITIONS                                    */}
      {/* ============================================================= */}
      <section className="space-y-10">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">{t('home.latest.title')}</h2>
            <p className="text-stone-500 dark:text-stone-400">{t('home.latest.description')}</p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-10">
          {/* News */}
          <ScrollReveal>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold flex items-center gap-2 text-stone-900 dark:text-stone-50">
                  <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-500" /> {t('home.latest.news')}
                </h3>
                <Link to="/posts" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  {t('home.latest.viewAll')}
                </Link>
              </div>
              <div className="space-y-4">
                {highlights.posts.length > 0 ? (
                  highlights.posts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-colors duration-200 hover:border-blue-300 dark:hover:border-blue-700"
                    >
                      <h4 className="font-medium text-stone-900 dark:text-stone-50 text-base">{post.title}</h4>
                      <p className="line-clamp-2 text-xs mt-1 text-stone-500 dark:text-stone-400">
                        {post.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                    <Newspaper className="h-10 w-10 text-stone-300 dark:text-stone-600 mb-3" />
                    <p className="text-sm text-stone-400 dark:text-stone-500">No news yet</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Competitions */}
          <ScrollReveal>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold flex items-center gap-2 text-stone-900 dark:text-stone-50">
                  <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-500" /> {t('home.latest.competitions')}
                </h3>
                <Link to="/competitions" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  {t('home.latest.viewCalendar')}
                </Link>
              </div>
              <div className="space-y-4">
                {highlights.competitions.length > 0 ? (
                  highlights.competitions.slice(0, 3).map((comp) => (
                    <div
                      key={comp.id}
                      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-colors duration-200 hover:border-blue-300 dark:hover:border-blue-700"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-stone-900 dark:text-stone-50 text-base">{comp.title}</h4>
                        <Badge variant="secondary" className="text-xs shrink-0 ml-2">{comp.status}</Badge>
                      </div>
                      <p className="flex items-center gap-2 text-xs mt-1 text-stone-500 dark:text-stone-400">
                        <Calendar className="h-3 w-3" /> {new Date(comp.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                    <Trophy className="h-10 w-10 text-stone-300 dark:text-stone-600 mb-3" />
                    <p className="text-sm text-stone-400 dark:text-stone-500">No competitions yet</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================= */}
      {/*  CTA                                                           */}
      {/* ============================================================= */}
      <ScrollReveal>
        <section className="rounded-2xl bg-blue-600 dark:bg-blue-600 py-20 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
              {t('home.cta.title')}
            </h2>
            <p className="text-blue-100 text-lg md:text-xl leading-relaxed">
              {t('home.cta.description')}
            </p>
            <Button
              asChild
              size="lg"
              className="h-14 rounded-lg bg-white px-10 text-lg font-semibold text-blue-600 hover:bg-stone-50"
            >
              <Link to="/register">{t('home.cta.button')}</Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
};

export default Home;
