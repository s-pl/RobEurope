import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';

const ArduinoBoard = ({ position = [0, 0, 0], scale = 1 }) => {
  const traceColor = '#7dd3fc';
  const points = useMemo(() => [
    [
      [-1.2, 0.03, -0.35],
      [-0.6, 0.03, -0.35],
      [-0.45, 0.03, -0.1],
      [0.2, 0.03, -0.1],
    ],
    [
      [-0.95, 0.03, 0.18],
      [-0.25, 0.03, 0.18],
      [0.1, 0.03, 0.38],
      [0.95, 0.03, 0.38],
    ],
    [
      [-1.05, 0.03, 0],
      [-0.45, 0.03, 0],
      [-0.3, 0.03, 0.35],
      [0.55, 0.03, 0.35],
    ],
  ], []);

  return (
    <group position={position} scale={scale}>
      <mesh receiveShadow castShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 0.08, 1.8]} />
        <meshStandardMaterial color="#0f766e" roughness={0.45} metalness={0.15} />
      </mesh>

      <mesh castShadow position={[-1.15, 0.12, 0.45]}>
        <boxGeometry args={[0.5, 0.16, 0.38]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.85} />
      </mesh>

      <mesh castShadow position={[0.35, 0.11, 0]}>
        <boxGeometry args={[1.05, 0.12, 0.58]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.1} />
      </mesh>

      <mesh castShadow position={[1.12, 0.11, -0.25]}>
        <boxGeometry args={[0.45, 0.12, 0.45]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.25} />
      </mesh>

      <mesh castShadow position={[-0.05, 0.11, -0.56]}>
        <boxGeometry args={[2.1, 0.14, 0.15]} />
        <meshStandardMaterial color="#111827" roughness={0.45} metalness={0.15} />
      </mesh>

      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`pin-a-${i}`} position={[-1, 0.18, -0.56 + i * 0.08]}>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      <mesh castShadow position={[0.9, 0.12, 0.48]}>
        <cylinderGeometry args={[0.12, 0.12, 0.16, 24]} />
        <meshStandardMaterial color="#1f2937" roughness={0.45} metalness={0.2} />
      </mesh>

      {points.map((line, idx) => (
        <Line key={`trace-${idx}`} points={line} color={traceColor} lineWidth={1.8} transparent opacity={0.7} />
      ))}
    </group>
  );
};

const DataPulse = ({ offset = 0 }) => {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.35 + offset;
    ref.current.position.x = -3 + ((t % 1) * 6);
    ref.current.position.y = Math.sin((t + offset) * Math.PI * 4) * 0.05 + 0.7;
    ref.current.position.z = Math.cos((t + offset) * Math.PI * 2) * 0.55;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 12, 12]} />
      <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.8} />
    </mesh>
  );
};

const ChipCluster = ({ position = [0, 0, 0] }) => {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.1, 0.18, 0.8]} />
        <meshStandardMaterial color="#111827" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.2} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`chip-pin-${i}`} position={[-0.55 + i * 0.1, -0.06, 0.43]}>
          <boxGeometry args={[0.03, 0.06, 0.03]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`chip-pin-b-${i}`} position={[-0.55 + i * 0.1, -0.06, -0.43]}>
          <boxGeometry args={[0.03, 0.06, 0.03]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
};

const Scene = () => {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} color="#dbeafe" castShadow />
      <pointLight position={[-3, 2, -1]} intensity={0.7} color="#67e8f9" />

      <group rotation={[-0.3, 0.52, 0]} position={[0, -0.2, 0]}>
        <Float speed={reducedMotion ? 0 : 1.2} rotationIntensity={reducedMotion ? 0 : 0.1} floatIntensity={reducedMotion ? 0 : 0.25}>
          <ArduinoBoard position={[-0.8, 0.28, 0.2]} scale={0.9} />
        </Float>

        <Float speed={reducedMotion ? 0 : 1.5} rotationIntensity={reducedMotion ? 0 : 0.2} floatIntensity={reducedMotion ? 0 : 0.18}>
          <ChipCluster position={[1.4, 0.4, -0.55]} />
        </Float>

        <Line
          points={[
            [-1.5, 0.35, 0.2],
            [-0.8, 0.6, 0.1],
            [0.1, 0.65, -0.1],
            [1.2, 0.5, -0.5],
          ]}
          color="#60a5fa"
          lineWidth={2.2}
          transparent
          opacity={0.35}
        />

        {!reducedMotion && (
          <>
            <DataPulse offset={0} />
            <DataPulse offset={0.33} />
            <DataPulse offset={0.66} />
          </>
        )}
      </group>
    </>
  );
};

const ElectronicsBackdrop3D = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] hidden lg:block" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 1.3, 5], fov: 46 }} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  );
};

export default ElectronicsBackdrop3D;
