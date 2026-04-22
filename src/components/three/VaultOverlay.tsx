'use client';

import { useState, useEffect, useCallback } from 'react';
import { VaultDoor } from './VaultDoor';

export function VaultOverlay() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [skipToEnd, setSkipToEnd] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [doorProgress, setDoorProgress] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      sessionStorage.setItem('vault-intro-played', 'true');
      return;
    }

    const hasPlayed = sessionStorage.getItem('vault-intro-played');
    if (hasPlayed) return;

    setShouldShow(true);

    const skipTimer = setTimeout(() => setShowSkipButton(true), 1000);
    return () => clearTimeout(skipTimer);
  }, []);

  const handleComplete = useCallback(() => {
    sessionStorage.setItem('vault-intro-played', 'true');
    sessionStorage.setItem('vault-just-completed', 'true');
    // Brief delay so the zoom finishes before removal
    setTimeout(() => setIsRemoved(true), 200);
  }, []);

  const handleSkip = useCallback(() => {
    setSkipToEnd(true);
    sessionStorage.setItem('vault-intro-played', 'true');
    setTimeout(() => setIsRemoved(true), 100);
  }, []);

  const handleProgress = useCallback((progress: number) => {
    setDoorProgress(progress);
    window.dispatchEvent(new CustomEvent('vault-progress', { detail: progress }));
  }, []);

  if (!shouldShow || isRemoved) return null;

  // After door opens (progress 0.50+), start the "walk through" zoom
  const walkPhase = Math.max(0, (doorProgress - 0.55) / 0.40); // 0 to 1 over the last 40%
  const eased = walkPhase * walkPhase * (3 - 2 * walkPhase); // smoothstep

  // Vault zooms up (like it's rushing past you) — goes from scale 1 to scale 4
  const vaultScale = 1 + eased * 3;
  // Background fades as door opens
  const bgOpacity = Math.max(0, 1 - eased);
  // Entire overlay fades once zoom is nearly complete
  const overlayOpacity = doorProgress > 0.92 ? Math.max(0, 1 - (doorProgress - 0.92) / 0.08) : 1;

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{
        opacity: overlayOpacity,
        pointerEvents: overlayOpacity < 0.1 ? 'none' : 'auto',
      }}
    >
      {/* Background — fades to reveal cards underneath */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(6, 6, 12, ${bgOpacity})`,
        }}
      />

      {/* 3D vault door — scales up as if camera pushes through */}
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${vaultScale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <VaultDoor
          onComplete={handleComplete}
          skipToEnd={skipToEnd}
          onProgress={handleProgress}
        />
      </div>

      {/* Skip button */}
      {showSkipButton && doorProgress < 0.9 && (
        <button
          onClick={handleSkip}
          className="absolute bottom-8 right-8 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors duration-200 tracking-wider uppercase z-10"
          style={{ animation: 'fadeIn 500ms ease-out' }}
        >
          Skip
        </button>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
