import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

type Props = {
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/** Opacity + upward slide, driven by a spring. */
export const FadeUp: React.FC<Props> = ({ delay = 0, y = 26, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.8 } });
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * y}px)`, ...style }}>{children}</div>
  );
};
