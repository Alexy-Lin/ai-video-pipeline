export const COLORS = {
  bg0: '#050f0b',
  bg1: '#0a2018',
  bg2: '#123a28',
  accent: '#3ddc84',
  accentDim: '#1f8f57',
  gold: '#f5c542',
  text: '#f2f7f4',
  muted: '#9db3a8',
  frame: '#0c1512',
  frameBar: '#16211c',
} as const;

export const FONT =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", system-ui, sans-serif';

/** Frame geometry, shared so callouts can be positioned against the screenshot. */
export const FRAME_WIDTH = 1480;
export const FRAME_CONTENT_HEIGHT = Math.round((FRAME_WIDTH * 9) / 16); // 833
export const FRAME_BAR_HEIGHT = 46;
export const FRAME_TOP = 42;
