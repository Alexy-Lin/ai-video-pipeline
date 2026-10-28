import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  OffthreadVideo,
  Sequence,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from "remotion";

const VW = 1920;
const VH = 1080;
const FPS = 30;

const TRIM = 44; // 剪掉开头 1.467s 静音（人声 1.60s 才开始，留 0.13s 气口）
const OPEN_END = 249; // 0–8.30s 用动画示意
const REC_START = 293; // 录屏从 9.77s 处切入（与剪后时间轴对齐）
const DUR = 1246; // 41.53s

const SCALE = 0.96;
const TOP = -12;
const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const OUTLINE =
  "0 0 10px rgba(0,0,0,.95), 3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000";

// 剪掉开头 1.467s 后的时间轴
const SUBS = [
  { from: 0.0, to: 2.59, text: "想在表格里插入图表，又嫌它太占地方？" },
  { from: 2.59, to: 8.01, text: "Excel 里其实有更简单方便的做法，叫迷你图。" },
  { from: 8.46, to: 13.04, text: "首先选中要作图的数据，然后点「插入」。" },
  { from: 13.04, to: 20.52, text: "找到「迷你图」，选「折线」，位置填数据右边的单元格，然后确定。" },
  { from: 20.97, to: 26.04, text: "第一行出来了，往下一拖，六家店的曲线全有。" },
  { from: 26.04, to: 32.07, text: "再勾上「高点」和「低点」——最高最低自动标红标蓝。" },
  { from: 32.52, to: 35.94, text: "周末哪家店流量高，一眼就能看出来。" },
  { from: 35.94, to: 39.96, text: "每天一个小技巧，轻松变成excel达人！" },
];

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/* ---------------- 开场示意动画 ---------------- */

const COLS = ["门店", "一", "二", "三", "四", "五", "六", "日", "趋势"];
const SHEET = { x: 60, y: 150, w: 1800, h: 760 };
const CW = (SHEET.w - 40) / COLS.length;
const RH = (SHEET.h - 40) / 7;

const DATA = [
  [420, 380, 390, 410, 450, 780, 820],
  [260, 240, 250, 270, 280, 520, 560],
  [180, 170, 175, 190, 200, 360, 390],
  [150, 140, 145, 160, 170, 300, 330],
  [120, 110, 115, 130, 140, 260, 280],
  [60, 55, 58, 65, 70, 140, 150],
];

const Sheet: React.FC<{ dim: number; sparkIn: number }> = ({ dim, sparkIn }) => {
  const left = SHEET.x;
  const top = SHEET.y;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: SHEET.w,
          height: SHEET.h,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 30px 80px rgba(0,0,0,.55)",
          opacity: 1 - dim * 0.55,
        }}
      />
      {/* 表头 */}
      {COLS.map((c, i) => (
        <div
          key={c}
          style={{
            position: "absolute",
            left: left + 20 + i * CW,
            top: top + 20,
            width: CW,
            height: RH,
            background: "#1f1f1f",
            borderRight: "1px solid #3a3a3a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 34,
            color: "#fff",
            opacity: 1 - dim * 0.45,
          }}
        >
          {c}
        </div>
      ))}
      {/* 数据格 */}
      {DATA.map((row, r) =>
        row.map((v, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              position: "absolute",
              left: left + 20 + (c + 1) * CW,
              top: top + 20 + (r + 1) * RH,
              width: CW,
              height: RH,
              borderRight: "1px solid #e3e7ee",
              borderBottom: "1px solid #e3e7ee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT,
              fontSize: 30,
              color: "#2b3440",
              opacity: (1 - dim * 0.7) * (0.55 + 0.45 * Math.min(1, c / 3)),
            }}
          >
            {v}
          </div>
        ))
      )}
      {/* 门店名 */}
      {DATA.map((_, r) => (
        <div
          key={`n-${r}`}
          style={{
            position: "absolute",
            left: left + 20,
            top: top + 20 + (r + 1) * RH,
            width: CW,
            height: RH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontSize: 30,
            color: "#2b3440",
            opacity: 1 - dim * 0.7,
          }}
        >
          {["旗舰店", "东区店", "西区店", "南城店", "北苑店", "社区店"][r]}
        </div>
      ))}
      {/* 动画结尾：趋势列里那颗迷你图 */}
      {sparkIn > 0 ? <MiniSpark t={sparkIn} /> : null}
    </>
  );
};

const sparkPts = (w: number, h: number, pad = 8) => {
  const vals = DATA[0];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return vals
    .map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
};

const MiniSpark: React.FC<{ t: number }> = ({ t }) => {
  const k = easeOut(clamp01(t));
  const cellX = SHEET.x + 20 + 8 * CW;
  const cellY = SHEET.y + 20 + RH;
  const w = (CW - 12) * (0.4 + 0.6 * k);
  const h = (RH - 12) * (0.4 + 0.6 * k);
  return (
    <div
      style={{
        position: "absolute",
        left: cellX + (CW - w) / 2,
        top: cellY + (RH - h) / 2,
        width: w,
        height: h,
        opacity: k,
      }}
    >
      <svg width={w} height={h}>
        <polyline
          points={sparkPts(w, h, 6)}
          fill="none"
          stroke="#4472C4"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const BigChart: React.FC<{ shrink: number; rise: number }> = ({ shrink, rise }) => {
  const k = easeOut(clamp01(shrink));
  const r = easeOut(clamp01(rise));
  const fromW = 900;
  const fromH = 560;
  const fromX = SHEET.x + SHEET.w - fromW - 60;
  const fromY = 300;
  // 目标：缩进趋势列第一格
  const toW = CW - 16;
  const toH = RH - 16;
  const toX = SHEET.x + 20 + 8 * CW + 8;
  const toY = SHEET.y + 20 + RH + 8;
  const w = fromW + (toW - fromW) * k;
  const h = fromH + (toH - fromH) * k;
  const x = fromX + (toX - fromX) * k;
  const y = fromY + (toY - fromY) * k + (1 - r) * 460;
  const op = interpolate(k, [0, 0.86, 1], [1, 1, 0]);
  const pts = sparkPts(w, h, 24);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          background: "#fff",
          borderRadius: 14 * (1 - k) + 4,
          boxShadow: "0 34px 90px rgba(0,0,0,.6)",
          opacity: op,
          border: `${Math.max(1, 3 * (1 - k))}px solid #e6ebf3`,
        }}
      />
      <svg
        style={{ position: "absolute", left: x, top: y, opacity: op }}
        width={Math.max(1, w)}
        height={Math.max(1, h)}
      >
        <polyline points={pts} fill="none" stroke="#4472C4" strokeWidth={Math.max(2, 9 * (1 - k))} strokeLinejoin="round" />
      </svg>
      {k < 0.55 ? (
        <div
          style={{
            position: "absolute",
            left: x + 26,
            top: y + 22,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 30,
            color: "#33404f",
            opacity: (1 - k / 0.55) * 0.9,
          }}
        >
          图表
        </div>
      ) : null}
    </>
  );
};

const Tag: React.FC<{ t: number; text: string; x: number; y: number; color?: string }> = ({
  t,
  text,
  x,
  y,
  color = "#FFD400",
}) => {
  const k = easeOut(clamp01(t));
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateY(${(1 - k) * 12}px)`,
        opacity: k,
        background: color,
        color: "#101820",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 34,
        padding: "10px 22px",
        borderRadius: 10,
        boxShadow: "0 12px 30px rgba(0,0,0,.45)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

const Opening: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;

  // 句1：大图表压上来（0–2.6s）
  const chartIn = interpolate(s, [0.35, 1.5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dimA = interpolate(s, [0.6, 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const riseIn = interpolate(s, [0.3, 1.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagIn = interpolate(s, [0.9, 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 句2：图表缩成一格迷你图（2.6–6.0s）
  const shrink = interpolate(s, [2.75, 5.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sparkIn = interpolate(s, [5.3, 5.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ringIn = interpolate(s, [5.9, 6.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dimB = interpolate(s, [2.75, 3.6], [1, 0.28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - ringIn * 0.55);

  const ringX = SHEET.x + 20 + 8 * CW - 12;
  const ringY = SHEET.y + 20 + RH - 12;
  const ringW = CW + 24;
  const ringH = RH + 24;

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Sheet dim={Math.max(dimA, dimB)} sparkIn={sparkIn} />
      <BigChart shrink={shrink} rise={riseIn} />
      <Tag t={tagIn * (1 - clamp01((s - 2.8) / 0.5))} text="占掉半张表" x={SHEET.x + SHEET.w - 470} y={252} />
      {ringIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: ringX,
            top: ringY,
            width: ringW,
            height: ringH,
            border: "4px solid #FFD400",
            borderRadius: 12,
            boxShadow: "0 0 0 4px rgba(0,0,0,.45), 0 0 40px rgba(255,212,0,.7)",
            opacity: ringIn,
            transform: `scale(${0.9 + 0.1 * ringIn})`,
          }}
        />
      ) : null}
      <Tag t={ringIn} text="一个格子 = 迷你图" x={ringX - 540} y={ringY + 42} />
    </AbsoluteFill>
  );
};

/* ---------------- 成片 ---------------- */

const Ep: React.FC = () => {
  const f = useCurrentFrame();
  const s = (f + TRIM) / FPS; // 换算回原音轨时间轴，用于字幕
  const sub = SUBS.find((x) => s - TRIM / FPS >= x.from && s - TRIM / FPS < x.to);
  const fade = interpolate(f, [DUR - 16, DUR - 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badge = interpolate(s - TRIM / FPS, [35.95, 36.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Audio src={staticFile("b1920v2/voice.wav")} startFrom={TRIM} />
      <Sequence from={0} durationInFrames={OPEN_END}>
        <Opening />
      </Sequence>
      <Sequence from={OPEN_END}>
        <OffthreadVideo
          src={staticFile("rec10/full.mp4")}
          startFrom={REC_START}
          style={{ position: "absolute", left: 0, top: TOP, width: 2000 * SCALE, height: 1150 * SCALE }}
        />
      </Sequence>

      {badge > 0 ? (
        <div
          style={{
            position: "absolute",
            right: 74,
            top: 96,
            opacity: badge,
            transform: `translateY(${(1 - badge) * 16}px)`,
            background: "rgba(11,14,19,.9)",
            border: "3px solid #3DDC84",
            borderRadius: 16,
            padding: "20px 28px",
            boxShadow: "0 18px 46px rgba(0,0,0,.5)",
          }}
        >
          <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: "#3DDC84", letterSpacing: 3 }}>
            本集结论
          </div>
          <div style={{ fontFamily: FONT, fontSize: 38, fontWeight: 900, color: "#fff", marginTop: 6 }}>
            周末客流 ≈ 工作日 1.8 倍
          </div>
        </div>
      ) : null}

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
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Ep03V2" component={Ep} durationInFrames={DUR} fps={FPS} width={VW} height={VH} />
);

registerRoot(Root);
