'use client';

import { useState, useEffect, useCallback } from 'react';
import { VaultDoor } from './VaultDoor';

export function VaultOverlay() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [skipToEnd, setSkipToEnd] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      sessionStorage.setItem('vault-intro-played', 'true');
      return;
    }

    // Check if already played this session
    const hasPlayed = sessionStorage.getItem('vault-intro-played');
    if (hasPlayed) return;

    setShouldShow(true);

    // Show skip button after 1 second
    const skipTimer = setTimeout(() => setShowSkipButton(true), 1000);
    return () => clearTimeout(skipTimer);
  }, []);

  const handleComplete = useCallback(() => {
    setIsFadingOut(true);
    sessionStorage.setItem('vault-intro-played', 'true');

    // Remove from DOM after fade-out animation
    setTimeout(() => setIsRemoved(true), 800);
  }, []);

  const handleSkip = useCallback(() => {
    setSkipToEnd(true);
    // Small delay to let the skip register, then fade out
    setTimeout(() => handleComplete(), 100);
  }, [handleComplete]);

  if (!shouldShow || isRemoved) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      style={{
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 800ms ease-out',
      }}
    >
      <VaultDoor onComplete={handleComplete} skipToEnd={skipToEnd} />

      {/* Skip button */}
      {showSkipButton && !isFadingOut && (
        <button
          onClick={handleSkip}
          className="absolute bottom-8 right-8 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors duration-200 tracking-wider uppercase"
          style={{
            animation: 'fadeIn 500ms ease-out',
          }}
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
