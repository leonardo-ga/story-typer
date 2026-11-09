import type { Theme } from '../stories/types';
import { getTheme } from '../stories/themes';

export function createAmbience(theme: Theme) {
  const { frequency, gain: level, texture } = getTheme(theme).ambience;
  const context = new AudioContext();
  const buffer = context.createBuffer(
    1,
    context.sampleRate * 3,
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  const gain = context.createGain();
  gain.gain.value = level;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
  if (texture === 'wind' || texture === 'paper' || texture === 'train') {
    const movement = context.createOscillator();
    movement.frequency.value = texture === 'train' ? 3.2 : 0.09;
    const depth = context.createGain();
    depth.gain.value = level * (texture === 'train' ? 0.45 : 0.2);
    movement.connect(depth).connect(gain.gain);
    movement.start();
    if (texture === 'train') {
      const motor = context.createOscillator();
      motor.frequency.value = 72;
      const volume = context.createGain();
      volume.gain.value = 0.007;
      motor.connect(volume).connect(context.destination);
      motor.start();
    }
  }
  if (texture === 'hum') {
    const hum = context.createOscillator();
    hum.frequency.value = 55;
    const volume = context.createGain();
    volume.gain.value = 0.018;
    hum.connect(volume).connect(context.destination);
    hum.start();
  }
  if (texture === 'warmth') {
    const warmth = context.createOscillator();
    warmth.frequency.value = 0.18;
    const variation = context.createGain();
    variation.gain.value = 0.008;
    warmth.connect(variation).connect(gain.gain);
    warmth.start();
  }
  if (texture === 'clock') {
    const ticks = context.createBuffer(
      1,
      context.sampleRate * 2,
      context.sampleRate,
    );
    const data = ticks.getChannelData(0);
    for (let beat = 0; beat < 2; beat++) {
      for (let i = 0; i < context.sampleRate * 0.025; i++) {
        const time = i / context.sampleRate;
        data[beat * context.sampleRate + i] =
          Math.sin(time * Math.PI * 2 * (beat ? 850 : 1100)) *
          Math.exp(-time * 250);
      }
    }
    const clock = context.createBufferSource();
    clock.buffer = ticks;
    clock.loop = true;
    const volume = context.createGain();
    volume.gain.value = 0.025;
    clock.connect(volume).connect(context.destination);
    clock.start();
  }
  return context;
}
