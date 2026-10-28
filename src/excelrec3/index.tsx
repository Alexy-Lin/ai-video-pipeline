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
const DUR = 468; // 15.6s
const SCALE = 0.96; // 2000x1150 窗口 -> 1920x1104
const TOP = -12;
const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const OUTLINE =
  "0 0 10px rgba(0,0,0,.95), 3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000";

const SUBS = [
  { from: 0.0, to: 4.06, text: "想在表格里插入图表，又嫌它太占地方？" },
  { from: 4.06, to: 9.48, text: "Excel 里其实有更简单方便的做法，叫迷你图。" },
  { from: 9.93, to: 14.51, text: "首先选中要作图的数据，然后点「插入」。" },
];

const Ep: React.FC = () => {
  const f = useCurrentFrame();
  const s = f / FPS;
  const sub = SUBS.find((x) => s >= x.from && s < x.to);
  const fade = interpolate(s, [15.0, 15.55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Audio src={staticFile("b1920v2/voice.wav")} />
      <OffthreadVideo
        src={staticFile("rec4/seg-a.mp4")}
        style={{ position: "absolute", left: 0, top: TOP, width: 2000 * SCALE, height: 1150 * SCALE }}
      />
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
  <Composition id="Ep03RecB" component={Ep} durationInFrames={DUR} fps={FPS} width={VW} height={VH} />
);

registerRoot(Root);
