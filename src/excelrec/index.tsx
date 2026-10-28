import {AbsoluteFill, Composition, Img, interpolate, OffthreadVideo, registerRoot, staticFile, useCurrentFrame} from "remotion";
import React from "react";

const FPS = 30;
const DUR = 600;
const IMG_W = 2000;
const IMG_H = 1150;
const S = 1478 / IMG_W;
const OX = 320;
const OY = 90;
const SCREEN_W = IMG_W * S;
const SCREEN_H = IMG_H * S;
const C = (x: number, y: number) => [x * S, y * S] as const;

type Cam = { in: number; out: number; hold: number; back: number; s: number; cx: number; cy: number };
const CAMS: Cam[] = [
  { in: 198, out: 206, hold: 250, back: 258, s: 1.7, cx: 1517, cy: 502 },
  { in: 270, out: 278, hold: 330, back: 338, s: 1.5, cx: 1635, cy: 430 },
];

const camera = (frame: number) => {
  for (const c of CAMS) {
    if (frame >= c.in && frame <= c.back) {
      let s = 1;
      if (frame < c.out) s = interpolate(frame, [c.in, c.out], [1, c.s]);
      else if (frame <= c.hold) s = c.s;
      else s = interpolate(frame, [c.hold, c.back], [c.s, 1]);
      return { s, cx: c.cx * S, cy: c.cy * S };
    }
  }
  return { s: 1, cx: SCREEN_W / 2, cy: SCREEN_H / 2 };
};

const SUB = "0 0 12px rgba(0,0,0,0.9), 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000";

const BEATS = [
  { from: 0, to: 123, text: "首先选中要作图的数据" },
  { from: 123, to: 177, text: "然后点「插入」" },
  { from: 177, to: 222, text: "找到「迷你图」，选「折线」" },
  { from: 222, to: 264, text: "位置填右边的单元格，然后确定" },
  { from: 264, to: 360, text: "第一行出来了" },
  { from: 360, to: 420, text: "往下一拖，六家店的曲线全有" },
  { from: 420, to: 477, text: "再勾上「高点」和「低点」" },
  { from: 477, to: 531, text: "最高最低自动标红标蓝" },
  { from: 531, to: 600, text: "周末哪家店客流高，一眼就看出来" },
];

const STEPS = ["选中数据", "插入迷你图", "下拉填充", "标记高低点"];

const Ep03Rec: React.FC = () => {
  const frame = useCurrentFrame();
  const beat = BEATS.find((b) => frame >= b.from && frame < b.to);
  const cam = camera(frame);
  const stepIdx = frame < 177 ? 0 : frame < 264 ? 1 : frame < 420 ? 2 : 3;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(1200px 900px at 18% -10%, #17202c 0%, #0a0d12 60%, #06080b 100%)" }}>
      <div style={{ position: "absolute", left: 30, top: 80, width: 258 }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 19, fontWeight: 700, color: "#3DC7FF", letterSpacing: 4 }}>EP03 · 迷你图</div>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 32, fontWeight: 900, color: "#fff", marginTop: 10, lineHeight: 1.32 }}>
          一个格子
          <br />
          看清一周
        </div>
        <div style={{ width: 74, height: 5, background: "#FFD400", margin: "16px 0 22px", borderRadius: 3 }} />
        {STEPS.map((s, i) => {
          const active = i === stepIdx && frame < 531;
          const done = i < stepIdx || frame >= 531;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 13,
                  background: active ? "#FFD400" : done ? "#2b6e4d" : "#1b232e",
                  color: active ? "#0b0e13" : done ? "#3DDC84" : "#5d6a7a",
                  fontSize: 14,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Microsoft YaHei",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <div style={{ fontFamily: "Microsoft YaHei", fontSize: 16, fontWeight: active ? 800 : 500, color: active ? "#FFD400" : done ? "#5d8f76" : "#6b7787" }}>{s}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: OX, top: OY, width: SCREEN_W, height: SCREEN_H, overflow: "hidden", borderRadius: 10, boxShadow: "0 26px 70px rgba(0,0,0,0.6)", background: "#fff" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${cam.s})`, transformOrigin: `${cam.cx}px ${cam.cy}px` }}>
          {frame < 531 ? (
            <OffthreadVideo src={staticFile("excel/clip-ui.mp4")} style={{ width: SCREEN_W, height: SCREEN_H, display: "block" }} />
          ) : (
            <Img src={staticFile("b1920v2/s8-low.png")} style={{ width: SCREEN_W, height: SCREEN_H, display: "block" }} />
          )}
          {frame >= 531 && (
            <div
              style={{
                position: "absolute",
                left: C(1514, 262)[0],
                top: C(1514, 262)[1],
                width: C(1746, 262)[0] - C(1514, 262)[0],
                height: C(1746, 1012)[1] - C(1514, 262)[1],
                border: "4px solid #3DDC84",
                borderRadius: 10,
                background: "rgba(61,220,132,0.10)",
                boxShadow: "0 0 40px rgba(61,220,132,0.35)",
              }}
            />
          )}
        </div>
      </div>

      {/* 字幕：相对整个画面水平居中 */}
      <div style={{ position: "absolute", left: 0, top: 958, width: 1920, height: 86, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontWeight: 900, fontSize: 44, color: "#FFD400", textShadow: SUB, letterSpacing: 0, textAlign: "center" }}>{beat?.text ?? ""}</div>
      </div>

      {frame >= 531 && (
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

const Root: React.FC = () => <Composition id="Ep03Rec" component={Ep03Rec} durationInFrames={DUR} fps={FPS} width={1920} height={1080} />;

registerRoot(Root);
export { Ep03Rec };
