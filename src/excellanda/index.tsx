import {AbsoluteFill, Audio, Composition, Img, registerRoot, staticFile, useCurrentFrame} from "remotion";
import React from "react";

const FPS = 30, DUR = 1270, W = 1920;
const S = 1478 / 2000, OX = 320, OY = 90, SW = 2000 * S, SH = 1150 * S;
const C = (x: number, y: number) => [x * S, y * S] as const;
const F = (t: number) => Math.round(t * 30);

const SCENES = [
  { from: 0, to: F(9.93), src: "b1920v2/s1-clean.png" },
  { from: F(9.93), to: F(14.51), src: "b1920v2/s3-selected.png" },
  { from: F(14.51), to: F(21.99), src: "b1920v2/s3-selected.png", dialog: true },
  { from: F(21.99), to: F(24.6), src: "b1920v2/s5-first.png" },
  { from: F(24.6), to: F(27.51), src: "b1920v2/s6-filled.png" },
  { from: F(27.51), to: F(30.0), src: "b1920v2/s6b-minitab.png" },
  { from: F(30.0), to: F(31.9), src: "b1920v2/s7-high.png" },
  { from: F(31.9), to: DUR, src: "b1920v2/s8-low.png" },
];

const SUBS = [
  { from: 0, to: F(4.06), text: "想在表格里插入图表，又嫌它太占地方？" },
  { from: F(4.06), to: F(9.48), text: "Excel 里其实有更简单方便的做法，叫迷你图。" },
  { from: F(9.93), to: F(14.51), text: "首先选中要作图的数据，然后点「插入」。" },
  { from: F(14.51), to: F(21.99), text: "找到「迷你图」，选「折线」，位置填右边的单元格。" },
  { from: F(22.44), to: F(27.51), text: "第一行出来了，往下一拖，六家店的曲线全有。" },
  { from: F(27.51), to: F(33.54), text: "再勾上「高点」和「低点」，最高最低自动标红蓝。" },
  { from: F(33.99), to: F(37.41), text: "周末哪家店流量高，一眼就能看出来。" },
  { from: F(37.41), to: DUR, text: "每天一个小技巧，轻松变成 Excel 达人！" },
];

const STEPS = ["选中数据", "插入迷你图", "下拉填充", "标记高低点"];
const SUB = "0 0 12px rgba(0,0,0,0.9), 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000";
const DLG = { x1: 1314, y1: 355, x2: 1721, y2: 650 };

const Ep: React.FC = () => {
  const f = useCurrentFrame();
  const sc = SCENES.find((s) => f >= s.from && f < s.to) ?? SCENES[SCENES.length - 1];
  const sub = SUBS.find((s) => f >= s.from && f < s.to);
  const stepIdx = f < F(14.51) ? 0 : f < F(27.51) ? 1 : f < F(33.54) ? 2 : 3;
  const done = f >= F(33.54);
  const showDlg = f >= F(14.51) && f < F(21.99);
  const typeTxt = f < F(17.4) ? "" : f < F(18.6) ? "I" : "I2";

  return (
    <AbsoluteFill style={{ background: "radial-gradient(1200px 900px at 18% -10%, #17202c 0%, #0a0d12 60%, #06080b 100%)" }}>
      <Audio src={staticFile("b1920v2/voice.wav")} />
      <div style={{ position: "absolute", left: 30, top: 80, width: 258 }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 19, fontWeight: 700, color: "#3DC7FF", letterSpacing: 4 }}>EP03 · 迷你图</div>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 32, fontWeight: 900, color: "#fff", marginTop: 10, lineHeight: 1.32 }}>一个格子<br />看清一周</div>
        <div style={{ width: 74, height: 5, background: "#FFD400", margin: "16px 0 22px", borderRadius: 3 }} />
        {STEPS.map((s, i) => {
          const active = i === stepIdx && !done;
          const ok = i < stepIdx || done;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 25, height: 25, borderRadius: 13, background: active ? "#FFD400" : ok ? "#2b6e4d" : "#1b232e", color: active ? "#0b0e13" : ok ? "#3DDC84" : "#5d6a7a", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Microsoft YaHei" }}>{ok ? "✓" : i + 1}</div>
              <div style={{ fontFamily: "Microsoft YaHei", fontSize: 16, fontWeight: active ? 800 : 500, color: active ? "#FFD400" : ok ? "#5d8f76" : "#6b7787" }}>{s}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: OX, top: OY, width: SW, height: SH, overflow: "hidden", borderRadius: 10, boxShadow: "0 26px 70px rgba(0,0,0,0.6)", background: "#fff" }}>
        <Img src={staticFile(sc.src)} style={{ width: SW, height: SH, display: "block" }} />
        {showDlg && (
          <div style={{ position: "absolute", left: DLG.x1 * S, top: DLG.y1 * S, width: (DLG.x2 - DLG.x1) * S, height: (DLG.y2 - DLG.y1) * S, filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.35))" }}>
            <Img src={staticFile("b1920v2/s4-dialog.png")} style={{ width: "100%", height: "100%", display: "block" }} />
            <div style={{ position: "absolute", left: 136 * S, top: 181 * S, fontFamily: "Microsoft YaHei", fontSize: 20 * S, color: "#000" }}>{typeTxt}</div>
          </div>
        )}
        {done && <div style={{ position: "absolute", left: C(1514, 262)[0], top: C(1514, 262)[1], width: C(1746, 262)[0] - C(1514, 262)[0], height: C(1746, 1012)[1] - C(1514, 262)[1], border: "4px solid #3DDC84", borderRadius: 10, background: "rgba(61,220,132,0.10)", boxShadow: "0 0 40px rgba(61,220,132,0.35)" }} />}
      </div>

      <div style={{ position: "absolute", left: 0, top: 958, width: W, height: 86, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontWeight: 900, fontSize: 44, color: "#FFD400", textShadow: SUB }}>{sub?.text ?? ""}</div>
      </div>

      {done && (
        <div style={{ position: "absolute", left: 30, top: 640, width: 246 }}>
          <div style={{ fontFamily: "Microsoft YaHei", fontSize: 12, fontWeight: 700, color: "#5d6a7a", letterSpacing: 2, marginBottom: 8 }}>本集结论</div>
          <div style={{ fontFamily: "Microsoft YaHei", fontSize: 22, fontWeight: 900, color: "#0b0e13", background: "#3DDC84", padding: "12px 14px", borderRadius: 10, lineHeight: 1.45 }}>周末客流<br />≈ 工作日 1.8 倍</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => <Composition id="Ep03A" component={Ep} durationInFrames={DUR} fps={FPS} width={1920} height={1080} />;
registerRoot(Root);
export { Ep };
