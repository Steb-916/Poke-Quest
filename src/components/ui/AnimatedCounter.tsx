'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  separateDecimals?: boolean;
  decimalClassName?: string;
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration,
  className,
  separateDecimals = false,
  decimalClassName,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    if (!isInView) return;

    const startValue = prevValueRef.current;
    const endValue = value;
    const diff = Math.abs(endValue - startValue);

    if (diff === 0) return;

    const autoDuration = Math.min(1200, Math.max(400, diff * 0.5));
    const totalDuration = duration ?? autoDuration;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    }

    requestAnimationFrame(animate);
  }, [value, isInView, duration]);

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (separateDecimals && decimals > 0) {
    const [whole, decimal] = formatted.split('.');
    return (
      <span ref={ref} className={className}>
        {prefix}{whole}
        <span className={decimalClassName}>.{decimal}</span>
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
