import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

const FloatingAccents = () => {
  const rootRef = useRef(null);

  useFrame(({ pointer, clock }) => {
    if (!rootRef.current) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    rootRef.current.rotation.y = elapsed * 0.08 + pointer.x * 0.2;
    rootRef.current.rotation.x = Math.sin(elapsed * 0.2) * 0.08 + pointer.y * 0.16;
    rootRef.current.position.x = pointer.x * 0.3;
    rootRef.current.position.y = pointer.y * 0.2;
  });

  return (
    <group ref={rootRef}>
      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={1.1}>
        <mesh position={[-1.8, 0.3, -0.5]} scale={0.95}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#7C3AED"
            wireframe
            transparent
            opacity={0.45}
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={0.7} floatIntensity={1.4}>
        <mesh position={[1.7, -0.25, 0.4]} scale={0.8}>
          <torusKnotGeometry args={[0.6, 0.16, 120, 20]} />
          <meshBasicMaterial
            color="#9372FF"
            wireframe
            transparent
            opacity={0.38}
          />
        </mesh>
      </Float>

      <Float speed={1.3} rotationIntensity={0.4} floatIntensity={0.7}>
        <mesh position={[0, 0, -1]} scale={1.08}>
          <sphereGeometry args={[0.85, 64, 64]} />
          <MeshDistortMaterial
            color="#9372FF"
            transparent
            opacity={0.25}
            speed={1.5}
            distort={0.36}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      </Float>
    </group>
  );
};

const CtaAccentScene = () => (
  <div className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
    <Canvas
      dpr={[1, 2]}
      frameloop="always"
      camera={{ position: [0, 0, 5.8], fov: 52, near: 0.1, far: 20 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0C0D0D']} />
      <fog attach="fog" args={['#0C0D0D', 3.5, 9.5]} />
      <ambientLight intensity={0.5} />
      <directionalLight intensity={0.8} position={[2, 3, 5]} color="#D4B4FF" />
      <FloatingAccents />
    </Canvas>
  </div>
);

export default CtaAccentScene;
