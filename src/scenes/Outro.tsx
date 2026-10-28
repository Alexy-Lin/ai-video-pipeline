import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { FadeUp } from '../components/FadeUp';
import { VoiceLine } from '../components/VoiceLine';
import { Subtitles } from '../components/Subtitles';
import { COLORS, FONT } from '../theme';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badge = spring({ frame: frame - 6, fps, config: { damping: 120, mass: 0.7 } });
  const shimmer = interpolate(frame, [0, 120], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Background drift={3} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 26 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            opacity: badge,
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(160deg, #1b3026, #0a1712)',
              border: '1px solid rgba(245,197,66,0.55)',
              color: COLORS.gold,
              fontSize: 46,
              fontWeight: 800,
            }}
          >
            27
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, color: COLORS.text, letterSpacing: 2 }}>
            FC27 存档编辑器
          </div>
        </div>

        <FadeUp delay={20} y={20}>
          <div
            style={{
              marginTop: 10,
              padding: '18px 34px',
              borderRadius: 14,
              background: 'rgba(0,0,0,0.45)',
              border: `1px solid rgba(61,220,132,${0.25 + shimmer * 0.35})`,
              color: '#d8ffe9',
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            python web_app.py → http://127.0.0.1:8765
          </div>
        </FadeUp>

        <FadeUp delay={34} y={18}>
          <div style={{ fontSize: 24, color: COLORS.muted, letterSpacing: 2 }}>
            本地运行 · 不联网 · Apache-2.0 开源
          </div>
        </FadeUp>
      </AbsoluteFill>
      <VoiceLine name="outro" />
      <Subtitles name="outro" hideBefore={6} hideAfter={10} />
    </AbsoluteFill>
  );
};
