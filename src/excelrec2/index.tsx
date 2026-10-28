import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  OffthreadVideo,
  registerRoot,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const VW = 1920;
const VH = 1080;
const FPS = 30;
const DUR = 470; // 15.67s
const SCALE = 0.96; // 2000x1150 -> 1920x1104
const TOP = -12;
const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const OUTLINE =
  "0 0 10px rgba(0,0,0,.95), 3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000";

const CURSOR: { t: number; x: number; y: number }[] = [
  { t: 0, x: 1900, y: 1090 },
  { t: 0.9, x: 1900, y: 1090 },
  { t: 1.6, x: 150, y: 340 },
  { t: 2.6, x: 150, y: 340 },
  { t: 3.41, x: 430, y: 620 },
  { t: 4.1, x: 430, y: 620 },
  { t: 5.01, x: 1500, y: 430 },
  { t: 6.6, x: 1500, y: 430 },
  { t: 7.21, x: 1612, y: 300 },
  { t: 9.7, x: 1612, y: 300 },
  { t: 10.41, x: 298, y: 427 },
  { t: 10.62, x: 298, y: 427 },
  { t: 11.05, x: 1420, y: 943 },
  { t: 12.85, x: 1420, y: 943 },
  { t: 13.61, x: 168, y: 80 },
  { t: 14.3, x: 168, y: 80 },
  { t: 15.05, x: 1040, y: 160 },
  { t: 16, x: 1040, y: 160 },
];

// 点击/结束涟漪
const RIPPLE = [
  { t: 11.07, x: 1420, y: 943 },
  { t: 13.69, x: 168, y: 80 },
];

const HIGHLIGHT = [
  { from: 4.3, to: 9.7, x: 1519, y: 275, w: 187, h: 719 },
  { from: 14.5, to: 15.9, x: 950, y: 101, w: 180, h: 121 },
];
const SUBS = [
  { from: 0.0, to: 4.06, text: "想在表格里插入图表，又嫌它太占地方？" },
  { from: 4.06, to: 9.48, text: "Excel 里其实有更简单方便的做法，叫迷你图。" },
  { from: 9.93, to: 14.51, text: "首先选中要作图的数据，然后点「插入」。" },
];

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const cursorAt = (s: number) => {
  let i = 0;
  while (i < CURSOR.length - 2 && CURSOR[i + 1].t <= s) i++;
  const a = CURSOR[i];
  const b = CURSOR[i + 1];
  const span = Math.max(0.001, b.t - a.t);
  const k = easeInOut(Math.min(1, Math.max(0, (s - a.t) / span)));
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
};

// 源码坐标 -> 画面坐标
const toScreen = (x: number, y: number) => ({ x: x * SCALE, y: y * SCALE + TOP });

const Cursor: React.FC<{ s: number }> = ({ s }) => {
  const p = cursorAt(s);
  const scr = toScreen(p.x, p.y);
  // 点击瞬间轻微收缩
  const near = RIPPLE.reduce((acc, r) => Math.min(acc, Math.abs(s - r.t)), 9);
  const press = interpolate(near, [0, 0.08, 0.22], [0.82, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: scr.x - 6,
        top: scr.y - 2,
        width: 42,
        height: 42,
        transform: `scale(${press})`,
        transformOrigin: "6px 2px",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,.45))",
        pointerEvents: "none",
      }}
    >
      <svg viewBox="0 0 28 28" width={42} height={42}>
        <path
          d="M4 2 L4 22 L9.5 16.8 L12.8 24.4 L16.4 22.8 L13.2 15.4 L20.6 15.2 Z"
          fill="#ffffff"
          stroke="#111820"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const Ripples: React.FC<{ s: number }> = ({ s }) => (
  <>
    {RIPPLE.map((r, i) => {
      const age = s - r.t;
      if (age < 0 || age > 0.7) return null;
      const k = age / 0.7;
      const scr = toScreen(r.x, r.y);
      return (
        <div key={i} style={{ position: "absolute", left: scr.x, top: scr.y, pointerEvents: "none" }}>
          {[0, 0.18].map((d) => {
            const kk = Math.max(0, (age - d) / 0.7);
            if (kk <= 0 || kk >= 1) return null;
            const size = 18 + kk * 86;
            return (
              <div
                key={d}
                style={{
                  position: "absolute",
                  left: -size / 2,
                  top: -size / 2,
                  width: size,
                  height: size,
                  borderRadius: size,
                  border: "3px solid #FFD400",
                  opacity: 1 - kk,
                }}
              />
            );
          })}
        </div>
      );
    })}
  </>
);

const Ep: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const sub = SUBS.find((x) => s >= x.from && s < x.to);
  const fade = interpolate(s, [15.1, 15.65], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Audio src={staticFile("b1920v2/voice.wav")} />
      <OffthreadVideo
        src={staticFile("rec3/seg-a.mp4")}
        style={{ position: "absolute", left: 0, top: TOP, width: 2000 * SCALE, height: 1150 * SCALE }}
      />

      {HIGHLIGHT.map((h, i) => {
        if (s < h.from || s > h.to) return null;
        const a = toScreen(h.x, h.y);
        const op = interpolate(s, [h.from, h.from + 0.25], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: a.x,
              top: a.y,
              width: h.w * SCALE,
              height: h.h * SCALE,
              border: "3px solid #FFD400",
              borderRadius: 8,
              boxShadow: "0 0 0 3px rgba(0,0,0,.4), 0 0 24px rgba(255,212,0,.5)",
              opacity: op,
            }}
          />
        );
      })}

      <Ripples s={s} />
      <Cursor s={s} />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          background: "linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,0))",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 54 }}>
        {sub ? (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 46,
              fontWeight: 900,
              color: "#FFD400",
              textShadow: OUTLINE,
              textAlign: "center",
              maxWidth: 1700,
              lineHeight: 1.34,
              letterSpacing: 1,
            }}
          >
            {sub.text}
          </div>
        ) : null}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "#000", opacity: 1 - fade }} />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Ep03RecA" component={Ep} durationInFrames={DUR} fps={FPS} width={VW} height={VH} />
);

registerRoot(Root);
