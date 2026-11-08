export function createTypingAudio() {
  const context = new AudioContext();
  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * 0.025),
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++)
    samples[i] =
      (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.004));
  return {
    resume: () => context.resume(),
    play(backspace: boolean) {
      if (context.state !== 'running') return;
      const click = context.createBufferSource();
      click.buffer = buffer;
      click.playbackRate.value = backspace ? 0.8 : 1 + Math.random() * 0.15;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      const volume = context.createGain();
      volume.gain.value = 0.13;
      click.connect(filter).connect(volume).connect(context.destination);
      click.onended = () => {
        click.disconnect();
        filter.disconnect();
        volume.disconnect();
      };
      click.start();
    },
    close: () => context.close(),
  };
}
