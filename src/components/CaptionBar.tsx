import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT } from '../theme';

type Props = {
  eyebrow: string;
  text: string;
  delay?: number;
};

/** Bottom caption: section tag on the left, one-line description next to it. */
export const CaptionBar: React.FC<Props> = ({ eyebrow, text, delay = 6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 12,
        display: 'flex',
        justifyContent: 'center',
        fontFamily: FONT,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '9px 20px',
          borderRadius: 12,
          background: 'rgba(4,14,10,0.62)',
          border: '1px solid rgba(255,255,255,0.09)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          style={{
            color: COLORS.bg0,
            background: COLORS.accent,
            fontSize: 16,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 7,
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {eyebrow}
        </span>
        <span style={{ color: COLORS.text, fontSize: 24, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {text}
        </span>
      </div>
    </div>
  );
};
