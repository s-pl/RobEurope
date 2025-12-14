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
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
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

        // A "cool" centerpiece (procedural): glowing torus-knot + mini robot.
        const knot = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.72, 0.22, 180, 22),
          new THREE.MeshStandardMaterial({
            color: 0x60a5fa,
            emissive: 0x1d4ed8,
            emissiveIntensity: 0.55,
            roughness: 0.25,
            metalness: 0.75,
          })
        );
        knot.position.set(0, 1.25, -0.3);
        knot.castShadow = true;
        scene.add(knot);

        const glow = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.76, 0.24, 120, 14),
          new THREE.MeshBasicMaterial({
            color: 0x93c5fd,
            transparent: true,
            opacity: 0.14,
            depthWrite: false,
          })
        );
        glow.position.copy(knot.position);
        scene.add(glow);

        const robot = new THREE.Group();
        robot.position.set(0, -0.95, 0.35);
        scene.add(robot);

        const robotMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.38,
          metalness: 0.65,
        });
        const robotDark = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.7,
          metalness: 0.2,
        });
        const eyeMat = new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          emissive: new THREE.Color(0x3b82f6),
          emissiveIntensity: 1.8,
          roughness: 0.2,
          metalness: 0.1,
        });

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.65), robotMat);
        body.position.y = 0.75;
        body.castShadow = true;
        robot.add(body);

        const headPivot = new THREE.Group();
        headPivot.position.set(0, 1.55, 0);
        robot.add(headPivot);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), robotMat);
        head.castShadow = true;
        headPivot.add(head);

        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), eyeMat);
        eyeL.position.set(-0.14, 0.06, 0.44);
        const eyeR = eyeL.clone();
        eyeR.position.x = 0.14;
        headPivot.add(eyeL, eyeR);

        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.06), robotDark);
        brow.position.set(0.0, 0.2, 0.44);
        brow.rotation.z = 0.14;
        headPivot.add(brow);

        const armL = new THREE.Group();
        armL.position.set(-0.68, 1.02, 0);
        const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), robotMat);
        armLMesh.position.y = -0.45;
        armLMesh.castShadow = true;
        armL.add(armLMesh);
        robot.add(armL);

        const armR = new THREE.Group();
        armR.position.set(0.68, 1.02, 0);
        const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), robotMat);
        armRMesh.position.y = -0.45;
        armRMesh.castShadow = true;
        armR.add(armRMesh);
        robot.add(armR);

        const legL = new THREE.Group();
        legL.position.set(-0.26, 0.15, 0);
        const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.02, 0.28), robotMat);
        legLMesh.position.y = -0.56;
        legLMesh.castShadow = true;
        legL.add(legLMesh);
        robot.add(legL);

        const legR = new THREE.Group();
        legR.position.set(0.26, 0.15, 0);
        const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.02, 0.28), robotMat);
        legRMesh.position.y = -0.56;
        legRMesh.castShadow = true;
        legR.add(legRMesh);
        robot.add(legR);

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
          ...(Array.isArray(grid.material) ? grid.material : [grid.material]),
          starsGeom,
          starsMat,
          knot.geometry,
          knot.material,
          glow.geometry,
          glow.material,
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
        let lastTimeMs;
        const renderOnce = (timeMs) => {
          const t = (timeMs - clockStart) / 1000;
          Math.min(0.05, (timeMs - (lastTimeMs ?? timeMs)) / 1000);
          lastTimeMs = timeMs;

          // Torus knot: slow rotation + breathing.
          knot.rotation.x = t * 0.35;
          knot.rotation.y = t * 0.55;
          glow.rotation.x = -t * 0.25;
          glow.rotation.y = t * 0.4;
          const breathe = 1 + Math.sin(t * 1.2) * 0.03;
          knot.scale.setScalar(breathe);
          glow.scale.setScalar(breathe * 1.03);

          // Robot: simple walk + "doubt" head tilt.
          const step = Math.sin(t * 4.2);
          legL.rotation.x = step * 0.6;
          legR.rotation.x = Math.sin(t * 4.2 + Math.PI) * 0.6;
          armL.rotation.x = Math.sin(t * 4.2 + Math.PI) * 0.35;
          armR.rotation.x = step * 0.35;

          robot.position.x = Math.sin(t * 0.6) * 1.1;
          robot.rotation.y = Math.sin(t * 0.6) * 0.25;
          robot.rotation.z = Math.sin(t * 2.0) * 0.05;
          robot.position.y = -0.95 + Math.abs(step) * 0.04;

          headPivot.rotation.z = 0.18 + Math.sin(t * 1.1) * 0.06;
          headPivot.rotation.y = Math.sin(t * 0.9) * 0.08;
          brow.rotation.z = 0.14 + Math.sin(t * 1.4) * 0.05;

          // Gentle star drift.
          stars.rotation.y = t * 0.03;

          // Subtle camera drift
          camera.position.x = Math.sin(t * 0.18) * 0.22;
          camera.position.y = 2.25 + Math.sin(t * 0.22) * 0.06;
          camera.lookAt(0, 0.65, 0);

          // Atmospherics
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
        className={`grid h-full w-full place-items-center border border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 dark:text-blue-400 ${className}`}
        aria-hidden="true"
      >
        <Bot className="h-10 w-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
