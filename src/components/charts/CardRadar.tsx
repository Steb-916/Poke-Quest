'use client';

import { useState } from 'react';
import type { RadarScore } from '@/lib/utils/calculations';

interface CardRadarProps {
  scores?: RadarScore[];
  accentColor?: string;
}

const AXES_COUNT = 5;

export function CardRadar({ scores, accentColor: _ac }: CardRadarProps) {
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);

  if (!scores || scores.length < 2) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <svg width={200} height={200} viewBox="0 0 200 200">
          {[0.25, 0.5, 0.75, 1.0].map((level) => (
            <polygon
              key={level}
              points={Array.from({ length: AXES_COUNT }, (_, i) => {
                const angle = (Math.PI * 2 * i) / AXES_COUNT - Math.PI / 2;
                const r = level * 80;
                return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
              }).join(' ')}
              fill="none"
              stroke="var(--color-border-default)"
              strokeOpacity={0.15}
              strokeWidth={0.5}
            />
          ))}
        </svg>
        <p className="text-xs text-[var(--color-text-tertiary)] text-center">
          Not enough data to generate a card profile.<br />
          More dimensions unlock as price and sales data are collected.
        </p>
      </div>
    );
  }

  const size = 260;
  const center = size / 2;
  const maxRadius = 100;

  const getPoint = (axisIndex: number, value: number) => {
    const angle = (Math.PI * 2 * axisIndex) / scores.length - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const polygon = scores.map((s, i) => {
    const p = getPoint(i, s.value);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => (
          <polygon
            key={level}
            points={scores.map((_, i) => {
              const p = getPoint(i, level * 100);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="var(--color-border-default)"
            strokeOpacity={0.2}
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines + labels */}
        {scores.map((score, i) => {
          const end = getPoint(i, 100);
          const labelPos = getPoint(i, 118);
          const isHovered = hoveredAxis === score.axis;
          return (
            <g key={score.axis}>
              <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="var(--color-border-default)" strokeOpacity={isHovered ? 0.6 : 0.2} strokeWidth={0.5} />
              <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fill="var(--color-text-tertiary)" fontSize={9} style={{ fontFamily: 'var(--font-mono)' }} opacity={isHovered ? 1 : 0.5}>
                {score.axis}
              </text>
              <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="transparent" strokeWidth={20} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredAxis(score.axis)} onMouseLeave={() => setHoveredAxis(null)} />
            </g>
          );
        })}

        {/* Filled polygon */}
        <polygon points={polygon} fill="var(--color-accent)" fillOpacity={0.12} stroke="var(--color-accent)" strokeOpacity={0.7} strokeWidth={1.5} />

        {/* Data dots */}
        {scores.map((score, i) => {
          const p = getPoint(i, score.value);
          return <circle key={score.axis} cx={p.x} cy={p.y} r={3} fill="var(--color-accent)" stroke="var(--color-bg-primary)" strokeWidth={1.5} />;
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredAxis && (
        <div className="text-center">
          <span className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
            {scores.find((s) => s.axis === hoveredAxis)?.axis}: {scores.find((s) => s.axis === hoveredAxis)?.value}/100
          </span>
          <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)] ml-2">
            ({scores.find((s) => s.axis === hoveredAxis)?.rawValue})
          </span>
        </div>
      )}
    </div>
  );
}
