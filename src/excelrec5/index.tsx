import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  OffthreadVideo,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Intro } from "./Intro";

const VW = 1920;
const VH = 1080;
const FPS = 30;
const DUR = 1020; // 34s
const S = 0.9; // 2000x1350 -> 1800x1215
const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const OUTLINE =
  "0 0 10px rgba(0,0,0,.95), 3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000";

const SUBS = [
  { from: 0.0, to: 4.44, text: "有了数据，想快速预测变化趋势，Excel 里有个现成的功能。" },
  { from: 4.89, to: 10.33, text: "选中两列历史数据，一列日期，一列数值；表头也一起选上。" },
  { from: 10.78, to: 16.99, text: "点击数据里的预测工作表，结束时间用默认就行，点击创建。" },
  { from: 17.44, to: 22.22, text: "新表里，实线是历史，虚线是预测，灰色是置信区间。" },
  { from: 22.67, to: 28.63, text: "它是按趋势和季节性来计算的；数据太少，或者波动没有规律，结果就只能作参考。" },
  { from: 29.08, to: 31.54, text: "每天一个 Excel 小技巧，你学到了吗？" },
];

const TitleChip: React.FC<{ s: number }> = ({ s }) => {
  const show = s >= 4.72 && s < 31.0;
  if (!show) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 54,
        top: 40,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(11,14,19,.82)",
        border: "2px solid rgba(255,212,0,.55)",
        borderRadius: 12,
        padding: "10px 18px",
      }}
    >
      <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: "#FFD400", letterSpacing: 2 }}>EP04</span>
      <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "#e6edf3" }}>预测工作表 · 往下推半年</span>
    </div>
  );
};

const Callout: React.FC<{ s: number }> = ({ s }) => {
  const k = interpolate(s, [22.7, 23.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 54,
        top: 40,
        opacity: k,
        transform: `translateY(${(1 - k) * 14}px)`,
        background: "rgba(11,14,19,.9)",
        border: "3px solid #3DDC84",
        borderRadius: 14,
        padding: "14px 22px",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: "#3DDC84", letterSpacing: 2 }}>
        统计模型
      </div>
      <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: "#fff", marginTop: 4 }}>
        数据不足时仅供参考
      </div>
    </div>
  );
};

const Ep: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const sub = SUBS.find((x) => s >= x.from && s < x.to);
  const fade = interpolate(s, [33.1, 33.9], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Audio src={staticFile("b1920v4/voice.wav")} />
      <Audio src={staticFile("b1920v4/bgm.wav")} volume={0.72} />
      <div style={{ position: "absolute", left: 0, top: 0, width: VW, height: VH, overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile("rec5/full.mp4")}
          style={{ position: "absolute", left: 60, top: -27, width: 2000 * S, height: 1350 * S }}
        />
      </div>
      <TitleChip s={s} />
      <Callout s={s} />
      {s < 4.77 ? <Intro /> : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 280,
          background: "linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,0))",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 50 }}>
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
  <Composition id="Ep04" component={Ep} durationInFrames={DUR} fps={FPS} width={VW} height={VH} />
);

registerRoot(Root);

