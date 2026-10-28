import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from "remotion";

const VW = 1920;
const VH = 1080;
const FPS = 30;
const DUR = 1270; // 42.33s，和音轨对齐
const CY = 470; // 画面垂直锚点
const SUB_FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const SUB_SHADOW =
  "0 0 10px rgba(0,0,0,.95), 3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000";

type View = { x: number; y: number; w: number; h: number; s: number };
type Hl = { x: number; y: number; w: number; h: number; label?: string };

type Seg = {
  from: number;
  to: number;
  src: string;
  view: View;
  hl?: Hl;
};

// 截图是 2000x1150 的窗口原生像素；view 决定镜头框住哪一块、放大几倍
const SEGS: Seg[] = [
  // 开场：整张表
  { from: 0, to: 122, src: "kf3/k00-clean.png", view: { x: 12, y: 275, w: 1697, h: 719, s: 1.0 } },
  // “迷你图”：空着的趋势列
  {
    from: 122,
    to: 284,
    src: "kf3/k00-clean.png",
    view: { x: 1330, y: 240, w: 470, h: 740, s: 1.32 },
    hl: { x: 1519, y: 275, w: 187, h: 719, label: "趋势列还空着" },
  },
  // 选中数据
  { from: 284, to: 375, src: "kf3/k01-select-range.png", view: { x: 12, y: 275, w: 1697, h: 719, s: 1.0 } },
  // 插入 -> 迷你图
  {
    from: 375,
    to: 435,
    src: "kf3/k02-insert-tab.png",
    view: { x: 0, y: 30, w: 1560, h: 780, s: 0.98 },
    hl: { x: 950, y: 101, w: 180, h: 121, label: "迷你图" },
  },
  // 创建迷你图对话框
  {
    from: 435,
    to: 545,
    src: "kf3/k03-dialog.png",
    view: { x: 1000, y: 60, w: 1980, h: 1080, s: 0.96 },
    hl: { x: 1322, y: 363, w: 391, h: 279 },
  },
  {
    from: 545,
    to: 660,
    src: "kf3/k04-dialog-filled.png",
    view: { x: 1000, y: 60, w: 1980, h: 1080, s: 0.96 },
    hl: { x: 1322, y: 363, w: 391, h: 279, label: "位置填 I2，确定" },
  },
  // 第一个迷你图
  {
    from: 660,
    to: 720,
    src: "kf3/k05-first.png",
    view: { x: 1400, y: 250, w: 500, h: 700, s: 1.18 },
    hl: { x: 1519, y: 376, w: 187, h: 103, label: "第一行出来了" },
  },
  // 填充柄
  {
    from: 720,
    to: 770,
    src: "kf3/k06-fillhandle.png",
    view: { x: 1430, y: 300, w: 350, h: 520, s: 1.45 },
    hl: { x: 1690, y: 462, w: 34, h: 34, label: "填充柄" },
  },
  // 往下拖
  {
    from: 770,
    to: 805,
    src: "kf3/k07-dragging.png",
    view: { x: 1420, y: 250, w: 470, h: 770, s: 1.12 },
    hl: { x: 1519, y: 376, w: 187, h: 619, label: "按住往下拖" },
  },
  // 六家店都有
  {
    from: 805,
    to: 825,
    src: "kf3/k08-filled.png",
    view: { x: 1400, y: 240, w: 500, h: 790, s: 1.1 },
    hl: { x: 1519, y: 376, w: 187, h: 619, label: "六家店全有" },
  },
  // 迷你图设计选项卡
  {
    from: 825,
    to: 890,
    src: "kf3/k09-minitab.png",
    view: { x: 0, y: 30, w: 1200, h: 900, s: 1.0 },
    hl: { x: 638, y: 61, w: 74, h: 38, label: "迷你图设计" },
  },
  // 高点
  {
    from: 890,
    to: 950,
    src: "kf3/k10-high.png",
    view: { x: 130, y: 30, w: 900, h: 900, s: 1.0 },
    hl: { x: 296, y: 101, w: 74, h: 34, label: "勾上 高点" },
  },
  // 低点
  {
    from: 950,
    to: 1006,
    src: "kf3/k11-low.png",
    view: { x: 130, y: 30, w: 900, h: 900, s: 1.0 },
    hl: { x: 296, y: 133, w: 74, h: 34, label: "勾上 低点" },
  },
  // 结果
  {
    from: 1006,
    to: 1122,
    src: "kf3/k12-final.png",
    view: { x: 12, y: 275, w: 1697, h: 719, s: 1.0 },
    hl: { x: 1519, y: 275, w: 187, h: 719, label: "红点=最高 蓝点=最低" },
  },
  // 收尾
  {
    from: 1122,
    to: 1270,
    src: "kf3/k12-final.png",
    view: { x: 12, y: 275, w: 1697, h: 719, s: 1.0 },
  },
];

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

const SHOT_W = 2000;
const SHOT_H = 1150;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Cam = { scale: number; left: number; top: number };

const cameraFor = (view: View): Cam => {
  const scale = view.s;
  const rawLeft = VW / 2 - (view.x + view.w / 2) * scale;
  const rawTop = CY - (view.y + view.h / 2) * scale;
  // 夹住镜头：放大后画面不能露出截图边缘，边缘对齐即可
  return {
    scale,
    left: Math.min(0, Math.max(VW - SHOT_W * scale, rawLeft)),
    top: Math.min(0, Math.max(VH - SHOT_H * scale, rawTop)),
  };
};

const Camera: React.FC<{ src: string; cam: Cam }> = ({ src, cam }) => (
  <Img
    src={staticFile(src)}
    style={{
      position: "absolute",
      left: cam.left,
      top: cam.top,
      width: SHOT_W * cam.scale,
      height: SHOT_H * cam.scale,
    }}
  />
);

const Highlight: React.FC<{ hl: Hl; cam: Cam; appear: number }> = ({ hl, cam, appear }) => {
  if (appear <= 0) return null;
  const scale = cam.scale;
  const left = cam.left + hl.x * scale;
  const top = cam.top + hl.y * scale;
  const w = hl.w * scale;
  const h = hl.h * scale;
  const grow = lerp(0.86, 1, easeOut(appear));
  const labelW = hl.label ? Math.max(120, hl.label.length * 26 + 32) : 0;
  const labelTop = top - 52 >= 96 ? top - 52 : top + h + 10;
  const labelLeft = Math.min(VW - labelW - 12, Math.max(12, left + w / 2 - labelW / 2));
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: left + (w * (1 - grow)) / 2,
          top: top + (h * (1 - grow)) / 2,
          width: w * grow,
          height: h * grow,
          border: "3px solid #FFD400",
          borderRadius: 8,
          boxShadow: "0 0 0 3px rgba(0,0,0,.45), 0 0 26px rgba(255,212,0,.55)",
          opacity: appear,
        }}
      />
      {hl.label ? (
        <div
          style={{
            position: "absolute",
            left: labelLeft,
            top: labelTop,
            width: labelW,
            textAlign: "center",
            padding: "7px 0",
            background: "#FFD400",
            color: "#101820",
            fontFamily: SUB_FONT,
            fontWeight: 900,
            fontSize: 26,
            whiteSpace: "nowrap",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(0,0,0,.45)",
            opacity: appear,
          }}
        >
          {hl.label}
        </div>
      ) : null}
    </>
  );
};
const Ep: React.FC = () => {
  const f = useCurrentFrame();
  const idx = Math.max(0, SEGS.findIndex((s) => f >= s.from && f < s.to));
  const cur = SEGS[idx];
  const prev = idx > 0 ? SEGS[idx - 1] : cur;

  // 每段开头 8 帧做快速推镜（不做整段慢推）
  const t = interpolate(f - cur.from, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const k = easeOut(t);
  const view: View = {
    x: lerp(prev.view.x, cur.view.x, k),
    y: lerp(prev.view.y, cur.view.y, k),
    w: lerp(prev.view.w, cur.view.w, k),
    h: lerp(prev.view.h, cur.view.h, k),
    s: lerp(prev.view.s, cur.view.s, k),
  };

  const cam = cameraFor(view);
  const sub = SUBS.find((s) => f / FPS >= s.from && f / FPS < s.to);
  const hlAppear = cur.hl ? interpolate(f - cur.from, [4, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const isFinal = f >= 1122;
  const badge = interpolate(f, [1150, 1170], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0b0e13" }}>
      <Audio src={staticFile("b1920v2/voice.wav")} />
      <Camera src={cur.src} cam={cam} />
      {cur.hl ? <Highlight hl={cur.hl} cam={cam} appear={hlAppear} /> : null}

      {isFinal ? (
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 150,
            opacity: badge,
            transform: `translateY(${lerp(18, 0, easeOut(badge))}px)`,
            background: "rgba(11,14,19,.88)",
            border: "3px solid #3DDC84",
            borderRadius: 18,
            padding: "22px 30px",
            boxShadow: "0 18px 50px rgba(0,0,0,.55)",
          }}
        >
          <div style={{ fontFamily: SUB_FONT, fontSize: 20, fontWeight: 800, color: "#3DDC84", letterSpacing: 3 }}>
            本集结论
          </div>
          <div style={{ fontFamily: SUB_FONT, fontSize: 40, fontWeight: 900, color: "#fff", marginTop: 8 }}>
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
              fontFamily: SUB_FONT,
              fontSize: 46,
              fontWeight: 900,
              color: "#FFD400",
              textShadow: SUB_SHADOW,
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
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Ep03KF" component={Ep} durationInFrames={DUR} fps={FPS} width={VW} height={VH} />
);

registerRoot(Root);
