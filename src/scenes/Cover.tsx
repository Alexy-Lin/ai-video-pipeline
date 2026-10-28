import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background';
import { COLORS, FONT } from '../theme';

type Layout = '16x9' | '4x3';

const CHIPS = ['Web 界面', '命令行', 'Excel 导出', 'Apache-2.0'];

const Title: React.FC<{ size: number; align: 'left' | 'center' }> = ({ size, align }) => (
  <div style={{ textAlign: align, fontFamily: FONT }}>
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <div
        style={{
          width: size * 0.62,
          height: size * 0.62,
          borderRadius: size * 0.16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #1b3026, #0a1712)',
          border: '1px solid rgba(245,197,66,0.55)',
          boxShadow: '0 0 60px rgba(245,197,66,0.28)',
          color: COLORS.gold,
          fontSize: size * 0.34,
          fontWeight: 800,
        }}
      >
        27
      </div>
      <div style={{ fontSize: size, fontWeight: 800, color: COLORS.text, letterSpacing: 2 }}>
        FC27 存档编辑器
      </div>
    </div>
    <div
      style={{
        fontSize: size * 0.36,
        color: COLORS.muted,
        marginTop: size * 0.22,
        letterSpacing: 1,
      }}
    >
      EA SPORTS FC 27 Squads 存档编辑器
    </div>
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginTop: size * 0.3,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {CHIPS.map((chip) => (
        <div
          key={chip}
          style={{
            padding: `${size * 0.07}px ${size * 0.18}px`,
            borderRadius: 999,
            border: '1px solid rgba(61,220,132,0.35)',
            background: 'rgba(61,220,132,0.08)',
            color: '#bfe9d2',
            fontSize: size * 0.2,
            fontWeight: 600,
          }}
        >
          {chip}
        </div>
      ))}
    </div>
  </div>
);

/** Video thumbnail. 16:9 puts the UI on the right, 4:3 stacks it under the title. */
export const Cover: React.FC<{ layout: Layout }> = ({ layout }) => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [0, 60], [0.2, 0.5], { extrapolateRight: 'clamp' });
  const wide = layout === '16x9';

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Background />

      {wide ? (
        <AbsoluteFill style={{ flexDirection: 'row' }}>
          <div
            style={{
              width: '44%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              paddingLeft: 86,
              paddingRight: 10,
            }}
          >
            <Title size={68} align="left" />
            <div
              style={{
                marginTop: 54,
                fontSize: 26,
                color: 'rgba(191,233,210,0.75)',
                letterSpacing: 3,
              }}
            >
              本地运行 · 不联网 · 开源
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: 1040,
                marginRight: 40,
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: `0 40px 110px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1), 0 0 ${90 * glow}px rgba(61,220,132,0.25)`,
              }}
            >
              <Img src={staticFile('shots/02-player.png')} style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ flexDirection: 'column', alignItems: 'center', paddingTop: 66 }}>
          <Title size={70} align="center" />
          <div
            style={{
              marginTop: 40,
              width: 1320,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: `0 36px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1), 0 0 ${80 * glow}px rgba(61,220,132,0.22)`,
            }}
          >
            <Img src={staticFile('shots/02-player.png')} style={{ width: '100%', display: 'block' }} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
