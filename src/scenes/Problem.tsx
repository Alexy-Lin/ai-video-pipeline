import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Background } from '../components/Background';
import { FadeUp } from '../components/FadeUp';
import { VoiceLine } from '../components/VoiceLine';
import { Subtitles } from '../components/Subtitles';
import { COLORS, FONT } from '../theme';

const ITEMS = [
  { n: '01', title: '球员能力只能一个个改', body: '总评、潜力、惯用脚、花式，来回点菜单' },
  { n: '02', title: '批量操作基本做不了', body: '阵容号码、国家队名单、全员年龄' },
  { n: '03', title: '改坏就没得救', body: '一次误操作就可能覆盖掉原存档' },
];

export const Problem: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: COLORS.text }}>
      <Background drift={1} />

      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 160, paddingRight: 160 }}>
        <FadeUp delay={2}>
          <div
            style={{
              color: COLORS.accent,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 5,
              marginBottom: 18,
            }}
          >
            THE PROBLEM
          </div>
        </FadeUp>

        <FadeUp delay={8}>
          <div style={{ fontSize: 66, fontWeight: 800, letterSpacing: 1.5, lineHeight: 1.25 }}>
            想改存档，只能一个个手点
          </div>
        </FadeUp>

        <div style={{ marginTop: 62, display: 'flex', flexDirection: 'column', gap: 26 }}>
          {ITEMS.map((item, index) => (
            <FadeUp key={item.n} delay={26 + index * 14} y={22}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 28,
                  padding: '22px 30px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  width: 1240,
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: COLORS.gold,
                    opacity: 0.9,
                    width: 58,
                  }}
                >
                  {item.n}
                </div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ fontSize: 23, color: COLORS.muted, marginTop: 6 }}>{item.body}</div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </AbsoluteFill>
      <VoiceLine name="problem" />
      <Subtitles name="problem" hideBefore={6} hideAfter={10} />
    </AbsoluteFill>
  );
};
