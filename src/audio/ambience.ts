import type { Theme } from '../stories/types';

export function createAmbience(theme: Theme) {
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
  filter.frequency.value = {
    coast: 450,
    orbit: 120,
    bakery: 200,
    workshop: 100,
  }[theme];
  const gain = context.createGain();
  gain.gain.value = theme === 'workshop' ? 0.009 : 0.035;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
  if (theme === 'orbit') {
    const hum = context.createOscillator();
    hum.frequency.value = 55;
    const volume = context.createGain();
    volume.gain.value = 0.018;
    hum.connect(volume).connect(context.destination);
    hum.start();
  }
  if (theme === 'bakery') {
    const warmth = context.createOscillator();
    warmth.frequency.value = 0.18;
    const variation = context.createGain();
    variation.gain.value = 0.008;
    warmth.connect(variation).connect(gain.gain);
    warmth.start();
  }
  if (theme === 'workshop') {
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
