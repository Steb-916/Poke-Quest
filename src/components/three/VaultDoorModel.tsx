'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TOTAL_DURATION = 5.5;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function phaseProgress(progress: number, start: number, end: number) {
  if (progress < start) return 0;
  if (progress > end) return 1;
  return (progress - start) / (end - start);
}

interface VaultDoorModelProps {
  onProgress?: (progress: number) => void;
  skipToEnd?: boolean;
}

export function VaultDoorModel({ onProgress, skipToEnd }: VaultDoorModelProps) {
  const doorPivotRef = useRef<THREE.Group>(null);
  const wheelRef = useRef<THREE.Group>(null);
  const sceneRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);

  const materials = useMemo(() => ({
    door: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a2a34'),
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 0.8,
    }),
    doorEdge: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#222230'),
      metalness: 0.95,
      roughness: 0.15,
    }),
    frame: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1e1e28'),
      metalness: 0.88,
      roughness: 0.28,
    }),
    handle: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#c9a020'),
      metalness: 1.0,
      roughness: 0.12,
      emissive: new THREE.Color('#8a7a10'),
      emissiveIntensity: 0.8,
    }),
    ringDetail: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#353540'),
      metalness: 0.9,
      roughness: 0.2,
    }),
  }), []);

  useFrame(({ clock }) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = clock.getElapsedTime();
    }

    const elapsed = clock.getElapsedTime() - startTimeRef.current;
    let progress = Math.min(elapsed / TOTAL_DURATION, 1);

    if (skipToEnd) {
      progress = 1;
    }

    onProgress?.(progress);

    // Phase 1: Fade in (0.00 - 0.10)
    if (sceneRef.current) {
      const fadeIn = phaseProgress(progress, 0, 0.1);
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.opacity = fadeIn;
          child.material.transparent = fadeIn < 1;
        }
      });
    }

    // Phase 2: Wheel spin (0.10 - 0.45) — 720° = 4π
    if (wheelRef.current) {
      const spinProgress = easeInOutCubic(phaseProgress(progress, 0.1, 0.45));
      wheelRef.current.rotation.z = spinProgress * Math.PI * 4;
    }

    // Phase 3: Door swing open (0.50 - 0.82)
    if (doorPivotRef.current) {
      const swingProgress = easeInOutQuart(phaseProgress(progress, 0.50, 0.82));
      doorPivotRef.current.rotation.y = -swingProgress * (100 * Math.PI / 180);
    }
  });

  return (
    <group ref={sceneRef}>
      {/* Outer frame — heavy vault frame ring */}
      <mesh material={materials.frame}>
        <torusGeometry args={[2.4, 0.2, 24, 80]} />
      </mesh>

      {/* Frame bevel ring */}
      <mesh material={materials.doorEdge} position={[0, 0, 0.02]}>
        <torusGeometry args={[2.15, 0.06, 16, 80]} />
      </mesh>

      {/* Door pivot — swings from left hinge */}
      <group ref={doorPivotRef} position={[-2, 0, 0]}>
        <group position={[2, 0, 0]}>
          {/* Door disc */}
          <mesh material={materials.door} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2.05, 2.05, 0.18, 80]} />
          </mesh>

          {/* Concentric rings on door face — decorative machining marks */}
          {[0.4, 0.8, 1.2, 1.6].map((radius, i) => (
            <mesh key={i} material={materials.ringDetail} position={[0, 0, 0.095]}>
              <torusGeometry args={[radius, 0.012, 8, 64]} />
            </mesh>
          ))}

          {/* Handle wheel */}
          <group ref={wheelRef} position={[0, 0, 0.14]}>
            {/* Outer handle ring — thicker for visual weight */}
            <mesh material={materials.handle}>
              <torusGeometry args={[0.65, 0.05, 20, 40]} />
            </mesh>

            {/* Inner ring */}
            <mesh material={materials.handle}>
              <torusGeometry args={[0.35, 0.025, 16, 32]} />
            </mesh>

            {/* 4 spokes — thicker */}
            {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle, i) => (
              <mesh key={i} material={materials.handle} rotation={[0, 0, angle]}>
                <boxGeometry args={[1.3, 0.05, 0.05]} />
              </mesh>
            ))}

            {/* Center hub — larger */}
            <mesh material={materials.handle} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.08, 20]} />
            </mesh>

            {/* Gold glow light on door surface */}
            <pointLight position={[0, 0, 0.2]} intensity={1.2} color="#c9a84c" distance={4} />
          </group>
        </group>
      </group>
    </group>
  );
}
