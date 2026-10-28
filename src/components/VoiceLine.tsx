import React from 'react';
import { Audio, staticFile } from 'remotion';

/**
 * One narration line for a scene. Rendered inside the scene's Sequence, so it
 * starts when that scene starts; the scene is sized long enough for it.
 */
export const VoiceLine: React.FC<{ name: string; volume?: number }> = ({ name, volume = 1 }) => {
  return <Audio src={staticFile(`audio/vo-${name}.wav`)} volume={volume} />;
};
