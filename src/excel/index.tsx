import {Composition, registerRoot, AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, spring} from "remotion";
import React from "react";

const FPS = 30;
const W = 1080;
const H = 1920;
const SCALE = 1080 / 1745;

type Crop = { x: number; y: number; w: number; h: number };
const CROP_UI: Crop = { x: 0, y: 52, w: 1745, h: 960 };
const CROP_TABLE: Crop = { x: 0, y: 258, w: 1745, h: 752 };

const Clip: React.FC<{ src: string; fromMs: number; toMs: number; crop: Crop; rate?: number }> = ({ src, fromMs, toMs, crop, rate = 1 }) => (
  <AbsoluteFill style={{ overflow: "hidden", background: "#fff" }}>
    <OffthreadVideo
      src={staticFile(src)}
      startFrom={Math.round((fromMs / 1000) * FPS)}
      endAt={Math.round((toMs / 1000) * FPS)}
      playbackRate={rate}
      style={{ position: "absolute", width: 2000 * SCALE, height: 1150 * SCALE, left: -crop.x * SCALE, top: -crop.y * SCALE }}
    />
  </AbsoluteFill>
);

const CARD_TOP = 400;
const CARD_SLOT = 600;

type Phase = { from: number; to: number; src: string; a: number; b: number; crop: Crop; rate?: number };
const PHASES: Phase[] = [
  { from: 0, to: 104, src: "excel/clip-hero.mp4", a: 1200, b: 4600, crop: CROP_TABLE },
  { from: 104, to: 520, src: "excel/clip-ui.mp4", a: 1200, b: 18500, crop: CROP_UI, rate: 1.22 },
  { from: 520, to: 660, src: "excel/clip-hero.mp4", a: 4600, b: 8000, crop: CROP_TABLE },
];

const SUB = "0 0 14px rgba(0,0,0,0.95), 4px 4px 0 #000, -4px 4px 0 #000, 4px -4px 0 #000, -4px -4px 0 #000";

const Subtitle: React.FC<{ text: string; accent?: string[] }> = ({ text, accent = [] }) => (
  <div style={{ fontFamily: "Microsoft YaHei, sans-serif", fontWeight: 900, fontSize: 62, lineHeight: 1.4, textAlign: "center", textShadow: SUB, padding: "0 54px" }}>
    {text.split(/(\s+|，|。|？|！|——)/).map((p, i) => (
      <span key={i} style={{ color: accent.includes(p.trim()) ? "#FF7A1A" : "#FFD400" }}>{p}</span>
    ))}
  </div>
);

type Beat = { from: number; to: number; text: string; accent?: string[]; step: number };
const BEATS: Beat[] = [
  { from: 0, to: 104, text: "一周客流，压进一个格子", accent: ["一个格子"], step: 0 },
  { from: 104, to: 152, text: "还在插折线图，占半个屏幕？", accent: ["半个屏幕"], step: 0 },
  { from: 152, to: 200, text: "选中 7 天，点「插入」", accent: ["插入"], step: 1 },
  { from: 200, to: 262, text: "找到「迷你图」，选「折线」", accent: ["迷你图", "折线"], step: 1 },
  { from: 262, to: 312, text: "位置填 I2，点确定", accent: ["I2"], step: 1 },
  { from: 312, to: 372, text: "第一行趋势出来了", accent: ["趋势"], step: 2 },
  { from: 372, to: 432, text: "往下拖，六家店全出来", accent: ["六家店"], step: 2 },
  { from: 432, to: 478, text: "勾「高点」，最高点自动标红", accent: ["高点"], step: 3 },
  { from: 478, to: 520, text: "再勾「低点」，最低点标蓝", accent: ["低点"], step: 3 },
  { from: 520, to: 600, text: "周末客流 ≈ 工作日 1.8 倍", accent: ["1.8 倍"], step: 0 },
  { from: 600, to: 660, text: "关注我，每天一个表格技巧", accent: ["表格技巧"], step: 0 },
];

const STEPS = ["插入迷你图", "下拉填充", "标记高低点"];
const STEPS_Y = CARD_TOP + CARD_SLOT + 46;

const Ep03: React.FC = () => {
  const frame = useCurrentFrame();
  const beat = BEATS.find((b) => frame >= b.from && frame < b.to);
  const phase = PHASES.find((p) => frame >= p.from && frame < p.to) ?? PHASES[PHASES.length - 1];

  const ts = spring({ frame, fps: FPS, config: { damping: 200 } });
  const titleY = interpolate(ts, [0, 1], [36, 0]);
  const cardIn = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const cardW = W;
  const cardH = phase.crop.h * SCALE;
  const cardTop = CARD_TOP + (CARD_SLOT - cardH) / 2;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(1200px 1000px at 50% -10%, #182436 0%, #0b0e13 55%, #06080b 100%)" }}>
      <div style={{ position: "absolute", top: 84, width: W, textAlign: "center", opacity: ts, transform: `translateY(${titleY}px)` }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 28, fontWeight: 700, color: "#3DC7FF", letterSpacing: 8 }}>EP03 · 迷你图</div>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 80, fontWeight: 900, color: "#FFFFFF", marginTop: 16 }}>一个格子 看清一周</div>
        <div style={{ width: 132, height: 6, background: "#FFD400", margin: "24px auto 0", borderRadius: 4 }} />
      </div>

      <div style={{ position: "absolute", top: cardTop, width: cardW, height: cardH, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.65)", opacity: cardIn }}>
        <Clip src={phase.src} fromMs={phase.a} toMs={phase.b} crop={phase.crop} rate={phase.rate} />
      </div>

      <div style={{ position: "absolute", top: STEPS_Y, width: W, display: "flex", justifyContent: "center", gap: 18 }}>
        {STEPS.map((s, i) => {
          const active = beat?.step === i + 1;
          const done = (beat?.step ?? 0) > i + 1;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 18px", borderRadius: 12, background: active ? "#FFD400" : "#161c25", border: `2px solid ${active ? "#FFD400" : done ? "#2b6e4d" : "#232c38"}` }}>
              <span style={{ fontFamily: "Microsoft YaHei", fontSize: 23, fontWeight: 900, color: active ? "#0b0e13" : done ? "#3DDC84" : "#5d6a7a" }}>{done ? "✓" : i + 1}</span>
              <span style={{ fontFamily: "Microsoft YaHei", fontSize: 23, fontWeight: 700, color: active ? "#0b0e13" : "#8b98a9" }}>{s}</span>
            </div>
          );
        })}
      </div>

      {frame >= 520 && frame < 600 && (
        <div style={{ position: "absolute", top: STEPS_Y + 92, width: W, textAlign: "center" }}>
          <span style={{ fontFamily: "Microsoft YaHei", fontSize: 38, fontWeight: 800, color: "#0b0e13", background: "#3DDC84", padding: "14px 32px", borderRadius: 14 }}>周末客流 ≈ 工作日 1.8 倍</span>
        </div>
      )}

      <div style={{ position: "absolute", bottom: 290, width: W, display: "flex", justifyContent: "center" }}>
        {beat ? <Subtitle text={beat.text} accent={beat.accent} /> : null}
      </div>

      <div style={{ position: "absolute", bottom: 180, width: W, textAlign: "center", fontFamily: "Microsoft YaHei", fontSize: 23, color: "#4d5866", letterSpacing: 3 }}>
        EXCEL MINI CHART · 竖屏版
      </div>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Ep03" component={Ep03} durationInFrames={660} fps={FPS} width={W} height={H} />
);

registerRoot(Root);
export { Ep03 };
