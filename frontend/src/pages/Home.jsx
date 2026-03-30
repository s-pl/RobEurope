import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Users, Trophy, Calendar, Newspaper,
  UserPlus, Medal, ChevronDown,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

/* ─────────────────────────────────────────────────────────────────
   HeroGrid — SVG lines that draw in on mount
───────────────────────────────────────────────────────────────── */
const HeroGrid = () => {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current.querySelectorAll('line'), {
        strokeDashoffset: 1400,
        duration: 2.5,
        stagger: 0.12,
        ease: 'power2.inOut',
        delay: 0.2,
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <svg
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none text-stone-900 dark:text-white"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {[16, 33, 50, 66, 83].map(y => (
        <line key={`h${y}`}
          x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
          stroke="currentColor" strokeOpacity="0.04" strokeWidth="1"
          strokeDasharray="1400"
        />
      ))}
      {[16, 33, 50, 66, 83].map(x => (
        <line key={`v${x}`}
          x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
          stroke="currentColor" strokeOpacity="0.04" strokeWidth="1"
          strokeDasharray="1400"
        />
      ))}
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ScanLine — slow infinite horizontal scan
───────────────────────────────────────────────────────────────── */
const ScanLine = () => {
  const ref = useRef(null);
  useEffect(() => {
    gsap.to(ref.current, {
      y: '100vh',
      duration: 5,
      ease: 'none',
      repeat: -1,
    });
  }, []);
  return (
    <div
      ref={ref}
      className="absolute top-0 left-0 right-0 h-px pointer-events-none"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.35), transparent)' }}
      aria-hidden="true"
    />
  );
};

/* ─────────────────────────────────────────────────────────────────
   CornerBracket — decorative targeting brackets
───────────────────────────────────────────────────────────────── */
const CornerBracket = ({ pos }) => {
  const cls = {
    tl: 'top-5 left-5',
    tr: 'top-5 right-5 rotate-90',
    bl: 'bottom-5 left-5 -rotate-90',
    br: 'bottom-5 right-5 rotate-180',
  }[pos];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute ${cls} w-9 h-9 pointer-events-none`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 36" fill="none" className="text-stone-900 dark:text-white">
        <path d="M2 34 L2 2 L34 2" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      </svg>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MarqueeStrip
───────────────────────────────────────────────────────────────── */
const TICKER = [
  'COMPETE', 'INNOVATE', 'BUILD', 'WIN', 'EUROPE',
  'ROBOTICS', '2025', 'CHAMPION', 'ENGINEER', 'CODE', 'DESIGN',
];

const MarqueeStrip = ({ reverse = false, dim = false }) => {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="overflow-hidden">
      <div className={`flex gap-10 whitespace-nowrap ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ willChange: 'transform' }}
      >
        {items.map((item, i) => (
          <span key={i} className={`label-caps flex items-center gap-10 shrink-0 ${dim ? 'text-white/40' : 'text-white/85'}`}>
            {item}
            <span className="text-white/25">·</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Home
───────────────────────────────────────────────────────────────── */
const Home = () => {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [highlights, setHighlights] = useState({ competitions: [], posts: [] });
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const howItWorksRef = useRef(null);

  /* Data */
  useEffect(() => {
    let active = true;
    Promise.all([api('/competitions'), api('/posts?limit=4')])
      .then(([competitions, posts]) => {
        if (!active) return;
        setHighlights({
          competitions: Array.isArray(competitions) ? competitions : [],
          posts: Array.isArray(posts) ? posts : [],
        });
      }).catch(() => {});
    return () => { active = false; };
  }, [api, isAuthenticated]);

  /* Animation helpers */
  const inView = (delay = 0) => reduceMotion ? {} : {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  };

  /* Title word-by-word */
  const titleWords = t('home.hero.title').split(' ');
  const wordContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
  };
  const wordItem = reduceMotion ? {} : {
    hidden: { y: '115%', opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  };

  /* Steps */
  const steps = [
    { n: '01', icon: UserPlus, color: 'text-blue-600 dark:text-blue-500   border-blue-200   dark:border-blue-800   group-hover:border-blue-500',   accent: 'bg-blue-600',    title: t('home.howItWorks.steps.register.title'), desc: t('home.howItWorks.steps.register.description') },
    { n: '02', icon: Users,    color: 'text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 group-hover:border-violet-500', accent: 'bg-violet-600',  title: t('home.howItWorks.steps.team.title'),     desc: t('home.howItWorks.steps.team.description') },
    { n: '03', icon: Trophy,   color: 'text-amber-600 dark:text-amber-400  border-amber-200  dark:border-amber-800  group-hover:border-amber-500',  accent: 'bg-amber-500',   title: t('home.howItWorks.steps.enroll.title'),   desc: t('home.howItWorks.steps.enroll.description') },
    { n: '04', icon: Medal,    color: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 group-hover:border-emerald-500', accent: 'bg-emerald-500', title: t('home.howItWorks.steps.compete.title'),  desc: t('home.howItWorks.steps.compete.description') },
  ];

  return (
    <div className="flex flex-col -mx-4 sm:-mx-6 lg:-mx-10 -mt-6 lg:-mt-8">

      {/* ═══════════════════════════════════════════ HERO */}
      <section className="relative min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center overflow-hidden">

        {/* Background grid */}
        <HeroGrid />

        {/* Scan line */}
        {!reduceMotion && <ScanLine />}

        {/* Corner brackets */}
        <CornerBracket pos="tl" />
        <CornerBracket pos="tr" />
        <CornerBracket pos="bl" />
        <CornerBracket pos="br" />

        {/* Main headline */}
        <div className="relative z-10 text-center max-w-6xl px-6 space-y-10">

          {/* Word-by-word title */}
          <motion.h1
            variants={wordContainer}
            initial="hidden"
            animate="show"
            className="font-display text-[clamp(3.5rem,11vw,9rem)] font-black tracking-tighter leading-[0.92] text-stone-900 dark:text-white flex flex-wrap justify-center gap-x-[0.25em] gap-y-2"
            aria-label={t('home.hero.title')}
          >
            {titleWords.map((word, i) => (
              <span key={i} className="overflow-hidden inline-block pb-[0.05em]">
                <motion.span variants={wordItem} className="inline-block">
                  {word}
                </motion.span>
              </span>
            ))}
          </motion.h1>

          {/* Accent underline */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            style={{ originX: 0.5 }}
            className="mx-auto h-[3px] w-20 bg-blue-600"
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.05 }}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed"
          >
            {t('home.hero.description')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Button asChild variant="accent" size="lg" className="px-10 text-base group">
              <Link to="/competitions">
                {t('home.hero.primaryCta')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" />
              </Link>
            </Button>
            <button
              onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-10 py-3 text-base border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-700 hover:text-stone-900 dark:hover:border-stone-500 dark:hover:text-white transition-colors duration-150"
            >
              <ChevronDown className="h-5 w-5" />
              {t('home.howItWorks.title')}
            </button>
          </motion.div>
        </div>

      </section>

      {/* ═══════════════════════════════════════ TICKER STRIP */}
      <div className="bg-blue-600 py-4 space-y-3 overflow-hidden shrink-0">
        <MarqueeStrip />
        <MarqueeStrip reverse dim />
      </div>

      {/* ══════════════════════════════════════ HOW IT WORKS */}
      <section ref={howItWorksRef} className="py-28 px-4 bg-stone-50 dark:bg-stone-950 scroll-mt-0">
        <div className="max-w-5xl mx-auto space-y-16">

          {/* Header */}
          <motion.div {...inView(0)} className="space-y-3 max-w-2xl">
            <p className="label-caps text-blue-600 dark:text-blue-500 text-xs">— {t('home.howItWorks.title')}</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-stone-900 dark:text-white tracking-tighter leading-tight">
              {t('home.howItWorks.description')}
            </h2>
          </motion.div>

          {/* Steps — 2×2 grid separated by 1px gaps */}
          <div className="grid md:grid-cols-2 gap-px bg-stone-200 dark:bg-stone-800">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                {...inView(i * 0.1)}
                className="relative bg-stone-50 hover:bg-white dark:bg-stone-950 dark:hover:bg-stone-900 p-10 group transition-colors duration-200 overflow-hidden"
              >
                {/* Ghost step number */}
                <span className="absolute top-5 right-7 font-mono text-[4.5rem] font-black text-stone-200 dark:text-stone-900 leading-none select-none transition-colors duration-200 group-hover:text-stone-300 dark:group-hover:text-stone-800">
                  {step.n}
                </span>

                {/* Icon */}
                <div className={`mb-6 h-11 w-11 border flex items-center justify-center transition-colors duration-200 ${step.color}`}>
                  <step.icon className="h-5 w-5" />
                </div>

                <h3 className="font-display text-xl font-black text-stone-900 dark:text-white mb-3 tracking-tight">{step.title}</h3>
                <p className="text-stone-500 dark:text-stone-500 text-sm leading-relaxed">{step.desc}</p>

                {/* Animated bottom accent */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-[2px] ${step.accent}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ LATEST CONTENT */}
      <section className="py-28 px-4 bg-[#f8f7f4] dark:bg-[#0c0a09]">
        <div className="max-w-5xl mx-auto space-y-14">

          {/* Header */}
          <motion.div {...inView(0)} className="space-y-2">
            <p className="label-caps text-blue-600 dark:text-blue-500 text-xs">— {t('home.latest.title')}</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-stone-900 dark:text-stone-50 tracking-tighter">
              {t('home.latest.description')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-14">

            {/* Competitions column */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b-2 border-stone-900 dark:border-stone-100">
                <h3 className="font-display text-lg font-black text-stone-900 dark:text-stone-50 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  {t('home.latest.competitions')}
                </h3>
                <Link
                  to="/competitions"
                  className="label-caps text-[10px] text-stone-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors duration-100"
                >
                  {t('home.latest.viewCalendar')} →
                </Link>
              </div>

              <div className="space-y-0 divide-y divide-stone-200 dark:divide-stone-800">
                {highlights.competitions.length > 0 ? (
                  highlights.competitions.slice(0, 4).map((comp, i) => (
                    <motion.div
                      key={comp.id}
                      {...inView(i * 0.06)}
                      whileHover={reduceMotion ? {} : { x: 5 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-between py-4 group"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-stone-900 dark:text-stone-50 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors duration-100">
                          {comp.title}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-stone-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(comp.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 ml-4">{comp.status}</Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-16 text-center border-2 border-dashed border-stone-200 dark:border-stone-800">
                    <Trophy className="h-8 w-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
                    <p className="text-sm text-stone-400">{t('home.noCompetitions')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Posts column */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b-2 border-stone-900 dark:border-stone-100">
                <h3 className="font-display text-lg font-black text-stone-900 dark:text-stone-50 flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                  {t('home.latest.news')}
                </h3>
                <Link
                  to="/posts"
                  className="label-caps text-[10px] text-stone-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors duration-100"
                >
                  {t('home.latest.viewAll')} →
                </Link>
              </div>

              <div className="space-y-0 divide-y divide-stone-200 dark:divide-stone-800">
                {highlights.posts.length > 0 ? (
                  highlights.posts.slice(0, 4).map((post, i) => (
                    <motion.div
                      key={post.id}
                      {...inView(i * 0.06)}
                      whileHover={reduceMotion ? {} : { x: 5 }}
                      transition={{ duration: 0.15 }}
                      className="py-4 group"
                    >
                      <p className="font-semibold text-stone-900 dark:text-stone-50 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors duration-100 mb-1">
                        {post.title}
                      </p>
                      <p className="text-xs text-stone-400 line-clamp-1">
                        {post.content ? new DOMParser().parseFromString(post.content, 'text/html').body.textContent ?? '' : ''}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-16 text-center border-2 border-dashed border-stone-200 dark:border-stone-800">
                    <Newspaper className="h-8 w-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
                    <p className="text-sm text-stone-400">{t('home.noNews')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════ CTA */}
      <section className="relative py-36 px-4 bg-blue-600 overflow-hidden text-center">
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 0.5px)', backgroundSize: '18px 18px' }}
          aria-hidden="true"
        />

        {/* Animated border lines */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: 0 }}
          className="absolute top-0 left-0 right-0 h-px bg-white/20"
        />
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: 1 }}
          className="absolute bottom-0 left-0 right-0 h-px bg-white/20"
        />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <motion.h2
            {...inView(0)}
            className="font-display text-5xl md:text-6xl font-black tracking-tighter text-white leading-tight"
          >
            {t('home.cta.title')}
          </motion.h2>
          <motion.p {...inView(0.1)} className="text-blue-100 text-lg md:text-xl leading-relaxed">
            {t('home.cta.description')}
          </motion.p>
          <motion.div {...inView(0.2)}>
            <Button
              asChild
              size="lg"
              className="px-12 text-base bg-white text-blue-600 hover:bg-stone-100 border-0 group"
            >
              <Link to="/register">
                {t('home.cta.button')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Home;
