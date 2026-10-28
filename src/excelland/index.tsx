import {AbsoluteFill, Audio, Composition, Img, OffthreadVideo, registerRoot, staticFile, useCurrentFrame, interpolate} from "remotion";
import React from "react";

const FPS = 30;
const DUR = 1270;
const IMG_W = 2000;
const IMG_H = 1150;
const S = 1478 / IMG_W;
const OX = 320;
const OY = 90;
const SCREEN_W = IMG_W * S;
const SCREEN_H = IMG_H * S;
const C = (x: number, y: number) => [x * S, y * S] as const;

type Scene = { from: number; to: number; kind: "still" | "video"; src: string; startFrom?: number; rate?: number };
const SCENES: Scene[] = [
  { from: 0, to: 298, kind: "still", src: "b1920v2/s8-low.png" },
  { from: 298, to: 436, kind: "video", src: "excel/clip-ui2.mp4", startFrom: 39 },
  { from: 436, to: 660, kind: "video", src: "excel/clip-ui2.mp4", startFrom: 156, rate: 0.75 },
  { from: 660, to: 825, kind: "video", src: "excel/clip-ui2.mp4", startFrom: 297 },
  { from: 825, to: 960, kind: "video", src: "excel/clip-ui2.mp4", startFrom: 447, rate: 0.8 },
  { from: 960, to: 1115, kind: "still", src: "b1920v2/s8-low.png" },
  { from: 1115, to: 1270, kind: "still", src: "b1920v2/s8-low.png" },
];

const SUBS = [
  { from: 0, to: 122, text: "想在表格里插入图表，又嫌它太占地方？" },
  { from: 122, to: 284, text: "Excel 里其实有更简单方便的做法，叫迷你图。" },
  { from: 298, to: 435, text: "首先选中要作图的数据，然后点「插入」。" },
  { from: 435, to: 660, text: "找到「迷你图」，选「折线」，位置填右边的单元格，然后确定。" },
  { from: 660, to: 825, text: "第一行出来了，往下一拖，六家店的曲线全有。" },
  { from: 825, to: 1006, text: "再勾上「高点」和「低点」，最高最低自动标红蓝。" },
  { from: 1006, to: 1115, text: "周末哪家店流量高，一眼就能看出来。" },
  { from: 1115, to: 1243, text: "每天一个小技巧，轻松变成 Excel 达人！" },
];

const STEPS = ["选中数据", "插入迷你图", "下拉填充", "标记高低点"];
const SUB = "0 0 12px rgba(0,0,0,0.9), 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000";

const Ep03Final: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES.find((s) => frame >= s.from && frame < s.to) ?? SCENES[SCENES.length - 1];
  const sub = SUBS.find((s) => frame >= s.from && frame < s.to);
  const stepIdx = frame < 298 ? 0 : frame < 660 ? 1 : frame < 825 ? 2 : 3;
  const showFinal = frame >= 1006;
  const cardIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(1200px 900px at 18% -10%, #17202c 0%, #0a0d12 60%, #06080b 100%)" }}>
      <Audio src={staticFile("b1920v2/voice.wav")} />

      <div style={{ position: "absolute", left: 30, top: 80, width: 258 }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 19, fontWeight: 700, color: "#3DC7FF", letterSpacing: 4 }}>EP03 · 迷你图</div>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 32, fontWeight: 900, color: "#fff", marginTop: 10, lineHeight: 1.32 }}>
          一个格子
          <br />
          看清一周
        </div>
        <div style={{ width: 74, height: 5, background: "#FFD400", margin: "16px 0 22px", borderRadius: 3 }} />
        {STEPS.map((s, i) => {
          const active = i === stepIdx && !showFinal;
          const done = i < stepIdx || showFinal;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 25, height: 25, borderRadius: 13, background: active ? "#FFD400" : done ? "#2b6e4d" : "#1b232e", color: active ? "#0b0e13" : done ? "#3DDC84" : "#5d6a7a", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Microsoft YaHei" }}>{done ? "✓" : i + 1}</div>
              <div style={{ fontFamily: "Microsoft YaHei", fontSize: 16, fontWeight: active ? 800 : 500, color: active ? "#FFD400" : done ? "#5d8f76" : "#6b7787" }}>{s}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: OX, top: OY, width: SCREEN_W, height: SCREEN_H, overflow: "hidden", borderRadius: 10, boxShadow: "0 26px 70px rgba(0,0,0,0.6)", background: "#fff", opacity: cardIn }}>
        {scene.kind === "video" ? (
          <OffthreadVideo key={scene.from} src={staticFile(scene.src)} startFrom={scene.startFrom ?? 0} playbackRate={scene.rate ?? 1} style={{ width: SCREEN_W, height: SCREEN_H, display: "block" }} />
        ) : (
          <Img key={scene.from} src={staticFile(scene.src)} style={{ width: SCREEN_W, height: SCREEN_H, display: "block" }} />
        )}
        {showFinal && (
          <div style={{ position: "absolute", left: C(1514, 262)[0], top: C(1514, 262)[1], width: C(1746, 262)[0] - C(1514, 262)[0], height: C(1746, 1012)[1] - C(1514, 262)[1], border: "4px solid #3DDC84", borderRadius: 10, background: "rgba(61,220,132,0.10)", boxShadow: "0 0 40px rgba(61,220,132,0.35)" }} />
        )}
      </div>

      <div style={{ position: "absolute", left: 0, top: 958, width: 1920, height: 86, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontWeight: 900, fontSize: 44, color: "#FFD400", textShadow: SUB, textAlign: "center" }}>{sub?.text ?? ""}</div>
      </div>

      {showFinal && (
        <div style={{ position: "absolute", left: 30, top: 640, width: 246 }}>
          <div style={{ fontFamily: "Microsoft YaHei", fontSize: 12, fontWeight: 700, color: "#5d6a7a", letterSpacing: 2, marginBottom: 8 }}>本集结论</div>
          <div style={{ fontFamily: "Microsoft YaHei", fontSize: 22, fontWeight: 900, color: "#0b0e13", background: "#3DDC84", padding: "12px 14px", borderRadius: 10, lineHeight: 1.45 }}>
            周末客流
            <br />≈ 工作日 1.8 倍
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => <Composition id="Ep03Final" component={Ep03Final} durationInFrames={DUR} fps={FPS} width={1920} height={1080} />;

registerRoot(Root);
export { Ep03Final };
