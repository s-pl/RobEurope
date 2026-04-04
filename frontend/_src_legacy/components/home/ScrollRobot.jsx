import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useReducedMotion } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────────────────
   Robot SVG — each animatable part gets its own ref.
   All coordinates are in the viewBox "0 0 200 300" space.
   GSAP uses svgOrigin: "x y" (SVG units) to set pivot points precisely.
───────────────────────────────────────────────────────────────────────────── */

const PHASES = [
  {
    label: 'Presentando a ROBO',
    body: 'La mascota oficial de RobEurope, siempre lista para la acción.',
  },
  {
    label: 'Siempre en marcha',
    body: 'Explorando competiciones, formando equipos, superando límites.',
  },
  {
    label: '¡Al podio!',
    body: 'Compite, aprende y lidera junto a tu equipo esta temporada.',
  },
];

/* ── Component ──────────────────────────────────────────────────────────────── */

export const ScrollRobot = () => {
  const reduceMotion = useReducedMotion();

  /* Section + robot refs */
  const wrapRef   = useRef(null);
  const robotRef  = useRef(null);

  /* Animatable SVG parts */
  const headRef    = useRef(null);
  const armLRef    = useRef(null);
  const armRRef    = useRef(null);
  const legLRef    = useRef(null);
  const legRRef    = useRef(null);
  const antennaRef = useRef(null);

  /* Text phase refs */
  const textRefs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (reduceMotion) {
      /* Just fade the first label in for a11y */
      gsap.set(textRefs[0].current, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      /* ── Initial positions: everything starts off-screen below ── */
      gsap.set(robotRef.current, { y: 80, opacity: 0 });
      gsap.set([textRefs[0].current, textRefs[1].current, textRefs[2].current], { opacity: 0, y: 20 });

      /* ── Main scrubbed timeline ── */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
        },
      });

      /* ─ 0. Entry ─────────────────────────────────────── */
      tl.to(robotRef.current, { y: 0, opacity: 1, duration: 1.5, ease: 'power2.out' })
        .to(textRefs[0].current, { opacity: 1, y: 0, duration: 1.2 }, '<0.4')

        /* ─ 1. Wave ───────────────────────────────────── */
        .to(armRRef.current, { rotation: -128, svgOrigin: '165 90', duration: 2.5 }, '+=0.3')
        .to(headRef.current,  { rotation: 10,  svgOrigin: '100 85', duration: 1.8 }, '<0.4')
        .to(antennaRef.current,{ rotation: 18,  svgOrigin: '100 20', duration: 1.2 }, '<')

        /* look left */
        .to(headRef.current,   { rotation: -8,  svgOrigin: '100 85', duration: 2 }, '+=0.4')
        .to(antennaRef.current,{ rotation: -10, svgOrigin: '100 20', duration: 1.5 }, '<')

        /* label 1 → label 2 */
        .to(textRefs[0].current, { opacity: 0, y: -16, duration: 0.8 }, '<0.3')
        .to(textRefs[1].current, { opacity: 1, y: 0,   duration: 0.8 }, '<0.3')

        /* arm down */
        .to(armRRef.current, { rotation: 0, svgOrigin: '165 90', duration: 1.5 }, '+=0.2')
        .to(headRef.current, { rotation: 0, svgOrigin: '100 85', duration: 1.5 }, '<')
        .to(antennaRef.current, { rotation: 0, svgOrigin: '100 20', duration: 1 }, '<')

        /* ─ 2. Walk cycle ─────────────────────────────── */
        /* step 1 — leg L forward */
        .to(legLRef.current,  { y: -22, rotation: -12, svgOrigin: '77 173', duration: 1 }, '+=0.3')
        .to(legRRef.current,  { y:  14, rotation:   8, svgOrigin: '123 173', duration: 1 }, '<')
        .to(armRRef.current,  { rotation: -32, svgOrigin: '165 90', duration: 1 }, '<')
        .to(armLRef.current,  { rotation:  32, svgOrigin: '35 90',  duration: 1 }, '<')
        .to(robotRef.current, { y: -10, duration: 0.5 }, '<')

        /* mid step */
        .to(legLRef.current,  { y: 0, rotation: 0, svgOrigin: '77 173',  duration: 0.8 })
        .to(legRRef.current,  { y: 0, rotation: 0, svgOrigin: '123 173', duration: 0.8 }, '<')
        .to(armRRef.current,  { rotation: 0, svgOrigin: '165 90', duration: 0.8 }, '<')
        .to(armLRef.current,  { rotation: 0, svgOrigin: '35 90',  duration: 0.8 }, '<')
        .to(robotRef.current, { y: 0, duration: 0.4 }, '<')

        /* step 2 — leg R forward */
        .to(legRRef.current,  { y: -22, rotation: -12, svgOrigin: '123 173', duration: 1 })
        .to(legLRef.current,  { y:  14, rotation:   8, svgOrigin: '77 173',  duration: 1 }, '<')
        .to(armLRef.current,  { rotation: -32, svgOrigin: '35 90',  duration: 1 }, '<')
        .to(armRRef.current,  { rotation:  32, svgOrigin: '165 90', duration: 1 }, '<')
        .to(robotRef.current, { y: -10, duration: 0.5 }, '<')

        /* return neutral */
        .to(legRRef.current,  { y: 0, rotation: 0, svgOrigin: '123 173', duration: 0.8 })
        .to(legLRef.current,  { y: 0, rotation: 0, svgOrigin: '77 173',  duration: 0.8 }, '<')
        .to(armLRef.current,  { rotation: 0, svgOrigin: '35 90',  duration: 0.8 }, '<')
        .to(armRRef.current,  { rotation: 0, svgOrigin: '165 90', duration: 0.8 }, '<')
        .to(robotRef.current, { y: 0, duration: 0.4 }, '<')

        /* label 2 → label 3 */
        .to(textRefs[1].current, { opacity: 0, y: -16, duration: 0.8 }, '<0.2')
        .to(textRefs[2].current, { opacity: 1, y: 0,   duration: 0.8 }, '<0.3')

        /* ─ 3. Victory ────────────────────────────────── */
        .to(armRRef.current, { rotation: -155, svgOrigin: '165 90', duration: 1.8 }, '+=0.4')
        .to(armLRef.current, { rotation:  155, svgOrigin: '35 90',  duration: 1.8 }, '<')
        .to(headRef.current, { rotation: 0,    svgOrigin: '100 85', duration: 1.2 }, '<')

        /* jump */
        .to(robotRef.current, { y: -30, duration: 0.9, ease: 'power2.out' }, '<0.6')
        .to(robotRef.current, { y: 0,   duration: 0.6, ease: 'bounce.out' })

        /* antenna wiggle */
        .to(antennaRef.current, { rotation: 22,  svgOrigin: '100 20', duration: 0.4 }, '<0.1')
        .to(antennaRef.current, { rotation: -22, svgOrigin: '100 20', duration: 0.4 })
        .to(antennaRef.current, { rotation: 0,   svgOrigin: '100 20', duration: 0.3 })

        /* hold */
        .to({}, { duration: 1 });
    }, wrapRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return (
    /* Tall wrapper — scroll distance determines animation speed */
    <div ref={wrapRef} className="relative h-[280vh]">

      {/* Sticky viewport container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">

        {/* Subtle dot-grid backdrop */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 0.5px)', backgroundSize: '22px 22px' }}
          aria-hidden="true"
        />

        {/* Inner layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 px-6 w-full max-w-5xl">

          {/* ── Text phases (desktop: left, mobile: below) ── */}
          <div className="relative lg:w-80 h-28 shrink-0 order-2 lg:order-1">
            {PHASES.map((p, i) => (
              <div
                key={i}
                ref={textRefs[i]}
                className="absolute inset-0 opacity-0"
              >
                <span className="label-caps text-blue-500">{p.label}</span>
                <p className="font-display text-2xl lg:text-3xl font-black tracking-tighter leading-tight mt-2 text-white">
                  {p.body}
                </p>
              </div>
            ))}
          </div>

          {/* ── Robot SVG ── */}
          <div ref={robotRef} className="order-1 lg:order-2 shrink-0">
            <svg
              viewBox="0 0 200 300"
              width="220"
              height="330"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-stone-100"
              aria-hidden="true"
            >
              {/* Shadow */}
              <ellipse cx="100" cy="292" rx="62" ry="7"
                className="fill-stone-600 opacity-60" />

              {/* ── Left arm ── pivot shoulder (35, 90) */}
              <g ref={armLRef}>
                <rect x="22" y="90" width="26" height="48" className="fill-current" />
                <rect x="28" y="133" width="14" height="9" className="fill-blue-600 dark:fill-blue-500" />
                <rect x="22" y="140" width="26" height="38" className="fill-current" />
                <rect x="16" y="174" width="38" height="9" className="fill-current" />
              </g>

              {/* ── Right arm ── pivot shoulder (165, 90) */}
              <g ref={armRRef}>
                <rect x="152" y="90" width="26" height="48" className="fill-current" />
                <rect x="158" y="133" width="14" height="9" className="fill-blue-600 dark:fill-blue-500" />
                <rect x="152" y="140" width="26" height="38" className="fill-current" />
                <rect x="146" y="174" width="38" height="9" className="fill-current" />
              </g>

              {/* ── Left leg ── pivot hip (77, 173) */}
              <g ref={legLRef}>
                <rect x="60" y="173" width="34" height="46" className="fill-current" />
                <rect x="66" y="212" width="22" height="9" className="fill-blue-600 dark:fill-blue-500" />
                <rect x="60" y="219" width="34" height="44" className="fill-current" />
                <rect x="52" y="259" width="48" height="11" className="fill-current" />
              </g>

              {/* ── Right leg ── pivot hip (123, 173) */}
              <g ref={legRRef}>
                <rect x="106" y="173" width="34" height="46" className="fill-current" />
                <rect x="112" y="212" width="22" height="9" className="fill-blue-600 dark:fill-blue-500" />
                <rect x="106" y="219" width="34" height="44" className="fill-current" />
                <rect x="100" y="259" width="48" height="11" className="fill-current" />
              </g>

              {/* ── Torso ── */}
              <rect x="48" y="85" width="104" height="88" className="fill-current" />
              {/* Shoulder connectors */}
              <rect x="35" y="87" width="13" height="16" className="fill-stone-500" />
              <rect x="152" y="87" width="13" height="16" className="fill-stone-500" />
              {/* Hip connectors */}
              <rect x="60" y="163" width="32" height="12" className="fill-stone-500" />
              <rect x="108" y="163" width="32" height="12" className="fill-stone-500" />
              {/* Chest panel — blue square */}
              <rect x="62" y="100" width="32" height="22" className="fill-blue-600 dark:fill-blue-500" />
              {/* Chest panel — outlined */}
              <rect x="106" y="100" width="32" height="22"
                className="stroke-blue-600 dark:stroke-blue-500" strokeWidth="2" />
              {/* Status bars */}
              <rect x="62" y="130" width="76" height="5" className="fill-stone-600" />
              <rect x="62" y="140" width="52" height="5" className="fill-stone-600" />
              <rect x="62" y="150" width="30" height="5" className="fill-blue-600 dark:fill-blue-500 opacity-60" />

              {/* ── Head ── pivot neck (100, 85) */}
              <g ref={headRef}>
                {/* Head body */}
                <rect x="55" y="20" width="90" height="65" className="fill-current" />
                {/* Left eye */}
                <rect x="67" y="33" width="24" height="16" className="fill-blue-600 dark:fill-blue-500" />
                <rect x="73" y="38" width="9" height="5" fill="white" />
                {/* Right eye */}
                <rect x="109" y="33" width="24" height="16" className="fill-blue-600 dark:fill-blue-500" />
                <rect x="115" y="38" width="9" height="5" fill="white" />
                {/* Mouth — segmented bar */}
                <rect x="68" y="64" width="64" height="8" className="fill-blue-600 dark:fill-blue-500" />
                <rect x="75" y="65" width="10" height="6" className="fill-current" />
                <rect x="95" y="65" width="10" height="6" className="fill-current" />
                <rect x="115" y="65" width="10" height="6" className="fill-current" />
                {/* Neck */}
                <rect x="82" y="85" width="36" height="8" className="fill-stone-500 dark:fill-stone-600" />
              </g>

              {/* ── Antenna ── pivot base (100, 20) */}
              <g ref={antennaRef}>
                <rect x="97" y="5" width="6" height="17" className="fill-current" />
                <rect x="88" y="2" width="24" height="6" className="fill-blue-600 dark:fill-blue-500" />
                <rect x="93" y="0" width="14" height="5" className="fill-current" />
              </g>
            </svg>
          </div>
        </div>

        {/* Scroll hint — fades out as user scrolls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-60">
          <span className="label-caps text-stone-500">scroll</span>
          <div className="h-8 w-px bg-stone-700" />
        </div>
      </div>
    </div>
  );
};

export default ScrollRobot;
