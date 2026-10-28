import React from "react";
import { AbsoluteFill, Composition, Img, registerRoot, staticFile } from "remotion";

const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const Y = "#FFD400";
const GREEN = "#0E6B3B";
const DARK = "#08301C";
const T1 = "3 步学会迷你图";
const T2 = "一个格子看清一周趋势";

const BgGreen: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #0a4c2c 0%, ${GREEN} 46%, #0b3b23 100%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(70% 55% at 18% 6%, rgba(255,255,255,.15), rgba(255,255,255,0) 70%)" }} />
  </>
);
const BgLight: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #F7FAF8 0%, #E8EFEA 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(60% 50% at 80% 10%, rgba(14,107,59,.10), rgba(255,255,255,0) 70%)" }} />
  </>
);

const Pill: React.FC<{ light?: boolean; size?: number }> = ({ light, size = 26 }) => (
  <div
    style={{
      display: "inline-flex",
      background: light ? GREEN : "#fff",
      color: light ? "#fff" : DARK,
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: 1,
      padding: `${size * 0.35}px ${size * 0.85}px`,
      borderRadius: 999,
      boxShadow: "0 10px 24px rgba(0,0,0,.22)",
    }}
  >
    每天一个 Excel 小技巧
  </div>
);

const Card: React.FC<{ w: number; rotate?: number; src?: string; light?: boolean }> = ({ w, rotate = 0, src = "cover/table.png", light }) => (
  <div
    style={{
      width: w,
      borderRadius: 16,
      background: "#fff",
      padding: 9,
      boxShadow: light ? "0 24px 60px rgba(8,48,28,.22)" : "0 44px 100px rgba(0,0,0,.5)",
      transform: `rotate(${rotate}deg)`,
    }}
  >
    <Img src={staticFile(src)} style={{ width: "100%", display: "block", borderRadius: 9 }} />
  </div>
);

const Legend: React.FC<{ light?: boolean; size?: number; center?: boolean }> = ({ light, size = 23, center }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", gap: size * 0.7 }}>
    {[
      { c: "#E03131", t: "红点 = 最高" },
      { c: "#00B0F0", t: "蓝点 = 最低" },
    ].map((x) => (
      <div
        key={x.t}
        style={{
          display: "flex",
          alignItems: "center",
          gap: size * 0.35,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: size,
          color: light ? "#3c5a49" : "#dff0e6",
        }}
      >
        <span style={{ width: size * 0.55, height: size * 0.55, borderRadius: size, background: x.c, display: "inline-block" }} />
        {x.t}
      </div>
    ))}
  </div>
);

const Steps: React.FC<{ size?: number; light?: boolean }> = ({ size = 25, light }) => {
  const items = ["选中数据", "插入迷你图", "往下一拖"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.45 }}>
      {items.map((t, i) => (
        <React.Fragment key={t}>
          <span
            style={{
              width: size * 1.3,
              height: size * 1.3,
              borderRadius: size,
              background: Y,
              color: DARK,
              fontSize: size * 0.8,
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT,
            }}
          >
            {i + 1}
          </span>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, color: light ? "#25402f" : "#dff0e6" }}>{t}</span>
          {i < 2 ? <span style={{ color: light ? "#8aa899" : "#8fb9a2", fontSize: size }}>→</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
};

const Badge: React.FC<{ text?: string; size?: number }> = ({ text = "周末客流 ≈ 工作日 1.8 倍", size = 38 }) => (
  <div
    style={{
      background: "#F6D34A",
      color: DARK,
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      padding: `${size * 0.34}px ${size * 0.58}px`,
      borderRadius: 12,
      boxShadow: "0 16px 40px rgba(0,0,0,.3)",
      display: "inline-block",
    }}
  >
    {text}
  </div>
);

const TitleBig: React.FC<{ size: number; light?: boolean; block?: boolean }> = ({ size, light, block }) => (
  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.04, color: light ? "#0d2a1b" : "#fff", letterSpacing: 2 }}>
    {block ? (
      <>
        3 步学会
        <br />
        <span style={{ color: light ? GREEN : Y }}>迷你图</span>
      </>
    ) : (
      <>
        3 步学会<span style={{ color: light ? GREEN : Y }}>迷你图</span>
      </>
    )}
  </div>
);

/* ---------------- V1 截图为主 ---------------- */
const V1: React.FC = () => (
  <AbsoluteFill>
    <BgGreen />
    <div style={{ position: "absolute", left: 76, top: 62 }}>
      <Pill />
    </div>
    <div style={{ position: "absolute", left: 72, top: 168, width: 800 }}>
      <TitleBig size={124} block />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#cfe6d8", marginTop: 24 }}>{T2}</div>
      <div style={{ marginTop: 30 }}>
        <Steps />
      </div>
    </div>
    <div style={{ position: "absolute", right: 46, top: 470 }}>
      <Card w={1090} rotate={-1.5} />
    </div>
    <div style={{ position: "absolute", left: 76, bottom: 84 }}>
      <Badge />
    </div>
    <div style={{ position: "absolute", right: 60, bottom: 88, textAlign: "right" }}>
      <Legend />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: "#a9c9b6", marginTop: 10 }}>30 秒 · 纯录屏 · 六家门店</div>
    </div>
  </AbsoluteFill>
);

/* ---------------- V2 对比：大图表 vs 迷你图 ---------------- */
const BigChart: React.FC = () => (
  <div style={{ width: 560, height: 380, background: "#fff", borderRadius: 14, boxShadow: "0 30px 70px rgba(0,0,0,.4)", position: "relative", padding: 18, boxSizing: "border-box" }}>
    <svg width="524" height="270" style={{ marginTop: 8 }}>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={0} y1={40 + i * 62} x2={524} y2={40 + i * 62} stroke="#e6ebf1" strokeWidth={2} />
      ))}
      <polyline
        points="10,190 90,168 170,176 250,150 330,110 410,58 500,34"
        fill="none"
        stroke="#4472C4"
        strokeWidth={6}
        strokeLinejoin="round"
      />
    </svg>
    <div style={{ position: "absolute", right: 14, bottom: 12, fontFamily: FONT, fontSize: 20, fontWeight: 800, color: "#9aa7b6" }}>普通图表</div>
    <div style={{ position: "absolute", left: -26, top: -26, right: -26, bottom: -26, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="rgba(224,49,49,.14)" stroke="#E03131" strokeWidth="6" />
        <line x1="28" y1="28" x2="92" y2="92" stroke="#E03131" strokeWidth="10" strokeLinecap="round" />
        <line x1="92" y1="28" x2="28" y2="92" stroke="#E03131" strokeWidth="10" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

const V2: React.FC = () => (
  <AbsoluteFill>
    <BgGreen />
    <div style={{ position: "absolute", left: 76, top: 62 }}>
      <Pill />
    </div>
    <div style={{ position: "absolute", left: 72, top: 160, width: 820 }}>
      <TitleBig size={118} block />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 33, color: "#cfe6d8", marginTop: 22 }}>{T2}</div>
    </div>
    <div style={{ position: "absolute", left: 96, top: 566 }}>
      <BigChart />
    </div>
    <div style={{ position: "absolute", right: 70, top: 560 }}>
      <Card w={700} rotate={-1.5} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <div style={{ background: Y, color: DARK, fontFamily: FONT, fontWeight: 900, fontSize: 26, padding: "8px 18px", borderRadius: 10 }}>
          换成迷你图
        </div>
      </div>
    </div>
    <div style={{ position: "absolute", left: 76, bottom: 82 }}>
      <Badge size={34} />
    </div>
  </AbsoluteFill>
);

/* ---------------- V3 曲线穿字 ---------------- */
const V3: React.FC = () => (
  <AbsoluteFill>
    <BgGreen />
    <div style={{ position: "absolute", left: 0, right: 0, top: 74, display: "flex", justifyContent: "center" }}>
      <Pill />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, lineHeight: 1.05, color: "#fff", letterSpacing: 3 }}>
        3 步学会
        <span style={{ color: Y, position: "relative" }}>迷你图</span>
      </div>
      {/* 曲线穿过标题 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <svg width="1180" height="260">
          <polyline
            points="20,200 180,150 330,176 470,120 610,150 760,70 900,96 1070,34"
            fill="none"
            stroke="#7CE0A8"
            strokeWidth={7}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.9}
          />
          <circle cx="1070" cy="34" r="11" fill="#E03131" />
          <circle cx="20" cy="200" r="9" fill="#00B0F0" />
        </svg>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#cfe6d8", marginTop: 150 }}>{T2}</div>
    </div>
    <div style={{ position: "absolute", left: 350, top: 592 }}>
      <Card w={900} rotate={0} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 158, display: "flex", justifyContent: "center" }}>
      <Steps size={26} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center" }}>
      <Badge size={32} />
    </div>
  </AbsoluteFill>
);

/* ---------------- V4 浅色极简 ---------------- */
const V4: React.FC = () => (
  <AbsoluteFill>
    <BgLight />
    <div style={{ position: "absolute", left: 76, top: 62 }}>
      <Pill light />
    </div>
    <div style={{ position: "absolute", left: 72, top: 172, width: 900 }}>
      <TitleBig size={122} light block />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#3c5a49", marginTop: 24 }}>{T2}</div>
    </div>
    <div style={{ position: "absolute", left: 76, bottom: 190 }}>
      <Steps light />
    </div>
    <div style={{ position: "absolute", left: 76, bottom: 84 }}>
      <Badge size={34} />
    </div>
    <div style={{ position: "absolute", right: 44, top: 360 }}>
      <Card w={960} rotate={-1} light />
    </div>
    <div style={{ position: "absolute", right: 70, bottom: 74, textAlign: "right" }}>
      <Legend light />
    </div>
  </AbsoluteFill>
);

/* ---------------- V4P 浅色极简·纵向 3:4 ---------------- */
const V4P: React.FC = () => (
  <AbsoluteFill>
    <BgLight />
    <div style={{ position: "absolute", left: 0, right: 0, top: 92, display: "flex", justifyContent: "center" }}>
      <Pill light size={24} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 208, textAlign: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 130, lineHeight: 1.05, color: "#0d2a1b", letterSpacing: 2 }}>
        3 步学会
        <br />
        <span style={{ color: GREEN }}>迷你图</span>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: "#3c5a49", marginTop: 26 }}>{T2}</div>
    </div>

    <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center" }}>
      <Card w={1060} rotate={-1} light />
    </div>

    <div style={{ position: "absolute", left: 0, right: 0, bottom: 322, display: "flex", justifyContent: "center" }}>
      <Steps light size={24} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 210, display: "flex", justifyContent: "center" }}>
      <Badge size={40} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 118, display: "flex", justifyContent: "center" }}>
      <Legend light center size={22} />
    </div>
  </AbsoluteFill>
);

/* ---------------- V5 三卡流程 ---------------- */
const StepCard: React.FC<{ n: string; label: string; src: string; w: number }> = ({ n, label, src, w }) => (
  <div style={{ width: w }}>
    <div style={{ background: "#1f1f1f", borderRadius: 10, padding: 8, height: 300, overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block", borderRadius: 6 }} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 34,
          background: Y,
          color: DARK,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 20,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </span>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 25, color: "#dff0e6" }}>{label}</span>
    </div>
  </div>
);

const V5: React.FC = () => (
  <AbsoluteFill>
    <BgGreen />
    <div style={{ position: "absolute", left: 76, top: 62 }}>
      <Pill />
    </div>
    <div style={{ position: "absolute", left: 72, top: 160 }}>
      <TitleBig size={112} />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: "#cfe6d8", marginTop: 18 }}>{T2}</div>
    </div>
    <div style={{ position: "absolute", left: 76, top: 470, display: "flex", gap: 26 }}>
      <StepCard n="1" label="选中数据" src="cover/table.png" w={470} />
      <StepCard n="2" label="创建迷你图" src="kf3/k04-dialog-filled.png" w={470} />
      <StepCard n="3" label="下拉 + 高低点" src="cover/table.png" w={470} />
    </div>
    <div style={{ position: "absolute", left: 76, bottom: 76 }}>
      <Badge size={32} />
    </div>
    <div style={{ position: "absolute", right: 62, bottom: 84, textAlign: "right" }}>
      <Legend />
    </div>
  </AbsoluteFill>
);

const Root: React.FC = () => (
  <>
    <Composition id="V1" component={V1} durationInFrames={1} fps={30} width={1600} height={1200} />
    <Composition id="V2" component={V2} durationInFrames={1} fps={30} width={1600} height={1200} />
    <Composition id="V3" component={V3} durationInFrames={1} fps={30} width={1600} height={1200} />
    <Composition id="V4" component={V4} durationInFrames={1} fps={30} width={1600} height={1200} />
    <Composition id="V5" component={V5} durationInFrames={1} fps={30} width={1600} height={1200} />
    <Composition id="V4P" component={V4P} durationInFrames={1} fps={30} width={1200} height={1600} />
  </>
);

registerRoot(Root);
