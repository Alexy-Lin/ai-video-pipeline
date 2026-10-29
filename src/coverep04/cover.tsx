import React from "react";
import { AbsoluteFill, Composition, registerRoot } from "remotion";

const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const INK = "#0F1A26";
const GREEN = "#1D6F42";
const WARM = "#E2670E"; // orange pulled darker so it holds up on white
const MUTED = "#63748A";

// ---- same numbers / geometry as the EP04 intro (src/excelrec5/Intro.tsx) ----
const HIST = [128, 121, 130, 136, 145, 168, 175, 160, 138, 133, 139, 166,
  141, 134, 143, 150, 159, 185, 192, 176, 152, 147, 153, 183];
const FORE = [171.05, 172.63, 174.2, 175.78, 177.36, 178.94];
const LOW = [137.51, 138.92, 140.33, 141.73, 143.13, 144.53];
const UP = [204.58, 206.33, 208.08, 209.83, 211.59, 213.35];

const L = 250;
const T = 300;
const W = 1420;
const H = 520;
const N = HIST.length + FORE.length;
const px = (i: number) => L + (i / (N - 1)) * W;
const py = (v: number) => T + H - (v / 250) * H;

const BLUE = "#3F6FC0";
const ORANGE = "#ED7D31";

const histPath = HIST.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ");
const forePath = [HIST[HIST.length - 1], ...FORE]
  .map((v, k) => `${k === 0 ? "M" : "L"} ${px(HIST.length - 1 + k)} ${py(v)}`)
  .join(" ");
const lowPath = [HIST[HIST.length - 1], ...LOW]
  .map((v, k) => `${k === 0 ? "M" : "L"} ${px(HIST.length - 1 + k)} ${py(v)}`)
  .join(" ");
const upPath = [HIST[HIST.length - 1], ...UP]
  .map((v, k) => `${k === 0 ? "M" : "L"} ${px(HIST.length - 1 + k)} ${py(v)}`)
  .join(" ");
const bandPts = [
  ...LOW.map((v, k) => `${px(HIST.length + k)} ${py(v)}`).reverse(),
  ...UP.map((v, k) => `${px(HIST.length + k)} ${py(v)}`),
  `${px(HIST.length - 1)} ${py(HIST[HIST.length - 1])}`,
].join(" ");

const tickLabel = (i: number) => {
  if (i <= 23) {
    const y = 2023 + Math.floor(i / 12);
    const m = (i % 12) + 1;
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  const k = i - 24;
  return `2025-${String(k + 1).padStart(2, "0")}`;
};

// the finished chart from the video intro, re-tinted for a light cover
const Chart: React.FC = () => (
  <svg viewBox="186 250 1534 672" style={{ width: "100%", display: "block" }}>
    <defs>
      <filter id="glowCover" x="-30%" y="-60%" width="160%" height="220%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>
    {[0, 50, 100, 150, 200, 250].map((v) => (
      <g key={v}>
        <line x1={L} y1={py(v)} x2={L + W} y2={py(v)} stroke="#E7ECF2" strokeWidth={2} />
        <text x={L - 24} y={py(v) + 8} fill="#8C99A8" fontFamily={FONT} fontSize={22} textAnchor="end">
          {v}
        </text>
      </g>
    ))}
    <line x1={L} y1={T} x2={L} y2={T + H} stroke="#C5CFDA" strokeWidth={3} />
    <line x1={L} y1={T + H} x2={L + W} y2={T + H} stroke="#C5CFDA" strokeWidth={3} />
    {[0, 6, 12, 18, 24, 27, 29].map((i) => (
      <text key={i} x={px(i)} y={T + H + 40} fill="#8C99A8" fontFamily={FONT} fontSize={20} textAnchor="middle">
        {tickLabel(i)}
      </text>
    ))}
    {/* the "future" fan gets a soft warm halo so it reads even at thumbnail size */}
    <polygon points={bandPts} fill="rgba(237,125,49,0.15)" filter="url(#glowCover)" stroke="none" />
    <line x1={px(23)} y1={T - 10} x2={px(23)} y2={T + H} stroke="#A8B4C2" strokeWidth={2} strokeDasharray="8 10" />
    <text x={px(23) + 14} y={T - 18} fill="#8C99A8" fontFamily={FONT} fontSize={20}>
      今天
    </text>

    <polygon points={bandPts} fill="rgba(237,125,49,0.20)" stroke="none" />

    <path
      d={forePath}
      fill="none"
      stroke={ORANGE}
      strokeWidth={16}
      opacity={0.22}
      filter="url(#glowCover)"
      strokeLinejoin="round"
      strokeLinecap="round"
    />

    <path d={histPath} fill="none" stroke={BLUE} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />

    <clipPath id="foreClipCover">
      <rect x={px(22)} y={T - 60} width={px(29) - px(22) + 60} height={H + 120} />
    </clipPath>
    <g clipPath="url(#foreClipCover)">
      <path d={lowPath} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="10 8" opacity={0.9} />
      <path d={upPath} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="10 8" opacity={0.9} />
      <path d={forePath} fill="none" stroke={ORANGE} strokeWidth={6} strokeLinejoin="round" />
    </g>

    <g fontFamily={FONT}>
      <line x1={px(12)} y1={py(152) + 8} x2={px(12)} y2={py(152) + 70} stroke="#A8B4C2" strokeWidth={2} />
      <text x={px(12)} y={py(152) + 100} fill={MUTED} fontSize={26} fontWeight={700} textAnchor="middle">
        历史 24 个月
      </text>
      <line x1={px(27)} y1={py(178) - 10} x2={px(27)} y2={py(178) - 80} stroke="#E0A46E" strokeWidth={2} />
      <text x={px(27)} y={py(178) - 96} fill={WARM} fontSize={28} fontWeight={900} textAnchor="middle">
        预测半年
      </text>
    </g>
  </svg>
);

const ChartCard: React.FC<{ width: number; rotate?: number; pad?: number }> = ({ width, rotate = 0, pad = 26 }) => (
  <div
    style={{
      width,
      borderRadius: 22,
      background: "#FFFFFF",
      border: "1px solid rgba(17,32,50,.08)",
      boxShadow: "0 38px 90px rgba(17,32,50,.16), 0 6px 18px rgba(17,32,50,.08)",
      padding: pad,
      transform: `rotate(${rotate}deg)`,
    }}
  >
    <Chart />
  </div>
);

const Bg: React.FC<{ gx?: number; gy?: number }> = ({ gx = 10, gy = 6 }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(165deg, #FBFCFE 0%, #F1F5FA 58%, #E9EFF7 100%)" }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(52% 48% at ${gx}% ${gy}%, rgba(63,111,192,.13), rgba(0,0,0,0) 70%)`,
      }}
    />
    <AbsoluteFill style={{ background: "radial-gradient(46% 42% at 98% 96%, rgba(237,125,49,.13), rgba(0,0,0,0) 72%)" }} />
  </>
);

const Pill: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <div
    style={{
      display: "inline-block",
      background: GREEN,
      color: "#fff",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: 1,
      padding: `${size * 0.34}px ${size * 0.9}px`,
      borderRadius: 999,
      boxShadow: "0 10px 22px rgba(29,111,66,.28)",
    }}
  >
    每天一个 Excel 小技巧
  </div>
);

const TitleStack: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontFamily: FONT, fontWeight: 900, lineHeight: 1.14, letterSpacing: -2 }}>
    <div style={{ color: INK, fontSize: size }}>预测工作表</div>
    <div style={{ color: WARM, fontSize: size }}>一图帮你看未来</div>
  </div>
);

const TitleLine: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -2, whiteSpace: "nowrap" }}>
    <span style={{ color: INK }}>预测工作表，</span>
    <span style={{ color: WARM }}>一图帮你看未来</span>
  </div>
);

const Sub: React.FC<{ size?: number; top?: number }> = ({ size = 34, top }) => (
  <div
    style={{
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: size,
      color: MUTED,
      letterSpacing: 3,
      marginTop: top === undefined ? size * 0.75 : top,
    }}
  >
    不用写公式
  </div>
);

const CornerNote: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: size, color: "#7E8FA3", letterSpacing: 3 }}>
    不用写公式
  </div>
);

// ---------- 16:9 · 字在上，图铺满 ----------
const Cover169B: React.FC = () => (
  <AbsoluteFill>
    <Bg gx={14} gy={2} />
    <div style={{ position: "absolute", left: 110, top: 54 }}>
      <Pill size={24} />
    </div>
    <div style={{ position: "absolute", left: 106, top: 110 }}>
      <TitleLine size={92} />
    </div>
    <div style={{ position: "absolute", right: 110, top: 72 }}>
      <CornerNote size={28} />
    </div>
    <div style={{ position: "absolute", left: 100, top: 252 }}>
      <ChartCard width={1720} pad={30} />
    </div>
  </AbsoluteFill>
);

// ---------- 4:3 ----------
const Cover43: React.FC = () => (
  <AbsoluteFill>
    <Bg gx={12} gy={6} />
    <div style={{ position: "absolute", left: 132, top: 86 }}>
      <Pill size={26} />
    </div>
    <div style={{ position: "absolute", left: 128, top: 206 }}>
      <TitleStack size={92} />
      <Sub size={30} />
    </div>
    <div style={{ position: "absolute", left: 150, top: 548 }}>
      <ChartCard width={1300} rotate={-1} />
    </div>
  </AbsoluteFill>
);

// ---------- 3:4 ----------
const Cover34: React.FC = () => (
  <AbsoluteFill>
    <Bg gx={20} gy={4} />
    <div style={{ position: "absolute", left: 90, top: 130 }}>
      <Pill size={26} />
    </div>
    <div style={{ position: "absolute", left: 10, top: 305 }}>
      <ChartCard width={1180} pad={30} />
    </div>
    <div style={{ position: "absolute", left: 96, top: 995 }}>
      <TitleStack size={138} />
      <Sub size={36} top={30} />
    </div>
  </AbsoluteFill>
);

const Root: React.FC = () => (
  <>
    <Composition id="Cover169B" component={Cover169B} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Cover43" component={Cover43} durationInFrames={1} fps={30} width={1600} height={1200} />
    <Composition id="Cover34" component={Cover34} durationInFrames={1} fps={30} width={1200} height={1600} />
  </>
);

registerRoot(Root);
