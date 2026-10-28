import { Config } from '@remotion/cli/config';

// Every frame is a React render -> "jpeg" is faster, "png" is crisper for UI text.
// UI screenshots carry thin text, so we keep lossless PNG intermediates.
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// Reuse the locally installed Chrome instead of downloading Chrome Headless Shell.
// Set FC27_CHROME_EXE to override.
if (process.env.FC27_CHROME_EXE) {
  Config.setBrowserExecutable(process.env.FC27_CHROME_EXE);
}
