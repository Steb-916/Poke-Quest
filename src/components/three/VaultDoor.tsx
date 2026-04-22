'use client';

import { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { VaultDoorModel } from './VaultDoorModel';

interface VaultDoorProps {
  onComplete: () => void;
  skipToEnd: boolean;
  onProgress?: (progress: number) => void;
}

export function VaultDoor({ onComplete, skipToEnd, onProgress }: VaultDoorProps) {
  const [lightIntensity, setLightIntensity] = useState(0);
  const completedRef = useRef(false);

  const handleProgress = useCallback((progress: number) => {
    onProgress?.(progress);

    if (progress > 0.5) {
      const bloomProgress = Math.min((progress - 0.5) / 0.3, 1);
      setLightIntensity(bloomProgress);
    }

    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete, onProgress]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{
        position: [0, -0.2, 4.5],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          setTimeout(() => {
            if (!completedRef.current) {
              completedRef.current = true;
              onComplete();
            }
          }, 5500);
        });
      }}
    >
      {/* No background color — canvas is transparent to show cards underneath */}

      <ambientLight intensity={0.08} />

      {/* Key light — warm, dramatic upper-left */}
      <directionalLight position={[-4, 5, 6]} intensity={3.0} color="#fff5e6" />

      {/* Fill light — cool blue, opposite side */}
      <directionalLight position={[4, 0, 4]} intensity={0.6} color="#6677aa" />

      {/* Rim/edge light — silhouette definition */}
      <pointLight position={[0, 3, -4]} intensity={2.5} color="#aabbdd" distance={12} />

      {/* Under-light — drama */}
      <pointLight position={[0, -3, 2]} intensity={0.4} color="#443322" distance={8} />

      {/* Warm backlight — floods through as door opens */}
      <pointLight
        position={[0, 0, -2]}
        intensity={lightIntensity * 12}
        color="#ffd080"
        distance={20}
      />

      <pointLight
        position={[0, 0.5, -1.5]}
        intensity={lightIntensity * 6}
        color="#ffe4b5"
        distance={15}
      />

      <VaultDoorModel onProgress={handleProgress} skipToEnd={skipToEnd} />
    </Canvas>
  );
}
