import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Bot, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();
  const robotRef = useRef(null);

  useEffect(() => {
    // Animation: Robot floating and looking confused
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    
    // Floating motion
    tl.to(robotRef.current, {
      y: -20,
      duration: 1.5,
      ease: "power1.inOut"
    });

    // Head tilt / confusion animation
    const tiltTl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    tiltTl.to(robotRef.current, {
      rotation: 15,
      duration: 0.4,
      ease: "power1.inOut"
    }).to(robotRef.current, {
      rotation: -15,
      duration: 0.4,
      ease: "power1.inOut"
    }).to(robotRef.current, {
      rotation: 0,
      duration: 0.4,
      ease: "power1.inOut"
    });
    
    // Initial pop in
    gsap.fromTo(robotRef.current, 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
    );
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div ref={robotRef} className="inline-block mb-6 text-blue-500 dark:text-blue-400">
            <Bot size={150} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-8xl font-bold mb-2 text-gray-900 dark:text-white">404</h1>
        
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          {t('notFound.subtitle')}
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {t('notFound.message')}
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Home size={20} />
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
