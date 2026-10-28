import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { BrowserFrame } from '../components/BrowserFrame';
import { Callout, CalloutDef } from '../components/Callout';
import { CaptionBar } from '../components/CaptionBar';
import { Subtitles } from '../components/Subtitles';
import { VoiceLine } from '../components/VoiceLine';
import { FRAME_CONTENT_HEIGHT, FRAME_TOP, FRAME_WIDTH } from '../theme';

export type LiveShotDef = {
  /** Folder under public/frames/. */
  dir: string;
  /** Ordered frame filenames, produced by scripts/capture-frames.mjs. */
  frames: string[];
  url: string;
  eyebrow: string;
  caption: string;
  /** Frames held on the last captured image, with a slow push. */
  hold: number;
  /** Narration key in src/generated/voice.json. */
  voice?: string;
  callouts: CalloutDef[];
};

export const liveDuration = (shot: LiveShotDef) => shot.frames.length + shot.hold;

/**
 * A feature beat built from a real capture of the running app: every frame is a
 * genuine picture of the UI, so typing, list filtering and page rendering all
 * move on their own. No zoom, no scale: once the capture ends the shot simply
 * holds, so the UI never drifts or breathes on screen.
 */
export const LiveFeatureScene: React.FC<{ shot: LiveShotDef }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const lastIndex = shot.frames.length - 1;
  const index = Math.max(0, Math.min(lastIndex, frame));

  return (
    <AbsoluteFill>
      <Background />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        <div style={{ marginTop: FRAME_TOP }}>
          <BrowserFrame url={shot.url} height={FRAME_CONTENT_HEIGHT}>
            <Img
              src={staticFile(`frames/${shot.dir}/${shot.frames[index]}`)}
              style={{
                width: FRAME_WIDTH,
                height: FRAME_CONTENT_HEIGHT,
                objectFit: 'cover',
              }}
            />
            {shot.callouts.map((callout) => (
              <Callout key={callout.label} {...callout} />
            ))}
          </BrowserFrame>
        </div>
      </AbsoluteFill>

      {shot.voice ? <Subtitles name={shot.voice} hideAfter={12} /> : null}
      <CaptionBar eyebrow={shot.eyebrow} text={shot.caption} />
      {shot.voice ? <VoiceLine name={shot.voice} /> : null}
    </AbsoluteFill>
  );
};
