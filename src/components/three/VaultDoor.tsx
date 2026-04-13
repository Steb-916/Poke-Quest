'use client';

import { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { VaultDoorModel } from './VaultDoorModel';

interface VaultDoorProps {
  onComplete: () => void;
  skipToEnd: boolean;
}

export function VaultDoor({ onComplete, skipToEnd }: VaultDoorProps) {
  const [lightIntensity, setLightIntensity] = useState(0);
  const completedRef = useRef(false);

  const handleProgress = useCallback((progress: number) => {
    if (progress > 0.5) {
      const bloomProgress = Math.min((progress - 0.5) / 0.3, 1);
      setLightIntensity(bloomProgress);
    }

    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{
        position: [0, -0.3, 5],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          console.warn('WebGL context lost — triggering animation complete');
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete();
          }
        });
      }}
    >
      <color attach="background" args={['#000000']} />

      <ambientLight intensity={0.3} />

      {/* Key light */}
      <directionalLight position={[2, 4, 3]} intensity={1.5} color="#e8e0d6" />

      {/* Fill light */}
      <directionalLight position={[-3, -1, 2]} intensity={0.4} color="#8888cc" />

      {/* Warm backlight — revealed as door opens */}
      <pointLight
        position={[0, 0, -2]}
        intensity={lightIntensity * 8}
        color="#ffd699"
        distance={20}
      />

      <pointLight
        position={[0, 0.5, -1]}
        intensity={lightIntensity * 4}
        color="#ffe4b5"
        distance={15}
      />

      <VaultDoorModel onProgress={handleProgress} skipToEnd={skipToEnd} />
    </Canvas>
  );
}
