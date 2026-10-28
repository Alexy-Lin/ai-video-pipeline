import {AbsoluteFill, Composition, Easing, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from "remotion";
import React from "react";

const FPS = 30;
const DUR = 780;

const IMG_W = 2000;
const IMG_H = 1150;
const S = 1478 / IMG_W;
const OX = 320;
const OY = 90;
const SCREEN_W = IMG_W * S;
const SCREEN_H = IMG_H * S;

const C = (x: number, y: number) => [x * S, y * S] as const;

// 关键点（窗口截图坐标）
const B2 = C(300, 430);
const H2 = C(1422, 430);
const TAB_INSERT = C(168, 80);
const BTN_LINE = C(986, 151);
const FIELD = C(1570, 545);
const OK_BTN = C(1554, 607);
const TAB_MINI = C(675, 80);
const CB_HIGH = C(333, 118);
const CB_LOW = C(333, 150);
const FILL_HANDLE = C(1746, 512);
const FILL_END = C(1746, 1028);
const PARK = C(1850, 1010);

const DLG = { x1: 1314, y1: 355, x2: 1721, y2: 650 };

type KF = { f: number; x: number; y: number };
const posAt = (frame: number, kfs: KF[]) => ({
  x: interpolate(frame, kfs.map((k) => k.f), kfs.map((k) => k.x), {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
  y: interpolate(frame, kfs.map((k) => k.f), kfs.map((k) => k.y), {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
});

const CURSOR: KF[] = [
  { f: 0, x: C(2060, 1060)[0], y: C(2060, 1060)[1] },
  { f: 42, x: B2[0], y: B2[1] },
  { f: 72, x: H2[0], y: H2[1] },
  { f: 96, x: PARK[0], y: PARK[1] },
  { f: 142, x: TAB_INSERT[0], y: TAB_INSERT[1] },
  { f: 170, x: TAB_INSERT[0] + 40, y: TAB_INSERT[1] + 46 },
  { f: 205, x: BTN_LINE[0], y: BTN_LINE[1] },
  { f: 232, x: FIELD[0], y: FIELD[1] },
  { f: 268, x: OK_BTN[0], y: OK_BTN[1] },
  { f: 296, x: PARK[0], y: PARK[1] },
  { f: 408, x: FILL_HANDLE[0], y: FILL_HANDLE[1] },
  { f: 470, x: FILL_END[0], y: FILL_END[1] },
  { f: 500, x: PARK[0], y: PARK[1] },
  { f: 532, x: TAB_MINI[0], y: TAB_MINI[1] },
  { f: 560, x: TAB_MINI[0], y: TAB_MINI[1] },
  { f: 582, x: CB_HIGH[0], y: CB_HIGH[1] },
  { f: 608, x: CB_LOW[0], y: CB_LOW[1] },
  { f: 640, x: PARK[0], y: PARK[1] },
  { f: 780, x: C(1820, 880)[0], y: C(1820, 880)[1] },
];

const CLICKS = [150, 212, 280, 540, 592, 630];

const SELECTION = { x1: 206, y1: 378, x2: 1514, y2: 482 };
const TAB_RECT = [126, 50, 210, 106];
const BTN_RECT = [958, 100, 1014, 203];

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <div style={{ position: "absolute", left: x - 3, top: y - 2, transform: `scale(${press})`, transformOrigin: "4px 3px" }}>
    <svg width="36" height="42" viewBox="0 0 36 42">
      <path d="M4 3 L4 32 L12 24.5 L17.5 38.5 L23 36 L17.5 22.5 L28.5 22.5 Z" fill="#fff" stroke="#101010" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  </div>
);

const Ripple: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  if (t < 0 || t > 16) return null;
  const p = t / 16;
  const r = 8 + 46 * p;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `3px solid rgba(255,212,0,${0.85 * (1 - p)})`,
        background: `rgba(255,212,0,${0.15 * (1 - p)})`,
      }}
    />
  );
};

const Box: React.FC<{ rect: number[]; color?: string }> = ({ rect, color = "#FFD400" }) => {
  const a = C(rect[0], rect[1]);
  const b = C(rect[2], rect[3]);
  return (
    <div
      style={{
        position: "absolute",
        left: a[0],
        top: a[1],
        width: b[0] - a[0],
        height: b[1] - a[1],
        border: `3px solid ${color}`,
        borderRadius: 9,
        background: "rgba(255,212,0,0.13)",
      }}
    />
  );
};

const SUB = "0 0 12px rgba(0,0,0,0.9), 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000";

// 快速缩放：8 帧进出，绝不缓慢推拉
type Cam = { in: number; out: number; hold: number; back: number; s: number; cx: number; cy: number };
const CAMS: Cam[] = [
  { in: 218, out: 226, hold: 280, back: 290, s: 1.8, cx: 1517, cy: 502 }, // 对话框
  { in: 302, out: 310, hold: 348, back: 356, s: 1.9, cx: 1635, cy: 430 }, // 第一行
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

const BEATS = [
  { from: 0, to: 100, text: "首先选中要作图的数据" },
  { from: 100, to: 200, text: "然后点「插入」" },
  { from: 200, to: 302, text: "找到「迷你图」，选「折线」" },
  { from: 302, to: 408, text: "位置填右边的单元格，然后确定" },
  { from: 408, to: 520, text: "第一行出来了，往下一拖，六家店全有" },
  { from: 520, to: 660, text: "再勾上「高点」和「低点」，自动标红标蓝" },
  { from: 660, to: 780, text: "周末哪家店客流高，一眼就看出来" },
];

const STEPS = ["选中数据", "插入迷你图", "下拉填充", "标记高低点"];

const Ep03Land: React.FC = () => {
  const frame = useCurrentFrame();
  const beat = BEATS.find((b) => frame >= b.from && frame < b.to);
  const cur = posAt(frame, CURSOR);
  const press = CLICKS.reduce((acc, c) => (Math.abs(frame - c) < 3 ? 0.85 : acc), 1);
  const cam = camera(frame);

  const bg = frame >= 640 ? "b1920v2/s8-low.png" : frame >= 592 ? "b1920v2/s7-high.png" : frame >= 540 ? "b1920v2/s6b-minitab.png" : frame >= 470 ? "b1920v2/s6-filled.png" : frame >= 290 ? "b1920v2/s5-first.png" : frame >= 150 ? "b1920v2/s3-selected.png" : "b1920v2/s1-clean.png";

  const selOpacity = interpolate(frame, [72, 88, 150, 152], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tabHi = interpolate(frame, [136, 146, 172, 182], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const btnHi = interpolate(frame, [196, 206, 232, 242], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cbHi = interpolate(frame, [578, 586, 640, 648], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const showDialog = frame >= 218 && frame < 288;
  const dialogIn = interpolate(frame, [218, 228], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const typed = frame < 246 ? "" : frame < 258 ? "I" : "I2";
  const caretOn = Math.floor(frame / 7) % 2 === 0;
  const stepIdx = frame < 150 ? 0 : frame < 302 ? 1 : frame < 520 ? 2 : 3;

  const dlgW = (DLG.x2 - DLG.x1) * S;
  const dlgH = (DLG.y2 - DLG.y1) * S;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(1200px 900px at 18% -10%, #17202c 0%, #0a0d12 60%, #06080b 100%)" }}>
      {/* 左栏 */}
      <div style={{ position: "absolute", left: 30, top: 80, width: 258 }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 19, fontWeight: 700, color: "#3DC7FF", letterSpacing: 4 }}>EP03 · 迷你图</div>
        <div style={{ fontFamily: "Microsoft YaHei", fontSize: 32, fontWeight: 900, color: "#fff", marginTop: 10, lineHeight: 1.32 }}>
          一个格子
          <br />
          看清一周
        </div>
        <div style={{ width: 74, height: 5, background: "#FFD400", margin: "16px 0 22px", borderRadius: 3 }} />
        {STEPS.map((s, i) => {
          const active = i === stepIdx && frame < 700;
          const done = i < stepIdx || frame >= 700;
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

      {/* 屏幕 */}
      <div style={{ position: "absolute", left: OX, top: OY, width: SCREEN_W, height: SCREEN_H, overflow: "hidden", borderRadius: 10, boxShadow: "0 26px 70px rgba(0,0,0,0.6)", background: "#fff" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${cam.s})`,
            transformOrigin: `${cam.cx}px ${cam.cy}px`,
          }}
        >
          <Img src={staticFile(bg)} style={{ width: SCREEN_W, height: SCREEN_H, display: "block" }} />

          {selOpacity > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: C(SELECTION.x1, SELECTION.y1)[0],
                top: C(SELECTION.x1, SELECTION.y1)[1],
                width: C(SELECTION.x2, SELECTION.y2)[0] - C(SELECTION.x1, SELECTION.y1)[0],
                height: C(SELECTION.x2, SELECTION.y2)[1] - C(SELECTION.x1, SELECTION.y1)[1],
                border: "2px solid #217346",
                background: "rgba(33,115,70,0.14)",
                opacity: selOpacity,
              }}
            />
          )}

          {tabHi > 0.01 && <Box rect={TAB_RECT} />}
          {btnHi > 0.01 && <Box rect={BTN_RECT} />}
          {frame >= 660 && (
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

          {showDialog && (
            <div
              style={{
                position: "absolute",
                left: DLG.x1 * S,
                top: DLG.y1 * S,
                width: dlgW,
                height: dlgH,
                opacity: dialogIn,
                transform: `scale(${dialogIn})`,
                transformOrigin: "50% 55%",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
              }}
            >
              <Img src={staticFile("b1920v2/s4-dialog.png")} style={{ width: "100%", height: "100%", display: "block" }} />
              <div
                style={{
                  position: "absolute",
                  left: 136 * S,
                  top: 181 * S,
                  height: 22 * S,
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "Microsoft YaHei",
                  fontSize: 20 * S,
                  color: "#000",
                }}
              >
                {typed}
                {caretOn && frame >= 240 && frame < 282 && <span style={{ width: 1.5, height: 16 * S, background: "#000", marginLeft: 1 }} />}
              </div>
            </div>
          )}

          <Cursor x={cur.x} y={cur.y} press={press} />
          {CLICKS.map((c) => {
            const p = posAt(c, CURSOR);
            return <Ripple key={c} x={p.x} y={p.y} t={frame - c} />;
          })}
        </div>
      </div>

      {/* 字幕 */}
      <div style={{ position: "absolute", left: OX, top: 958, width: SCREEN_W, height: 86, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Microsoft YaHei", fontWeight: 900, fontSize: 44, color: "#FFD400", textShadow: SUB, letterSpacing: 1 }}>{beat?.text ?? ""}</div>
      </div>

      {/* 结论条（左栏底部，不遮表格） */}
      {frame >= 660 && (
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

const Root: React.FC = () => <Composition id="Ep03Land" component={Ep03Land} durationInFrames={DUR} fps={FPS} width={1920} height={1080} />;

registerRoot(Root);
export { Ep03Land };
