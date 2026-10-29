import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';

// same numbers as the recorded demo
const HIST = [128, 121, 130, 136, 145, 168, 175, 160, 138, 133, 139, 166,
  141, 134, 143, 150, 159, 185, 192, 176, 152, 147, 153, 183];
const FORE = [171.05, 172.63, 174.20, 175.78, 177.36, 178.94];
const LOW = [137.51, 138.92, 140.33, 141.73, 143.13, 144.53];
const UP = [204.58, 206.33, 208.08, 209.83, 211.59, 213.35];

const L = 250;
const T = 300;
const W = 1420;
const H = 520;
const N = HIST.length + FORE.length; // 30 points
const px = (i: number) => L + (i / (N - 1)) * W;
const py = (v: number) => T + H - (v / 250) * H;

const BLUE = "#4472C4";
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

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / 30;
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

  const titleIn = interpolate(s, [0.0, 0.25], [0, 1], clamp);
  const axesIn = interpolate(s, [0.22, 0.48], [0, 1], clamp);
  const histDraw = interpolate(s, [0.5, 1.8], [0, 1], clamp);
  const foreDraw = interpolate(s, [1.75, 2.35], [0, 1], clamp);
  const bandIn = interpolate(s, [1.95, 2.5], [0, 1], clamp);
  const labelsIn = interpolate(s, [2.4, 2.85], [0, 1], clamp);
  const stampIn = interpolate(s, [2.8, 3.1], [0, 1], clamp);
  const out = interpolate(s, [4.62, 4.76], [1, 0], clamp);

  const xTicks = [0, 6, 12, 18, 24, 27, 29];
  const tickLabel = (i: number) => {
    if (i <= 23) {
      const y = 2023 + Math.floor(i / 12);
      const m = (i % 12) + 1;
      return `${y}-${String(m).padStart(2, "0")}`;
    }
    const k = i - 24;
    return `${2025}-${String(k + 1).padStart(2, "0")}`;
  };

  return (
    <AbsoluteFill style={{ background: "#0b0e13", opacity: out }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {/* title */}
        <g opacity={titleIn}>
          <text x={250} y={150} fill="#FFD400" fontFamily={FONT} fontSize={30} fontWeight={900} letterSpacing={4}>
            EP04 · 预测工作表
          </text>
          <text x={250} y={215} fill="#e6edf3" fontFamily={FONT} fontSize={48} fontWeight={900}>
            24 个月历史数据，Excel 往后推半年
          </text>
        </g>

        {/* axes + grid */}
        <g opacity={axesIn}>
          {[0, 50, 100, 150, 200, 250].map((v) => (
            <g key={v}>
              <line x1={L} y1={py(v)} x2={L + W} y2={py(v)} stroke="#1b2430" strokeWidth={2} />
              <text x={L - 24} y={py(v) + 8} fill="#5b6b7d" fontFamily={FONT} fontSize={22} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          <line x1={L} y1={T} x2={L} y2={T + H} stroke="#2a3746" strokeWidth={3} />
          <line x1={L} y1={T + H} x2={L + W} y2={T + H} stroke="#2a3746" strokeWidth={3} />
          {xTicks.map((i) => (
            <text key={i} x={px(i)} y={T + H + 40} fill="#5b6b7d" fontFamily={FONT} fontSize={20} textAnchor="middle">
              {tickLabel(i)}
            </text>
          ))}
          <line x1={px(23)} y1={T - 10} x2={px(23)} y2={T + H} stroke="#33414f" strokeWidth={2} strokeDasharray="8 10" />
          <text x={px(23) + 14} y={T - 18} fill="#7c8899" fontFamily={FONT} fontSize={20}>
            今天
          </text>
        </g>

        {/* confidence band */}
        <g opacity={bandIn}>
          <polygon points={bandPts} fill="rgba(237,125,49,0.18)" stroke="none" />
        </g>

        {/* history line (draws on) */}
        <path
          d={histPath}
          fill="none"
          stroke={BLUE}
          strokeWidth={7}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - histDraw}
        />

        {/* forecast + bounds (revealed by clip rect) */}
        <clipPath id="foreClip">
          <rect x={px(23)} y={T - 40} width={Math.max(0, (px(29) - px(23)) * foreDraw)} height={H + 80} />
        </clipPath>
        <g clipPath="url(#foreClip)">
          <path d={lowPath} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="10 8" opacity={0.85} />
          <path d={upPath} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="10 8" opacity={0.85} />
          <path d={forePath} fill="none" stroke={ORANGE} strokeWidth={6} strokeLinejoin="round" />
        </g>

        {/* labels */}
        <g opacity={labelsIn} fontFamily={FONT}>
          <g>
            <line x1={px(12)} y1={py(152) + 8} x2={px(12)} y2={py(152) + 70} stroke="#7c8899" strokeWidth={2} />
            <text x={px(12)} y={py(152) + 100} fill="#9fb0c3" fontSize={26} fontWeight={700} textAnchor="middle">
              历史 24 个月
            </text>
          </g>
          <g>
            <line x1={px(27)} y1={py(178) - 10} x2={px(27)} y2={py(178) - 80} stroke="#7c8899" strokeWidth={2} />
            <text x={px(27)} y={py(178) - 96} fill={ORANGE} fontSize={28} fontWeight={900} textAnchor="middle">
              预测半年
            </text>
          </g>
          <text x={px(25.2)} y={py(140) + 46} fill="#c9855a" fontSize={24} fontWeight={700}>
            95% 置信区间
          </text>
        </g>

        {/* footer stamp */}
        <g opacity={stampIn}>
          <rect x={1240} y={96} width={560} height={62} rx={14} fill="rgba(68,114,196,0.16)" stroke="rgba(68,114,196,0.6)" />
          <text x={1264} y={137} fill="#9db9e8" fontFamily={FONT} fontSize={24} fontWeight={700}>
            没有公式 · 点三下 · 自动出图
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

