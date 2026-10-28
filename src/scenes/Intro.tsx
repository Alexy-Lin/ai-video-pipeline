import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { FadeUp } from '../components/FadeUp';
import { VoiceLine } from '../components/VoiceLine';
import { Subtitles } from '../components/Subtitles';
import { COLORS, FONT } from '../theme';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badge = spring({ frame, fps, config: { damping: 13, mass: 0.9, stiffness: 90 } });
  const glow = interpolate(frame, [0, 90], [0.25, 0.55], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Background drift={0} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 30 }}>
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(160deg, #1b3026, #0a1712)',
            border: '1px solid rgba(245,197,66,0.55)',
            boxShadow: `0 0 70px rgba(245,197,66,${glow}), inset 0 0 26px rgba(245,197,66,0.12)`,
            color: COLORS.gold,
            fontSize: 64,
            fontWeight: 800,
            opacity: badge,
          }}
        >
          27
        </div>

        <FadeUp delay={10} y={34}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: COLORS.text,
              letterSpacing: 3,
              lineHeight: 1.1,
            }}
          >
            FC27 存档编辑器
          </div>
        </FadeUp>

        <FadeUp delay={22} y={26}>
          <div style={{ fontSize: 34, color: COLORS.muted, letterSpacing: 1.2 }}>
            EA SPORTS FC 27 Squads 存档编辑器
          </div>
        </FadeUp>

        <FadeUp delay={38} y={22} style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {['Web 界面', '命令行', 'Excel 导出', 'Apache-2.0'].map((chip) => (
              <div
                key={chip}
                style={{
                  padding: '9px 20px',
                  borderRadius: 999,
                  border: '1px solid rgba(61,220,132,0.35)',
                  background: 'rgba(61,220,132,0.08)',
                  color: '#bfe9d2',
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </FadeUp>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 66,
          textAlign: 'center',
          color: 'rgba(157,179,168,0.65)',
          fontSize: 20,
          letterSpacing: 4,
        }}
      >
        SQUADS · PLAYER · TRANSFER · NATIONAL TEAM
      </div>
      <VoiceLine name="intro" />
      <Subtitles name="intro" hideBefore={6} hideAfter={10} />
    </AbsoluteFill>
  );
};
