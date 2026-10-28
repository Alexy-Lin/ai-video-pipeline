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

const TRIM = 44; // 剪掉开头 1.467s 静音
const ANIM_END = 210; // 0–7.0s 示意动画（更短、信息更密）
const REC_START = 254; // 录屏从原片 8.47s 切入
const DUR = 1246; // 41.53s

const SCALE = 0.96;
const TOP = -12;
const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const OUTLINE =
  "0 0 10px rgba(0,0,0,.95), 3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000";

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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------------- 示意表格 ---------------- */
const COLS = ["门店", "一", "二", "三", "四", "五", "六", "日", "趋势"];
const SHEET = { x: 60, y: 150, w: 1800, h: 760 };
const CW = (SHEET.w - 40) / COLS.length;
const RH = (SHEET.h - 40) / 7;
const STORES = ["旗舰店", "东区店", "西区店", "南城店", "北苑店", "社区店"];
const DATA = [
  [420, 380, 390, 410, 450, 780, 820],
  [260, 240, 250, 270, 280, 520, 560],
  [180, 170, 175, 190, 200, 360, 390],
  [150, 140, 145, 160, 170, 300, 330],
  [120, 110, 115, 130, 140, 260, 280],
  [60, 55, 58, 65, 70, 140, 150],
];

const Sheet: React.FC<{ dim: number; sparkIn: number }> = ({ dim, sparkIn }) => {
  const L = SHEET.x;
  const T = SHEET.y;
  const cellX = L + 20 + 8 * CW;
  const cellY = T + 20 + RH;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: L,
          top: T,
          width: SHEET.w,
          height: SHEET.h,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 30px 80px rgba(0,0,0,.55)",
          opacity: 1 - dim * 0.5,
        }}
      />
      {COLS.map((c, i) => (
        <div
          key={c}
          style={{
            position: "absolute",
            left: L + 20 + i * CW,
            top: T + 20,
            width: CW,
            height: RH,
            background: i === 0 || i === 8 ? "#1f1f1f" : "#242424",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 32,
            color: "#fff",
            opacity: 1 - dim * 0.4,
          }}
        >
          {c}
        </div>
      ))}
      {DATA.map((row, r) =>
        row.map((v, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              position: "absolute",
              left: L + 20 + (c + 1) * CW,
              top: T + 20 + (r + 1) * RH,
              width: CW,
              height: RH,
              borderRight: "1px solid #e6eaf1",
              borderBottom: "1px solid #e6eaf1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT,
              fontSize: 29,
              color: "#2b3440",
              opacity: 1 - dim * 0.72,
            }}
          >
            {v}
          </div>
        ))
      )}
      {STORES.map((n, r) => (
        <div
          key={n}
          style={{
            position: "absolute",
            left: L + 20,
            top: T + 20 + (r + 1) * RH,
            width: CW,
            height: RH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontSize: 28,
            color: "#2b3440",
            opacity: 1 - dim * 0.72,
          }}
        >
          {n}
        </div>
      ))}
      {sparkIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: cellX + 10,
            top: cellY + 10,
            width: CW - 20,
            height: RH - 20,
            opacity: sparkIn,
          }}
        >
          <svg width={CW - 20} height={RH - 20}>
            <polyline points={pts(DATA[0], CW - 20, RH - 20, 4, 900)} fill="none" stroke="#4472C4" strokeWidth={3} />
          </svg>
        </div>
      ) : null}
    </>
  );
};

const pts = (vals: number[], w: number, h: number, pad: number, max: number) =>
  vals
    .map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

/* ---------------- 大折线图（Excel 风格） ---------------- */
const CARD = { x: 860, y: 190, w: 980, h: 640 };
const PLOT = { x: 110, y: 120, w: CARD.w - 190, h: CARD.h - 210 };
const YMAX = 900;
const YTICKS = [0, 200, 400, 600, 800];
const XCATS = ["一", "二", "三", "四", "五", "六", "日"];
const SER1 = DATA[0];
const SER2 = DATA[5];

const xy = (i: number, v: number) => ({
  x: PLOT.x + (i / (SER1.length - 1)) * PLOT.w,
  y: PLOT.y + PLOT.h - (v / YMAX) * PLOT.h,
});

const pathOf = (vals: number[]) =>
  vals.map((v, i) => `${i === 0 ? "M" : "L"}${xy(i, v).x},${xy(i, v).y}`).join(" ");

const Legend: React.FC<{ op: number }> = ({ op }) => (
  <div
    style={{
      position: "absolute",
      left: CARD.w - 340,
      top: 34,
      display: "flex",
      gap: 26,
      opacity: op,
      alignItems: "center",
    }}
  >
    {[
      { c: "#4472C4", t: "旗舰店" },
      { c: "#ED7D31", t: "社区店" },
    ].map((s) => (
      <div key={s.t} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 20, color: "#54606e" }}>
        <div style={{ width: 26, height: 4, background: s.c, borderRadius: 2 }} />
        {s.t}
      </div>
    ))}
  </div>
);

const ChartCard: React.FC<{ k: number; axis: number; l1: number; l2: number; dots: number }> = ({
  k,
  axis,
  l1,
  l2,
  dots,
}) => {
  // k=0 大图，k=1 缩进单元格
  const cellX = SHEET.x + 20 + 8 * CW;
  const cellY = SHEET.y + 20 + RH;
  const x = lerp(CARD.x, cellX + 6, easeOut(k));
  const y = lerp(CARD.y, cellY + 6, easeOut(k));
  const w = lerp(CARD.w, CW - 12, easeOut(k));
  const h = lerp(CARD.h, RH - 12, easeOut(k));
  const op = interpolate(k, [0, 0.75, 1], [1, 1, 0]);
  const sc = w / CARD.w;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: "#fff",
        borderRadius: lerp(12, 3, k),
        border: "1px solid #dde3ec",
        boxShadow: "0 34px 90px rgba(0,0,0,.55)",
        opacity: op,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CARD.w,
          height: CARD.h,
          transform: `scale(${sc})`,
          transformOrigin: "0 0",
          opacity: interpolate(k, [0, 0.5], [1, 0]),
        }}
      >
        <div style={{ position: "absolute", left: 34, top: 26, fontFamily: FONT, fontSize: 26, fontWeight: 800, color: "#2b3440" }}>
          六家门店 · 一周客流
        </div>
        <Legend op={axis} />
        <svg width={CARD.w} height={CARD.h} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* 网格线 + Y 轴刻度 */}
          {YTICKS.map((v) => {
            const yy = PLOT.y + PLOT.h - (v / YMAX) * PLOT.h;
            return (
              <g key={v} opacity={axis}>
                <line x1={PLOT.x} y1={yy} x2={PLOT.x + PLOT.w} y2={yy} stroke="#dbe2ec" strokeWidth={1.5} />
                <text x={PLOT.x - 16} y={yy + 7} textAnchor="end" fontSize={18} fill="#7b8794" fontFamily={FONT}>
                  {v}
                </text>
              </g>
            );
          })}
          {/* 坐标轴 */}
          <g opacity={axis}>
            <line x1={PLOT.x} y1={PLOT.y} x2={PLOT.x} y2={PLOT.y + PLOT.h} stroke="#b9c2cf" strokeWidth={2} />
            <line x1={PLOT.x} y1={PLOT.y + PLOT.h} x2={PLOT.x + PLOT.w} y2={PLOT.y + PLOT.h} stroke="#b9c2cf" strokeWidth={2} />
            {XCATS.map((c, i) => (
              <text
                key={c}
                x={PLOT.x + (i / (XCATS.length - 1)) * PLOT.w}
                y={PLOT.y + PLOT.h + 34}
                textAnchor="middle"
                fontSize={19}
                fill="#7b8794"
                fontFamily={FONT}
              >
                {c}
              </text>
            ))}
          </g>
          {/* 折线 1（旗舰店） */}
          <path
            d={pathOf(SER1)}
            fill="none"
            stroke="#4472C4"
            strokeWidth={4.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - clamp01(l1)}
          />
          {/* 折线 2（社区店） */}
          <path
            d={pathOf(SER2)}
            fill="none"
            stroke="#ED7D31"
            strokeWidth={4.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - clamp01(l2)}
          />
          {/* 数据点 */}
          {SER1.map((v, i) => {
            const p = xy(i, v);
            return <circle key={`a${i}`} cx={p.x} cy={p.y} r={6} fill="#fff" stroke="#4472C4" strokeWidth={3} opacity={i / 6 <= dots ? 1 : 0} />;
          })}
          {SER2.map((v, i) => {
            const p = xy(i, v);
            return <circle key={`b${i}`} cx={p.x} cy={p.y} r={6} fill="#fff" stroke="#ED7D31" strokeWidth={3} opacity={i / 6 <= dots ? 1 : 0} />;
          })}
        </svg>
      </div>
    </div>
  );
};

const Tag: React.FC<{ op: number; text: string; x: number; y: number }> = ({ op, text, x, y }) => {
  if (op <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: op,
        transform: `translateY(${(1 - op) * 10}px)`,
        background: "#FFD400",
        color: "#101820",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 30,
        padding: "9px 20px",
        borderRadius: 9,
        boxShadow: "0 12px 30px rgba(0,0,0,.45)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

const Opening: React.FC = () => {
  const s = useCurrentFrame() / FPS;
  const rise = interpolate(s, [0.1, 0.55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const axis = interpolate(s, [0.25, 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const l1 = interpolate(s, [0.6, 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const l2 = interpolate(s, [1.1, 2.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dots = interpolate(s, [1.2, 2.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dimIn = interpolate(s, [1.6, 2.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bigTag = interpolate(s, [1.7, 2.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - clamp01((s - 2.9) / 0.4));
  const morph = interpolate(s, [3.0, 5.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sparkIn = interpolate(s, [4.9, 5.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ringIn = interpolate(s, [5.4, 5.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const miniTag = interpolate(s, [5.7, 6.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dimB = dimIn * (1 - sparkIn * 0.35);

  const ringX = SHEET.x + 20 + 8 * CW - 10;
  const ringY = SHEET.y + 20 + RH - 10;
  const ringW = CW + 20;
  const ringH = RH + 20;

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Sheet dim={dimB} sparkIn={sparkIn} />
      <div style={{ position: "absolute", opacity: rise, transform: `translateY(${(1 - easeOut(rise)) * 260}px)` }}>
        <ChartCard k={morph} axis={axis} l1={l1} l2={l2} dots={dots} />
      </div>
      <Tag op={bigTag} text="占掉半张表" x={CARD.x + CARD.w - 330} y={CARD.y - 66} />
      {ringIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: ringX,
            top: ringY,
            width: ringW,
            height: ringH,
            border: "4px solid #FFD400",
            borderRadius: 10,
            boxShadow: "0 0 0 4px rgba(0,0,0,.45), 0 0 38px rgba(255,212,0,.65)",
            opacity: ringIn,
            transform: `scale(${0.9 + 0.1 * ringIn})`,
          }}
        />
      ) : null}
      <Tag op={miniTag} text="一个格子 = 迷你图" x={ringX - 520} y={ringY + 40} />
    </AbsoluteFill>
  );
};

/* ---------------- 成片 ---------------- */
const Ep: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS; // 剪后时间轴
  const sub = SUBS.find((x) => t >= x.from && t < x.to);
  const fade = interpolate(f, [DUR - 16, DUR - 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badge = interpolate(t, [32.4, 33.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Audio src={staticFile("b1920v2/voice.wav")} startFrom={TRIM} />
      {/* 安静的钢琴 BGM，已按旁白做过侧链闪避（说话时压到 -35dBFS 左右） */}
      <Audio src={staticFile("b1920v2/bgm.wav")} />
      <Sequence from={0} durationInFrames={ANIM_END}>
        <Opening />
      </Sequence>
      <Sequence from={ANIM_END}>
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
            padding: "18px 26px",
            boxShadow: "0 18px 46px rgba(0,0,0,.5)",
          }}
        >
          <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: "#3DDC84", letterSpacing: 3 }}>本集结论</div>
          <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, color: "#fff", marginTop: 6 }}>
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
  <Composition id="Ep03V3" component={Ep} durationInFrames={DUR} fps={FPS} width={VW} height={VH} />
);

registerRoot(Root);
