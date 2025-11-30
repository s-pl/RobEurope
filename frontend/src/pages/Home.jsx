import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Bot, CircuitBoard, Globe2, ShieldCheck, Users, Trophy, Zap, Calendar, Newspaper, ArrowRight, CheckCircle, UserPlus, Medal } from 'lucide-react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

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

  const steps = [
    { 
      title: "Regístrate", 
      description: "Crea tu cuenta en RobEurope para acceder a todas las funcionalidades.",
      icon: UserPlus,
      color: "bg-blue-100 text-blue-600"
    },
    { 
      title: "Forma un Equipo", 
      description: "Únete a un equipo existente o crea uno nuevo con tus compañeros.",
      icon: Users,
      color: "bg-indigo-100 text-indigo-600"
    },
    { 
      title: "Inscríbete", 
      description: "Busca competiciones activas y registra a tu equipo para participar.",
      icon: Trophy,
      color: "bg-purple-100 text-purple-600"
    },
    { 
      title: "Compite y Gana", 
      description: "Demuestra tus habilidades, sube en el ranking y gana premios.",
      icon: Medal,
      color: "bg-amber-100 text-amber-600"
    }
  ];

  return (
    <div className="flex flex-col gap-20 pb-20">
     
      <section className="relative pt-10 lg:pt-20 text-center space-y-8">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium uppercase tracking-wide dark:bg-blue-900/30 dark:text-blue-300 animate-fade-in-up">
          <Bot className="h-3 w-3" />
          {t('home.hero.tagline')}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          {t('home.hero.title')}
        </h1>
        
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {t('home.hero.description')}
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="h-12 px-8 text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
            <Link to="/competitions">
              {t('home.hero.primaryCta')} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-lg">
            <a href="https://api.robeurope.samuelpòcne.es/api-docs" target="_blank" rel="noreferrer">
              {t('home.hero.secondaryCta')}
            </a>
          </Button>
        </div>

    
        <div className="flex justify-center mt-10">
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
      </section>

   
      <section className="border-y border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
                <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400">50+</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Equipos Activos</p>
            </div>
            <div className="space-y-2">
                <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400">12</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Competiciones Anuales</p>
            </div>
            <div className="space-y-2">
                <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400">10k+</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Espectadores</p>
            </div>
            <div className="space-y-2">
                <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400">3</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Países</p>
            </div>
        </div>
      </section>

    
      <section className="space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Cómo Funciona</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Participar en RobEurope es muy sencillo. Sigue estos pasos para comenzar tu viaje en la competición.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 dark:from-blue-900 dark:via-blue-700 dark:to-blue-900 -z-10"></div>
          
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${step.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

   
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Últimas Novedades</h2>
            <p className="text-slate-600 dark:text-slate-400">Mantente al día con las últimas noticias y competiciones de la liga.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Newspaper className="h-5 w-5 text-blue-600" /> Noticias
                    </h3>
                    <Link to="/posts" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
                </div>
                <div className="space-y-4">
                    {highlights.posts.slice(0, 3).map(post => (
                        <Card key={post.id} className="hover:border-blue-300 transition-colors">
                            <CardHeader className="p-4">
                                <CardTitle className="text-base">{post.title}</CardTitle>
                                <CardDescription className="line-clamp-2 text-xs mt-1">{post.content.replace(/<[^>]*>?/gm, '')}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

           
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-blue-600" /> Competiciones
                    </h3>
                    <Link to="/competitions" className="text-sm text-blue-600 hover:underline">Ver calendario</Link>
                </div>
                <div className="space-y-4">
                    {highlights.competitions.slice(0, 3).map(comp => (
                        <Card key={comp.id} className="hover:border-blue-300 transition-colors">
                            <CardHeader className="p-4">
                                <div className="flex justify-between">
                                    <CardTitle className="text-base">{comp.title}</CardTitle>
                                    <Badge variant="secondary" className="text-xs">{comp.status}</Badge>
                                </div>
                                <CardDescription className="flex items-center gap-2 text-xs mt-1">
                                    <Calendar className="h-3 w-3" /> {new Date(comp.start_date).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
      </section>

  
      <section className="relative rounded-3xl overflow-hidden bg-blue-600 text-white py-20 px-6 text-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold">¿Listo para competir?</h2>
            <p className="text-blue-100 text-lg">Únete a la comunidad de robótica más grande de Europa y demuestra tus habilidades.</p>
            <Button asChild size="lg" className="h-14 px-8 text-lg bg-white text-blue-600 hover:bg-blue-50 border-none shadow-lg">
                <Link to="/register">Registrarse Ahora</Link>
            </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;