import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { BrowserFrame } from '../components/BrowserFrame';
import { Callout, CalloutDef } from '../components/Callout';
import { CaptionBar } from '../components/CaptionBar';
import { FRAME_CONTENT_HEIGHT, FRAME_TOP, FRAME_WIDTH } from '../theme';

export type ShotDef = {
  image: string;
  url: string;
  eyebrow: string;
  caption: string;
  /** Extra zoom applied over the scene, e.g. 0.06 = 6%. */
  zoom?: number;
  /** transform-origin of the zoom, 0..1. */
  origin?: [number, number];
  callouts: CalloutDef[];
  duration: number;
};

/**
 * One feature beat: the real app screenshot inside a browser frame, a slow
 * Ken-Burns push, focus callouts, and a caption. Nothing is pre-composited, so
 * swapping a screenshot re-renders the whole shot.
 */
export const FeatureScene: React.FC<{ shot: ShotDef }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames - 1);

  return (
    <AbsoluteFill>
      <Background />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        <div style={{ marginTop: FRAME_TOP }}>
          <BrowserFrame url={shot.url} height={FRAME_CONTENT_HEIGHT}>
            <Img
              src={staticFile(shot.image)}
              style={{
                width: FRAME_WIDTH,
                height: FRAME_CONTENT_HEIGHT,
                objectFit: 'cover',
              }}
            />
            {shot.callouts.map((callout, index) => (
              <Callout key={callout.label} {...callout} delay={callout.delay ?? 22 + index * 20} />
            ))}
          </BrowserFrame>
        </div>
      </AbsoluteFill>

      <CaptionBar eyebrow={shot.eyebrow} text={shot.caption} />
    </AbsoluteFill>
  );
};
