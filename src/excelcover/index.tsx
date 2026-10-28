import React from "react";
import { AbsoluteFill, Composition, Img, registerRoot, staticFile } from "remotion";

const FONT = '"Microsoft YaHei", "微软雅黑", sans-serif';
const Y = "#FFD400";
const GREEN = "#0E6B3B";
const DARKGREEN = "#08301C";

const Bg: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #0a4c2c 0%, ${GREEN} 46%, #0b3b23 100%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(70% 55% at 18% 6%, rgba(255,255,255,.16), rgba(255,255,255,0) 70%)" }} />
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={`v${i}`} style={{ position: "absolute", left: `${(i * 100) / 12}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,.05)" }} />
    ))}
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={`h${i}`} style={{ position: "absolute", top: `${(i * 100) / 9}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,.05)" }} />
    ))}
  </>
);

const Pill: React.FC<{ text: string; size?: number }> = ({ text, size = 26 }) => (
  <div
    style={{
      display: "inline-flex",
      background: "#fff",
      color: DARKGREEN,
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: 1,
      padding: `${size * 0.35}px ${size * 0.85}px`,
      borderRadius: 999,
      boxShadow: "0 10px 24px rgba(0,0,0,.28)",
    }}
  >
    {text}
  </div>
);

const StepsInline: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.5, fontFamily: FONT, fontWeight: 800, fontSize: size, color: "#dff0e6" }}>
    {["选中数据", "插入迷你图", "往下一拖"].map((t, i) => (
      <React.Fragment key={t}>
        <span
          style={{
            width: size * 1.25,
            height: size * 1.25,
            borderRadius: size,
            background: Y,
            color: DARKGREEN,
            fontSize: size * 0.8,
            fontWeight: 900,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {i + 1}
        </span>
        {t}
        {i < 2 ? <span style={{ opacity: 0.5 }}>→</span> : null}
      </React.Fragment>
    ))}
  </div>
);

const TableCard: React.FC<{ w: number; rotate?: number }> = ({ w, rotate = -1.5 }) => (
  <div
    style={{
      width: w,
      borderRadius: 16,
      background: "#fff",
      padding: 9,
      boxShadow: "0 48px 110px rgba(0,0,0,.5)",
      transform: `rotate(${rotate}deg)`,
    }}
  >
    <Img src={staticFile("cover/table.png")} style={{ width: "100%", display: "block", borderRadius: 9 }} />
  </div>
);

const Legend: React.FC<{ center?: boolean; size?: number }> = ({ center, size = 24 }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", gap: size * 0.7 }}>
    {[
      { c: "#E03131", t: "红点 = 最高" },
      { c: "#00B0F0", t: "蓝点 = 最低" },
    ].map((x) => (
      <div key={x.t} style={{ display: "flex", alignItems: "center", gap: size * 0.35, fontFamily: FONT, fontWeight: 800, fontSize: size, color: "#dff0e6" }}>
        <span style={{ width: size * 0.55, height: size * 0.55, borderRadius: size, background: x.c, display: "inline-block" }} />
        {x.t}
      </div>
    ))}
  </div>
);

const Landscape: React.FC = () => (
  <AbsoluteFill>
    <Bg />
    <div style={{ position: "absolute", left: 76, top: 62 }}>
      <Pill text="EP03 · EXCEL 技巧" />
    </div>

    <div style={{ position: "absolute", left: 72, top: 160, width: 760 }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 128, lineHeight: 1.04, color: "#fff", letterSpacing: 2 }}>
        一个<span style={{ color: Y }}>格子</span>
        <br />
        看清一周
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 22 }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 42, color: Y }}>迷你图</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: "#cfe6d8" }}>· 3 步搞定</div>
      </div>

    </div>

    {/* 真实截图：整张表含「趋势」列完整可见 */}
    <div style={{ position: "absolute", right: 54, top: 452 }}>
      <TableCard w={1090} />
    </div>

    <div style={{ position: "absolute", left: 76, bottom: 196 }}>
      <StepsInline size={25} />
    </div>

    <div style={{ position: "absolute", left: 76, bottom: 86 }}>
      <div
        style={{
          background: "#F6D34A",
          color: DARKGREEN,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 38,
          padding: "13px 22px",
          borderRadius: 12,
          boxShadow: "0 16px 40px rgba(0,0,0,.35)",
        }}
      >
        周末客流 ≈ 工作日 1.8 倍
      </div>
    </div>
    <div style={{ position: "absolute", right: 60, bottom: 88, textAlign: "right" }}>
      <Legend />
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: "#a9c9b6", marginTop: 10 }}>30 秒 · 纯录屏 · 六家门店</div>
    </div>
  </AbsoluteFill>
);

const Portrait: React.FC = () => (
  <AbsoluteFill>
    <Bg />
    <div style={{ position: "absolute", left: 0, right: 0, top: 92, display: "flex", justifyContent: "center" }}>
      <Pill text="EP03 · EXCEL 技巧" />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 136, lineHeight: 1.06, color: "#fff", letterSpacing: 2 }}>
        一个<span style={{ color: Y }}>格子</span>
        <br />
        看清一周
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 12, marginTop: 20 }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: Y }}>迷你图</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: "#cfe6d8" }}>· 3 步搞定</div>
      </div>
    </div>

    <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center" }}>
      <TableCard w={1150} rotate={-2} />
    </div>

    <div style={{ position: "absolute", left: 0, right: 0, bottom: 368, display: "flex", justifyContent: "center" }}>
      <StepsInline size={24} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 226, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: "#F6D34A",
          color: DARKGREEN,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 44,
          padding: "16px 28px",
          borderRadius: 12,
          boxShadow: "0 16px 40px rgba(0,0,0,.35)",
        }}
      >
        周末客流 ≈ 工作日 1.8 倍
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 118, display: "flex", justifyContent: "center" }}>
      <Legend center size={24} />
    </div>
  </AbsoluteFill>
);

const Root: React.FC = () => (
  <>
    <Composition id="CoverW" component={Landscape} durationInFrames={1} fps={30} width={1600} height={1200} />
    <Composition id="CoverH" component={Portrait} durationInFrames={1} fps={30} width={1200} height={1600} />
  </>
);

registerRoot(Root);
