'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface VaultZoomWrapperProps {
  children: ReactNode;
}

export function VaultZoomWrapper({ children }: VaultZoomWrapperProps) {
  const [scale, setScale] = useState(0.35);
  const [opacity, setOpacity] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Check if vault already played — skip zoom if so
    const hasPlayed = sessionStorage.getItem('vault-intro-played');
    if (hasPlayed) {
      setScale(1);
      setOpacity(1);
      setIsComplete(true);
      return;
    }

    // Listen for vault progress updates via custom event
    const handler = (e: CustomEvent) => {
      const progress = e.detail as number;

      // Cards start becoming visible as door opens (progress 0.45+)
      // and zoom to full size by end of animation
      if (progress > 0.4) {
        const zoomProgress = Math.min((progress - 0.4) / 0.55, 1);
        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - zoomProgress, 3);
        setScale(0.35 + eased * 0.65);
        setOpacity(Math.min(zoomProgress * 2, 1));
      }

      if (progress >= 1) {
        // Ensure we land exactly at scale 1
        setScale(1);
        setOpacity(1);
        setTimeout(() => setIsComplete(true), 100);
      }
    };

    window.addEventListener('vault-progress', handler as EventListener);
    return () => window.removeEventListener('vault-progress', handler as EventListener);
  }, []);

  return (
    <div
      style={isComplete ? undefined : {
        transform: `scale(${scale})`,
        opacity,
        transformOrigin: 'center 40%',
        transition: scale === 1 ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
}
