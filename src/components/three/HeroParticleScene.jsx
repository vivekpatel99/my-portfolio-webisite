import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color } from 'three';

const palette = ['#7C3AED', '#9372FF', '#D4B4FF'].map((value) => new Color(value));

const createPointCloud = (count, radius) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const stride = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radialNoise = (Math.random() - 0.5) * 0.8;
    const distance = radius + radialNoise;

    positions[stride] = distance * Math.sin(phi) * Math.cos(theta);
    positions[stride + 1] = distance * Math.sin(phi) * Math.sin(theta);
    positions[stride + 2] = distance * Math.cos(phi) * 0.78;

    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[stride] = color.r;
    colors[stride + 1] = color.g;
    colors[stride + 2] = color.b;
  }

  return { positions, colors };
};

const createNodeGraph = (nodeCount, radius) => {
  const nodePositions = [];

  for (let i = 0; i < nodeCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const distance = radius * (0.4 + Math.random() * 0.6);

    nodePositions.push([
      distance * Math.sin(phi) * Math.cos(theta),
      distance * Math.sin(phi) * Math.sin(theta),
      distance * Math.cos(phi) * 0.7,
    ]);
  }

  const segments = [];
  const colorValues = [];

  for (let i = 0; i < nodePositions.length; i += 1) {
    const targetA = (i + 1) % nodePositions.length;
    const targetB = (i + 7) % nodePositions.length;
    const targets = [targetA, targetB];

    targets.forEach((targetIndex, targetOrder) => {
      const from = nodePositions[i];
      const to = nodePositions[targetIndex];
      segments.push(...from, ...to);

      const color = palette[(i + targetOrder) % palette.length];
      colorValues.push(
        color.r * 0.7,
        color.g * 0.7,
        color.b * 0.7,
        color.r * 0.4,
        color.g * 0.4,
        color.b * 0.4,
      );
    });
  }

  return {
    linePositions: new Float32Array(segments),
    lineColors: new Float32Array(colorValues),
  };
};

const NeuralCluster = ({ particleCount, nodeCount }) => {
  const groupRef = useRef(null);
  const pointsRef = useRef(null);
  const graphRef = useRef(null);

  const pointCloud = useMemo(() => createPointCloud(particleCount, 3.05), [particleCount]);
  const graph = useMemo(() => createNodeGraph(nodeCount, 3.2), [nodeCount]);

  useFrame((state, delta) => {
    if (!groupRef.current || !pointsRef.current || !graphRef.current) {
      return;
    }

    const { pointer, clock } = state;
    const elapsed = clock.getElapsedTime();
    const targetX = pointer.y * 0.22;
    const targetY = pointer.x * 0.34;

    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.03;
    groupRef.current.rotation.y += ((elapsed * 0.08) + targetY - groupRef.current.rotation.y) * 0.03;
    groupRef.current.position.x += (pointer.x * 0.35 - groupRef.current.position.x) * 0.02;
    groupRef.current.position.y += (pointer.y * 0.24 - groupRef.current.position.y) * 0.02;

    pointsRef.current.rotation.z += delta * 0.025;
    graphRef.current.rotation.z = Math.sin(elapsed * 0.2) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={graphRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={graph.linePositions}
            count={graph.linePositions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={graph.lineColors}
            count={graph.lineColors.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.3}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={pointCloud.positions}
            count={pointCloud.positions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={pointCloud.colors}
            count={pointCloud.colors.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          transparent
          size={0.03}
          sizeAttenuation
          opacity={0.82}
          vertexColors
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
};

const HeroParticleScene = ({ particleCount = 2600, nodeCount = 140 }) => (
  <div className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
    <Canvas
      dpr={[1, 2]}
      frameloop="always"
      camera={{ position: [0, 0, 6], fov: 55, near: 0.1, far: 20 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0C0D0D']} />
      <fog attach="fog" args={['#0C0D0D', 4.4, 11]} />
      <NeuralCluster particleCount={particleCount} nodeCount={nodeCount} />
    </Canvas>
  </div>
);

export default HeroParticleScene;
