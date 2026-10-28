import React from 'react';
import { COLORS, FONT, FRAME_BAR_HEIGHT, FRAME_WIDTH } from '../theme';

type Props = {
  url: string;
  children: React.ReactNode;
  height: number;
};

/** A browser window shell so the screenshots read as "the app", not loose images. */
export const BrowserFrame: React.FC<Props> = ({ url, children, height }) => {
  return (
    <div
      style={{
        width: FRAME_WIDTH,
        borderRadius: 20,
        overflow: 'hidden',
        background: COLORS.frame,
        boxShadow:
          '0 48px 140px rgba(0,0,0,0.62), 0 6px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.10)',
      }}
    >
      <div
        style={{
          height: FRAME_BAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 18px',
          background: `linear-gradient(${COLORS.frameBar}, #101a16)`,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          fontFamily: FONT,
        }}
      >
        {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
          <div
            key={color}
            style={{ width: 13, height: 13, borderRadius: '50%', background: color, opacity: 0.85 }}
          />
        ))}
        <div
          style={{
            marginLeft: 14,
            flex: 1,
            height: 27,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            color: COLORS.muted,
            fontSize: 14,
            letterSpacing: 0.2,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: 'relative', height, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};
