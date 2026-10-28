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

const VW = 1920;
const VH = 1080;
const FPS = 30;
const DUR = 1290; // 43s，真实录屏原长
const SCALE = 0.96; // 2000x1150 窗口 -> 1920x1104
const TOP = -12;
const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const OUTLINE =
  "0 0 10px rgba(0,0,0,.95), 3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000";

const SUBS = [
  { from: 0.0, to: 4.06, text: "想在表格里插入图表，又嫌它太占地方？" },
  { from: 4.06, to: 9.48, text: "Excel 里其实有更简单方便的做法，叫迷你图。" },
  { from: 9.93, to: 14.51, text: "首先选中要作图的数据，然后点「插入」。" },
  { from: 14.51, to: 21.99, text: "找到「迷你图」，选「折线」，位置填数据右边的单元格，然后确定。" },
  { from: 22.44, to: 27.51, text: "第一行出来了，往下一拖，六家店的曲线全有。" },
  { from: 27.51, to: 33.54, text: "再勾上「高点」和「低点」——最高最低自动标红标蓝。" },
  { from: 33.99, to: 37.41, text: "周末哪家店流量高，一眼就能看出来。" },
  { from: 37.41, to: 41.43, text: "每天一个小技巧，轻松变成excel达人！" },
];

const SubIcons: React.FC<{ s: number }> = ({ s }) => {
  const show = s >= 37.5;
  if (!show) return null;
  const k = interpolate(s, [37.5, 38.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        right: 74,
        top: 96,
        opacity: k,
        transform: `translateY(${(1 - k) * 16}px)`,
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
  );
};

const Ep: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const sub = SUBS.find((x) => s >= x.from && s < x.to);
  const fade = interpolate(s, [42.4, 42.95], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Audio src={staticFile("b1920v2/voice.wav")} />
      <OffthreadVideo
        src={staticFile("rec10/full.mp4")}
        style={{ position: "absolute", left: 0, top: TOP, width: 2000 * SCALE, height: 1150 * SCALE }}
      />
      <SubIcons s={s} />
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
  <Composition id="Ep03Full" component={Ep} durationInFrames={DUR} fps={FPS} width={VW} height={VH} />
);

registerRoot(Root);
