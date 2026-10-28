import React from 'react';
import { AbsoluteFill} from 'remotion';
import { COLORS } from '../theme';

/** Layered dark-green backdrop with a slow drifting glow and a faint grid. */
export const Background: React.FC<{ drift?: number }> = ({ drift = 0 }) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1300px 780px at ${72 + drift * 0.3}% ${18 + drift}%, ${COLORS.bg2} 0%, ${COLORS.bg1} 48%, ${COLORS.bg0} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(65% 62% at 50% 46%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(65% 62% at 50% 46%, black 20%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -300,
          top: 500,
          width: 980,
          height: 980,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(61,220,132,0.20), transparent 62%)',
          filter: 'blur(28px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -240,
          top: -220,
          width: 760,
          height: 760,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,197,66,0.13), transparent 62%)',
          filter: 'blur(28px)',
        }}
      />
    </AbsoluteFill>
  );
};
