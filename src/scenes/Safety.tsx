import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { FadeUp } from '../components/FadeUp';
import { VoiceLine } from '../components/VoiceLine';
import { Subtitles } from '../components/Subtitles';
import { COLORS, FONT } from '../theme';

const POINTS = [
  { title: '内存暂存', body: '所有修改先放在内存里，随时“放弃修改”' },
  { title: '另存为新文件', body: '生成 Squads + 时间戳，原存档永远不动' },
  { title: '保存后自动校验', body: '重新读取写入结果，确认真的改对了' },
];

export const Safety: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bar = spring({ frame: frame - 14, fps, config: { damping: 200, mass: 0.9 } });

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: COLORS.text }}>
      <Background drift={2} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <FadeUp delay={2}>
          <div
            style={{
              color: COLORS.accent,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 5,
              textAlign: 'center',
              marginBottom: 26,
            }}
          >
            SAFE BY DEFAULT
          </div>
        </FadeUp>

        <FadeUp delay={8}>
          <div style={{ fontSize: 82, fontWeight: 800, letterSpacing: 2, textAlign: 'center' }}>
            先暂存，再另存
          </div>
        </FadeUp>

        <FadeUp delay={18}>
          <div
            style={{
              fontSize: 34,
              color: COLORS.muted,
              textAlign: 'center',
              marginTop: 18,
              letterSpacing: 0.5,
            }}
          >
            原存档永远不会被覆盖
          </div>
        </FadeUp>

        <div
          style={{
            marginTop: 20,
            height: 4,
            width: 220 * bar,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`,
          }}
        />

        <div style={{ display: 'flex', gap: 26, marginTop: 64 }}>
          {POINTS.map((point, index) => (
            <FadeUp key={point.title} delay={34 + index * 12} y={26}>
              <div
                style={{
                  width: 430,
                  padding: '30px 32px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700 }}>{point.title}</div>
                <div style={{ fontSize: 22, color: COLORS.muted, marginTop: 12, lineHeight: 1.5 }}>
                  {point.body}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </AbsoluteFill>
      <VoiceLine name="safety" />
      <Subtitles name="safety" hideBefore={6} hideAfter={10} />
    </AbsoluteFill>
  );
};
