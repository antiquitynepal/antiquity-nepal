// Procedural Web Audio API soundscape generator for Kathmandu Heritage Audio Guides.
// Zero external audio files (zero 404s); pure synthesis of singing bowls, bronze bells, and mountain breeze.

export type AmbientProfile = 'singing-bowl' | 'temple-bells' | 'river-wind';

class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private chimeTimer: number | null = null;
  private isPlaying = false;
  private currentProfile: AmbientProfile = 'singing-bowl';
  private volume = 0.28;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && this.isPlaying) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.25);
    }
  }

  public start(profile: AmbientProfile) {
    this.stop();
    this.currentProfile = profile;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    this.isPlaying = true;
    this.masterGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.8);

    // Subtle warm Himalayan singing-bowl harmonic bed
    const baseFreq = profile === 'singing-bowl' ? 196 : profile === 'temple-bells' ? 220 : 174.61;
    const partials = [1, 1.5, 2.003, 2.996];

    partials.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = baseFreq * ratio;

      // Gentle slow LFO modulation for organic resonance
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08 + idx * 0.03;
      lfoGain.gain.value = 0.015 / (idx + 1);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.value = 0.055 / (idx + 1);
      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();
      lfo.start();
      this.activeNodes.push(osc, lfo, gain, lfoGain);
    });

    // Filtered pink-ish valley wind layer for river-wind / outdoor terraces
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = profile === 'river-wind' ? 380 : 260;
    filter.Q.value = 1.4;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = profile === 'river-wind' ? 0.14 : 0.05;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, filter, noiseGain);

    // Periodic gentle bronze bell / singing-bowl strike
    const triggerChime = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      this.playSingleChime(this.currentProfile === 'temple-bells' ? 587.33 : 432);
      this.chimeTimer = window.setTimeout(triggerChime, 5200 + Math.random() * 4500);
    };
    this.chimeTimer = window.setTimeout(triggerChime, 1100);
  }

  private playSingleChime(freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const ratios = [1, 2.756, 5.404];
    ratios.forEach((ratio, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * ratio, now);

      const peak = 0.09 / (idx + 1);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6 - idx * 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3.8);
    });
  }

  public stop() {
    this.isPlaying = false;
    if (this.chimeTimer !== null) {
      window.clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    }
    const nodesToClean = [...this.activeNodes];
    this.activeNodes = [];
    window.setTimeout(() => {
      nodesToClean.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
            (node as OscillatorNode).stop();
          }
          node.disconnect();
        } catch {
          // Ignore already stopped nodes
        }
      });
    }, 200);
  }
}

export const ambientAudio = new AmbientSoundscapeEngine();
