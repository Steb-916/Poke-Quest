'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TOTAL_DURATION = 4.8;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
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
  const bolt1Ref = useRef<THREE.Mesh>(null);
  const bolt2Ref = useRef<THREE.Mesh>(null);
  const bolt3Ref = useRef<THREE.Mesh>(null);
  const sceneRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);

  const materials = useMemo(() => ({
    door: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a2a30'),
      metalness: 0.9,
      roughness: 0.3,
    }),
    frame: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3a3a44'),
      metalness: 0.85,
      roughness: 0.35,
    }),
    handle: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#8a7a50'),
      metalness: 0.95,
      roughness: 0.2,
    }),
    bolt: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#555560'),
      metalness: 0.9,
      roughness: 0.25,
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

    // Phase 2: Wheel spin (0.10 - 0.40) — 720° = 4π
    if (wheelRef.current) {
      const spinProgress = easeInOutCubic(phaseProgress(progress, 0.1, 0.4));
      wheelRef.current.rotation.z = spinProgress * Math.PI * 4;
    }

    // Phase 3: Bolts retract (0.40 - 0.50)
    const boltProgress = easeOutBack(phaseProgress(progress, 0.4, 0.5));
    const boltRetract = boltProgress * 0.3;
    if (bolt1Ref.current) bolt1Ref.current.position.x = 1.8 - boltRetract;
    if (bolt2Ref.current) bolt2Ref.current.position.x = 1.8 - boltRetract;
    if (bolt3Ref.current) bolt3Ref.current.position.x = 1.8 - boltRetract;

    // Phase 4: Door swing open (0.50 - 0.80) — rotate -100° on Y axis
    if (doorPivotRef.current) {
      const swingProgress = easeInOutQuart(phaseProgress(progress, 0.5, 0.8));
      doorPivotRef.current.rotation.y = -swingProgress * (100 * Math.PI / 180);
    }
  });

  return (
    <group ref={sceneRef}>
      {/* Door Frame — ring around the door (stays fixed) */}
      <mesh material={materials.frame}>
        <torusGeometry args={[2.3, 0.15, 16, 64]} />
      </mesh>

      {/* Inner frame ring */}
      <mesh material={materials.frame} position={[0, 0, -0.05]}>
        <torusGeometry args={[2.1, 0.08, 16, 64]} />
      </mesh>

      {/* Door pivot — positioned at left edge so door swings from left hinge */}
      <group ref={doorPivotRef} position={[-2, 0, 0]}>
        {/* Offset door back to center relative to pivot */}
        <group position={[2, 0, 0]}>
          {/* Door disc — rotated so flat face points at camera */}
          <mesh material={materials.door} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 0.15, 64]} />
          </mesh>

          {/* Handle wheel */}
          <group ref={wheelRef} position={[0, 0, 0.12]}>
            {/* Outer ring */}
            <mesh material={materials.handle}>
              <torusGeometry args={[0.6, 0.04, 16, 32]} />
            </mesh>
            {/* 4 spokes */}
            {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle, i) => (
              <mesh key={i} material={materials.handle} rotation={[0, 0, angle]}>
                <boxGeometry args={[1.2, 0.04, 0.04]} />
              </mesh>
            ))}
            {/* Center hub */}
            <mesh material={materials.handle} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
            </mesh>
          </group>

          {/* Locking bolts — right edge of door */}
          <mesh ref={bolt1Ref} material={materials.bolt} position={[1.8, 0.6, 0.1]}>
            <boxGeometry args={[0.4, 0.08, 0.08]} />
          </mesh>
          <mesh ref={bolt2Ref} material={materials.bolt} position={[1.8, 0, 0.1]}>
            <boxGeometry args={[0.4, 0.08, 0.08]} />
          </mesh>
          <mesh ref={bolt3Ref} material={materials.bolt} position={[1.8, -0.6, 0.1]}>
            <boxGeometry args={[0.4, 0.08, 0.08]} />
          </mesh>

          {/* Door surface details — concentric rings */}
          {[0.5, 1.0, 1.5].map((radius, i) => (
            <mesh key={i} material={materials.frame} position={[0, 0, 0.08]}>
              <torusGeometry args={[radius, 0.015, 8, 64]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
