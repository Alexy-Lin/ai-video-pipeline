import React from 'react';
import { Composition } from 'remotion';
import {
  FC27Intro,
  FPS,
  HEIGHT,
  PlayerLiveScene,
  SHOTS,
  TOTAL_FRAMES,
  WIDTH,
} from './Video';
import { liveDuration } from './scenes/LiveFeatureScene';
import { Cover } from './scenes/Cover';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FC27Intro"
        component={FC27Intro}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/* Single-scene preview: the first feature beat, real captured motion. */}
      <Composition
        id="PlayerLive"
        component={PlayerLiveScene}
        durationInFrames={liveDuration(SHOTS[0])}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/* Thumbnails for the upload platform. */}
      <Composition
        id="Cover16x9"
        component={Cover}
        durationInFrames={30}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ layout: '16x9' as const }}
      />
      <Composition
        id="Cover4x3"
        component={Cover}
        durationInFrames={30}
        fps={FPS}
        width={1600}
        height={1200}
        defaultProps={{ layout: '4x3' as const }}
      />
    </>
  );
};
