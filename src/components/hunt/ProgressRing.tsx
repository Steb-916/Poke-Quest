'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface ProgressRingProps {
  acquired: number;
  total: number;
}

export function ProgressRing({ acquired, total }: ProgressRingProps) {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? acquired / total : 0;

  const motionProgress = useMotionValue(0);
  const dashOffset = useTransform(motionProgress, (v) => circumference * (1 - v));
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const controls = animate(motionProgress, progress, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayCount(Math.round(v * total)),
    });
    return controls.stop;
  }, [motionProgress, progress, total]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-bg-hover)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[var(--font-display)] text-5xl font-bold text-[var(--color-text-primary)]">
          {displayCount}
        </span>
        <span className="font-[var(--font-mono)] text-lg text-[var(--color-text-secondary)]">
          /{total}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] mt-1">
          Black Labels
        </span>
      </div>
    </div>
  );
}
