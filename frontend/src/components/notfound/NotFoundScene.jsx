import { useEffect, useRef, useState } from 'react';
import { Bot } from 'lucide-react';

export default function NotFoundScene({ className = '' }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let rafId = 0;
    let resizeObserver;

    let renderer;
    let scene;
    let camera;

    let disposeScene;

    const mountEl = mountRef.current;
    if (!mountEl) return undefined;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const init = async () => {
      try {
        const THREE = await import('three');

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0b1220, 6, 18);

        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 2.3, 6.2);

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        mountEl.appendChild(renderer.domElement);

        const setSize = () => {
          const { width, height } = mountEl.getBoundingClientRect();
          const w = Math.max(1, Math.floor(width));
          const h = Math.max(1, Math.floor(height));
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };

        setSize();

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => setSize());
          resizeObserver.observe(mountEl);
        } else {
          window.addEventListener('resize', setSize);
        }

        scene.add(new THREE.AmbientLight(0xffffff, 0.45));

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
        keyLight.position.set(6, 10, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 30;
        scene.add(keyLight);

        const rim = new THREE.PointLight(0x3b82f6, 0.9, 20);
        rim.position.set(-4, 4, -6);
        scene.add(rim);

        // Floor
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 40),
          new THREE.MeshStandardMaterial({
            color: 0x020617,
            roughness: 0.95,
            metalness: 0.0,
          })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.05;
        floor.receiveShadow = true;
        scene.add(floor);

        const grid = new THREE.GridHelper(40, 40, 0x1d4ed8, 0x0f172a);
        grid.position.y = -1.049;
        grid.material.opacity = 0.22;
        grid.material.transparent = true;
        scene.add(grid);

        // Stars
        const starCount = 500;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i += 1) {
          const i3 = i * 3;
          const r = 10 + Math.random() * 8;
          const theta = Math.random() * Math.PI * 2;
          const y = 0.5 + Math.random() * 6;
          starPositions[i3] = Math.cos(theta) * r;
          starPositions[i3 + 1] = y;
          starPositions[i3 + 2] = Math.sin(theta) * r;
        }
        const starsGeom = new THREE.BufferGeometry();
        starsGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starsMat = new THREE.PointsMaterial({
          color: 0x93c5fd,
          size: 0.04,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        });
        const stars = new THREE.Points(starsGeom, starsMat);
        scene.add(stars);

        // Robot
        const robotMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.35,
          metalness: 0.7,
        });
        const robotDark = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.7,
          metalness: 0.2,
        });
        const eyeMat = new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          emissive: new THREE.Color(0x3b82f6),
          emissiveIntensity: 1.6,
          roughness: 0.2,
          metalness: 0.1,
        });

        const robot = new THREE.Group();
        robot.position.set(0, -0.9, 0);
        scene.add(robot);

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.45, 0.7), robotMat);
        body.position.y = 0.75;
        body.castShadow = true;
        robot.add(body);

        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.05), robotDark);
        chest.position.set(0, 0.6, 0.38);
        robot.add(chest);

        const headPivot = new THREE.Group();
        headPivot.position.set(0, 1.65, 0);
        robot.add(headPivot);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), robotMat);
        head.castShadow = true;
        headPivot.add(head);

        const face = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.35, 0.06), robotDark);
        face.position.set(0, 0.02, 0.39);
        headPivot.add(face);

        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), eyeMat);
        eyeL.position.set(-0.14, 0.06, 0.44);
        const eyeR = eyeL.clone();
        eyeR.position.x = 0.14;
        headPivot.add(eyeL, eyeR);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 12), robotDark);
        antenna.position.set(0.22, 0.52, 0);
        headPivot.add(antenna);
        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), eyeMat);
        antennaTip.position.set(0.22, 0.72, 0);
        headPivot.add(antennaTip);

        const createArm = (side) => {
          const shoulder = new THREE.Group();
          shoulder.position.set(0.74 * side, 1.05, 0);

          const upper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), robotMat);
          upper.position.set(0, -0.45, 0);
          upper.castShadow = true;
          shoulder.add(upper);

          const hand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), robotDark);
          hand.position.set(0, -0.95, 0.02);
          shoulder.add(hand);

          return shoulder;
        };

        const armL = createArm(-1);
        const armR = createArm(1);
        robot.add(armL, armR);

        const createLeg = (side) => {
          const hip = new THREE.Group();
          hip.position.set(0.28 * side, 0.05, 0);

          const upper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.05, 0.3), robotMat);
          upper.position.set(0, -0.55, 0);
          upper.castShadow = true;
          hip.add(upper);

          const foot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.6), robotDark);
          foot.position.set(0, -1.1, 0.12);
          foot.castShadow = true;
          hip.add(foot);

          return hip;
        };

        const legL = createLeg(-1);
        const legR = createLeg(1);
        robot.add(legL, legR);

        // Little "radar ping" ring
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.18, 0.22, 48),
          new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -1.02;
        scene.add(ring);

        const disposables = [
          floor.geometry,
          floor.material,
          grid.geometry,
          starsGeom,
          starsMat,
          body.geometry,
          body.material,
          chest.geometry,
          chest.material,
          head.geometry,
          head.material,
          face.geometry,
          face.material,
          eyeL.geometry,
          eyeL.material,
          antenna.geometry,
          antenna.material,
          antennaTip.geometry,
          antennaTip.material,
          ring.geometry,
          ring.material,
        ];

        const addGroupDisposables = (root) => {
          root.traverse((obj) => {
            if (!obj.isMesh) return;
            if (obj.geometry) disposables.push(obj.geometry);
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.filter(Boolean).forEach((m) => disposables.push(m));
          });
        };
        addGroupDisposables(robot);

        disposeScene = () => {
          try {
            if (resizeObserver) resizeObserver.disconnect();
          } catch {
            // ignore
          }

          try {
            window.removeEventListener('resize', setSize);
          } catch {
            // ignore
          }

          if (rafId) cancelAnimationFrame(rafId);

          try {
            if (renderer) {
              renderer.dispose();
              renderer.forceContextLoss?.();
            }
          } catch {
            // ignore
          }

          disposables.forEach((d) => {
            try {
              d.dispose?.();
            } catch {
              // ignore
            }
          });

          if (renderer?.domElement?.parentNode === mountEl) {
            mountEl.removeChild(renderer.domElement);
          }
        };

        const clockStart = performance.now();
        const renderOnce = (timeMs) => {
          const t = (timeMs - clockStart) / 1000;

          // Walk cycle + "lost" wobble
          const step = Math.sin(t * 4.0);
          legL.rotation.x = step * 0.65;
          legR.rotation.x = Math.sin(t * 4.0 + Math.PI) * 0.65;

          armL.rotation.x = Math.sin(t * 4.0 + Math.PI) * 0.45;
          armR.rotation.x = step * 0.45;

          robot.rotation.z = Math.sin(t * 2.1) * 0.06;
          robot.position.y = -0.9 + Math.abs(step) * 0.05;

          headPivot.rotation.y = Math.sin(t * 1.25) * 0.85;
          headPivot.rotation.x = Math.sin(t * 0.7) * 0.28;

          robot.position.x = Math.sin(t * 0.55) * 1.4;
          robot.rotation.y = Math.sin(t * 0.55) * 0.35;

          // Subtle camera drift
          camera.position.x = Math.sin(t * 0.18) * 0.22;
          camera.position.y = 2.25 + Math.sin(t * 0.22) * 0.06;
          camera.lookAt(0, 0.65, 0);

          // Atmospherics
          stars.rotation.y = t * 0.03;
          ring.scale.setScalar(1 + (Math.sin(t * 1.6) * 0.12 + 0.12));
          ring.material.opacity = 0.25 + Math.abs(Math.sin(t * 1.6)) * 0.35;

          renderer.render(scene, camera);
        };

        if (prefersReducedMotion) {
          renderOnce(performance.now());
          return;
        }

        const loop = (timeMs) => {
          renderOnce(timeMs);
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      } catch {
        setFailed(true);
      }
    };

    init();

    return () => {
      disposeScene?.();
    };
  }, []);

  if (failed) {
    return (
      <div
        className={`grid h-full w-full place-items-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400 ${className}`}
        aria-hidden="true"
      >
        <Bot className="h-10 w-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative h-full w-full overflow-hidden rounded-2xl ${className}`}
      aria-hidden="true"
    />
  );
}
