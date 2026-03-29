/**
 * GSAP setup module.
 * Import from here to ensure plugins are registered once.
 * Usage: import { gsap, ScrollTrigger } from '../lib/gsap';
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Respect prefers-reduced-motion globally
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) {
  gsap.globalTimeline.timeScale(0);
}

export { gsap, ScrollTrigger };
