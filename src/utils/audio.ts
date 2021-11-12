import type Phaser from "phaser";

export const getAudioConfig = (
  volume: number,
  loop: boolean = true
): Phaser.Types.Sound.SoundConfig => ({
  mute: false,
  volume,
  rate: 1,
  detune: 0,
  loop,
});
