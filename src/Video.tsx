import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { LiveFeatureScene, LiveShotDef, liveDuration } from './scenes/LiveFeatureScene';
import { Intro } from './scenes/Intro';
import { Problem } from './scenes/Problem';
import { Safety } from './scenes/Safety';
import { Outro } from './scenes/Outro';
import playerFrames from './generated/playerFrames.json';
import teamsFrames from './generated/teamsFrames.json';
import transfersFrames from './generated/transfersFrames.json';
import nationalFrames from './generated/nationalFrames.json';
import quickFrames from './generated/quickFrames.json';
import voiceData from './generated/voice.json';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** 6 frames = 0.2s: crisp cut-ish transition, no long dissolve. */
export const TRANSITION_FRAMES = 6;

const URL = '127.0.0.1:8765';

type VoiceLineData = { seconds: number; frames: number; text: string };
const VOICE = voiceData as { fps: number; lines: Record<string, VoiceLineData> };

/** A scene must last at least as long as its narration plus a little air. */
export const withVoice = (baseFrames: number, key: string, pad = 12): number => {
  const line = VOICE.lines[key];
  if (!line) return baseFrames;
  return Math.max(baseFrames, line.frames + pad);
};

/**
 * Every feature beat plays a real capture of the running app; `hold` is the
 * settle time on the last frame afterwards. Callout `delay`/`until` are frames
 * within the shot, so they have to track when the capture does something.
 */
export const SHOTS: LiveShotDef[] = [
  {
    dir: 'player',
    frames: playerFrames.frames,
    url: `${URL} · 球员编辑`,
    eyebrow: '01 · 球员编辑',
    caption: '搜索球员，直接改能力值和位置',
    hold: 70,
    voice: 'player',
    callouts: [
      { x: 0.3, y: 0.262, label: '输入名字或球员 ID', sub: '中英文都行', delay: 18, until: 70 },
      { x: 0.3, y: 0.6, label: '点开就是完整资料', sub: '总评 · 球队 · 能力值', delay: 88, until: 155 },
    ],
  },
  {
    dir: 'teams',
    frames: teamsFrames.frames,
    url: `${URL} · 球队编辑`,
    eyebrow: '02 · 球队编辑',
    caption: '查看阵容，批量改球衣号码',
    hold: 70,
    voice: 'teams',
    callouts: [
      { x: 0.15, y: 0.238, label: '搜球队', sub: '中英文 / ID', delay: 16, until: 72 },
      { x: 0.55, y: 0.32, label: '阵容一览', sub: '号码可直接改', delay: 78 },
    ],
  },
  {
    dir: 'transfers',
    frames: transfersFrames.frames,
    url: `${URL} · 快捷转会`,
    eyebrow: '03 · 快捷转会',
    caption: '选两支球队，点一下就完成转会',
    hold: 70,
    voice: 'transfers',
    callouts: [
      { x: 0.2, y: 0.235, label: '选来源球队', delay: 16, until: 74 },
      { x: 0.72, y: 0.235, label: '选目标球队', sub: '含自由球员', delay: 80, until: 138 },
      { x: 0.5, y: 0.62, label: '点一下完成转会', delay: 144 },
    ],
  },
  {
    dir: 'national',
    frames: nationalFrames.frames,
    url: `${URL} · 国家队选拔`,
    eyebrow: '04 · 国家队选拔',
    caption: '按国籍筛选候选人，26 / 23 人自动补满',
    hold: 70,
    voice: 'national',
    callouts: [
      { x: 0.2, y: 0.135, label: '选国家队', sub: '男足 / 女足', delay: 14, until: 50 },
      { x: 0.3, y: 0.14, label: '自动补满名单', sub: '男足 26 · 女足 23', delay: 54 },
    ],
  },
  {
    dir: 'quick',
    frames: quickFrames.frames,
    url: `${URL} · 快捷功能`,
    eyebrow: '05 · 快捷功能',
    caption: '四个批量操作，一次改完整队存档',
    hold: 70,
    voice: 'quick',
    callouts: [
      { x: 0.25, y: 0.36, label: '查看名单', delay: 16, until: 62 },
      { x: 0.36, y: 0.28, label: '先预览，再应用', sub: '不会直接改存档', delay: 68 },
    ],
  },
];

const TEXT_DURATIONS = {
  intro: withVoice(150, 'intro'),
  problem: withVoice(180, 'problem'),
  safety: withVoice(150, 'safety'),
  outro: withVoice(150, 'outro'),
};

const SHOT_DURATIONS = SHOTS.map((shot) => withVoice(liveDuration(shot), shot.dir));

const SEQUENCE_TOTAL =
  TEXT_DURATIONS.intro +
  TEXT_DURATIONS.problem +
  SHOT_DURATIONS.reduce((sum, n) => sum + n, 0) +
  TEXT_DURATIONS.safety +
  TEXT_DURATIONS.outro;

const TRANSITION_COUNT = SHOTS.length + 3;

export const TOTAL_FRAMES = SEQUENCE_TOTAL - TRANSITION_COUNT * TRANSITION_FRAMES;

const timing = linearTiming({ durationInFrames: TRANSITION_FRAMES });

/** The first feature beat on its own, handy for previewing a single scene. */
export const PlayerLiveScene: React.FC = () => <LiveFeatureScene shot={SHOTS[0]} />;

export const FC27Intro: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050f0b' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TEXT_DURATIONS.intro}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={TEXT_DURATIONS.problem}>
          <Problem />
        </TransitionSeries.Sequence>

        {SHOTS.map((shot, index) => (
          <React.Fragment key={shot.dir}>
            <TransitionSeries.Transition presentation={fade()} timing={timing} />
            <TransitionSeries.Sequence durationInFrames={SHOT_DURATIONS[index]}>
              <LiveFeatureScene shot={shot} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}

        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={TEXT_DURATIONS.safety}>
          <Safety />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={TEXT_DURATIONS.outro}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
