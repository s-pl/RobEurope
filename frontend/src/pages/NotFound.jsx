import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { HelpCircle, Home } from 'lucide-react';

const NotFound = () => {
  const questionMarkRef = useRef(null);

  useEffect(() => {
    // Animation: Tilt head (question mark) left and right like being confused
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(questionMarkRef.current, {
      rotation: 15,
      duration: 0.6,
      ease: "power1.inOut"
    }).to(questionMarkRef.current, {
      rotation: -15,
      duration: 0.6,
      ease: "power1.inOut"
    });
    
    // Initial pop in
    gsap.fromTo(questionMarkRef.current, 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
    );
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div ref={questionMarkRef} className="inline-block mb-6 text-blue-500 dark:text-blue-400">
            <HelpCircle size={120} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-8xl font-bold mb-2 text-gray-900 dark:text-white">404</h1>
        
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          ¿Estás perdido?
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Parece que la página que buscas no existe. Tal vez escribiste mal la dirección o la página se ha movido.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Home size={20} />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
