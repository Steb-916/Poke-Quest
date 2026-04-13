'use client';

import { useState, useCallback, useRef, type RefObject, type CSSProperties } from 'react';

interface CardTiltReturn {
  tiltStyle: CSSProperties;
  shimmerStyle: CSSProperties;
  isHovering: boolean;
  handlers: {
    onMouseEnter: () => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
  };
}

const MAX_TILT = 8;
const SCALE_HOVER = 1.04;
const TRANSITION_IN = 'transform 0.15s ease-out';
const TRANSITION_OUT = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';

export function useCardTilt(cardRef: RefObject<HTMLDivElement | null>): CardTiltReturn {
  const [isHovering, setIsHovering] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [mouseXPercent, setMouseXPercent] = useState(50);
  const [mouseYPercent, setMouseYPercent] = useState(50);

  const rafRef = useRef<number | null>(null);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current!.getBoundingClientRect();

      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const centerX = x - 0.5;
      const centerY = y - 0.5;

      setTiltX(-centerY * MAX_TILT);
      setTiltY(centerX * MAX_TILT);

      setMouseXPercent(x * 100);
      setMouseYPercent(y * 100);
    });
  }, [cardRef]);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTiltX(0);
    setTiltY(0);
    setMouseXPercent(50);
    setMouseYPercent(50);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tiltStyle: CSSProperties = {
    transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovering ? SCALE_HOVER : 1})`,
    transition: isHovering ? TRANSITION_IN : TRANSITION_OUT,
  };

  const shimmerStyle: CSSProperties = {
    background: `radial-gradient(
      circle at ${mouseXPercent}% ${mouseYPercent}%,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(200, 170, 255, 0.08) 20%,
      rgba(100, 200, 255, 0.06) 40%,
      rgba(255, 200, 100, 0.04) 60%,
      transparent 80%
    )`,
    mixBlendMode: 'overlay' as const,
  };

  return {
    tiltStyle,
    shimmerStyle,
    isHovering,
    handlers: {
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
    },
  };
}
