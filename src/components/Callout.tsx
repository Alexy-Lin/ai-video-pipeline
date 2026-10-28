import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT } from '../theme';

export type CalloutDef = {
  /** Position inside the screenshot, 0..1. */
  x: number;
  y: number;
  label: string;
  sub?: string;
  delay?: number;
  /** Frame at which the callout starts fading out. Omit to keep it on screen. */
  until?: number;
};

/** A focus ring plus a label card, anchored over the screenshot. */
export const Callout: React.FC<CalloutDef> = ({ x, y, label, sub, delay = 0, until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < delay) return null;

  const p = spring({ frame: frame - delay, fps, config: { damping: 170, mass: 0.6, stiffness: 140 } });
  const exit =
    until === undefined
      ? 0
      : spring({ frame: frame - until, fps, config: { damping: 200, mass: 0.6 } });
  const opacity = p * (1 - exit);
  if (opacity < 0.01) return null;
  const toLeft = x > 0.62;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: toLeft ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 14,
        opacity,
        fontFamily: FONT,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: `3px solid ${COLORS.accent}`,
          background: 'rgba(61,220,132,0.16)',
          boxShadow: `0 0 0 8px rgba(61,220,132,0.12), 0 0 26px rgba(61,220,132,0.55)`,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          padding: '11px 18px',
          borderRadius: 12,
          background: 'rgba(4,14,10,0.90)',
          border: '1px solid rgba(61,220,132,0.45)',
          boxShadow: '0 14px 40px rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ color: COLORS.text, fontSize: 26, fontWeight: 700, letterSpacing: 0.3 }}>
          {label}
        </div>
        {sub ? (
          <div style={{ color: COLORS.accent, fontSize: 18, marginTop: 3, fontWeight: 600 }}>
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
};
