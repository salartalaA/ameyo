import type { AudioSettings } from './types';

export class RainyNightAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  private settings: AudioSettings = {
    musicVolume: 0.55,
    sfxVolume: 0.72,
    muted: false,
    rainIntensity: 0.85,
  };

  private started = false;
  private chordTimer = 0;
  private chordStep = 0;

  // Warm 2 AM lo-fi minor9 / maj7 voicings in F minor / Ab major
  private readonly chordProgression: number[][] = [
    [174.61, 207.65, 261.63, 311.13, 392.0], // Fm9
    [155.56, 196.0, 233.08, 293.66, 349.23], // Eb6/9
    [138.59, 174.61, 207.65, 261.63, 311.13], // Dbmaj9
    [130.81, 164.81, 196.0, 233.08, 293.66], // C7alt-ish
  ];

  public init(): void {
    if (typeof navigator !== 'undefined' && navigator.webdriver) {
      return;
    }
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.setupRainAmbience();
      this.setupDistantTraffic();
      this.setupMotorcycleEngine();
      this.applySettings();

      this.started = true;
    } catch {
      // Audio unavailable (headless / blocked) — fail silently
    }
  }

  public updateSettings(next: AudioSettings): void {
    this.settings = { ...next };
    this.applySettings();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private applySettings(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.settings.muted ? 0 : 1, now, 0.05);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * 0.45, now, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume * 0.7, now, 0.05);
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(
        0.16 * this.settings.rainIntensity,
        now,
        0.15
      );
    }
  }

  private setupRainAmbience(): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-ish noise for warm natural rainfall
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1450;
    filter.Q.value = 0.55;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.14;

    src.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.sfxGain);
    src.start();
  }

  private setupDistantTraffic(): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 54;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 110;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.025;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
  }

  private setupMotorcycleEngine(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 46;

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.value = 23;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 180;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineSubOsc.start();
  }

  public update(dt: number, riding: boolean, speedRatio: number, paused: boolean): void {
    if (!this.started || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Engine sound updates smoothly
    if (this.engineGain && this.engineOsc && this.engineSubOsc && this.engineFilter) {
      if (!riding || paused) {
        this.engineGain.gain.setTargetAtTime(0, now, 0.08);
      } else {
        const rpmFreq = 46 + speedRatio * 96;
        this.engineOsc.frequency.setTargetAtTime(rpmFreq, now, 0.06);
        this.engineSubOsc.frequency.setTargetAtTime(rpmFreq * 0.5, now, 0.06);
        this.engineFilter.frequency.setTargetAtTime(190 + speedRatio * 420, now, 0.08);
        this.engineGain.gain.setTargetAtTime(0.055 + speedRatio * 0.045, now, 0.06);
      }
    }

    // Gentle lo-fi ambient electric piano chords
    if (!paused && this.settings.musicVolume > 0.01 && !this.settings.muted) {
      this.chordTimer -= dt;
      if (this.chordTimer <= 0) {
        this.chordTimer = 4.2;
        this.playLoFiChord(this.chordProgression[this.chordStep % this.chordProgression.length]);
        this.chordStep++;
      }
    }
  }

  private playLoFiChord(freqs: number[]): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      // Slight warm tape detune
      osc.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 950;

      const gain = this.ctx.createGain();
      const stagger = idx * 0.065;
      gain.gain.setValueAtTime(0.0001, now + stagger);
      gain.gain.linearRampToValueAtTime(0.048, now + stagger + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + stagger + 3.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now + stagger);
      osc.stop(now + stagger + 4.0);
    });
  }

  public playFootstep(running: boolean): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const pitch = (running ? 145 : 118) * (0.92 + Math.random() * 0.16);
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.055);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(running ? 0.06 : 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playThunder(): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.9));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 160;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now + 0.35);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.7);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now + 0.3);
  }

  public playInteractionSound(kind: 'vending' | 'bench' | 'shop' | 'chime' | 'mount'): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;

    if (kind === 'shop') {
      // Classic Konbini 2-tone door chime
      [659.25, 523.25].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.08, now + i * 0.16);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.45);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now + i * 0.16);
        osc.stop(now + i * 0.16 + 0.46);
      });
    } else if (kind === 'vending') {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174, now + 0.08);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (kind === 'mount') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(68, now);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(54, now + 0.32);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  }

  public playGunshot(hit: boolean): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const dur = 0.16;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.045));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = hit ? 2400 : 1800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(hit ? 0.22 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);

    const thump = this.ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(120, now);
    thump.frequency.exponentialRampToValueAtTime(45, now + 0.11);
    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0.16, now);
    tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    thump.connect(tg);
    tg.connect(this.sfxGain);
    thump.start(now);
    thump.stop(now + 0.15);
  }

  public playZombieHit(): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playPlayerHurt(): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playZombieGrowl(): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(72 + Math.random() * 24, now);
    osc.frequency.linearRampToValueAtTime(58 + Math.random() * 16, now + 0.32);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playSurvivalSting(outcome: 'victory' | 'defeat'): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const freqs = outcome === 'victory' ? [523.25, 659.25, 783.99] : [220, 174.61, 146.83];
    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = outcome === 'victory' ? 'triangle' : 'sawtooth';
      osc.frequency.value = freq;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = outcome === 'victory' ? 1800 : 500;
      const gain = this.ctx.createGain();
      const start = now + i * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.09, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (outcome === 'victory' ? 0.8 : 1.1));
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 1.2);
    });
  }

  public playWeaponShot(kind: 'ak47' | 'minigun' | 'bomber'): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;

    if (kind === 'bomber') {
      // Deep launch whoosh
      const dur = 0.5;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (i / bufferSize);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + dur);
      filter.Q.value = 1.2;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(now);
      return;
    }

    // AK-47 / Minigun: sharp crack + click
    const dur = kind === 'minigun' ? 0.06 : 0.1;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'minigun' ? 3400 : 2500;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(kind === 'minigun' ? 0.15 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);

    const click = this.ctx.createOscillator();
    click.type = 'square';
    click.frequency.setValueAtTime(kind === 'minigun' ? 240 : 160, now);
    click.frequency.exponentialRampToValueAtTime(60, now + 0.05);
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.05, now);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    click.connect(cg);
    cg.connect(this.sfxGain);
    click.start(now);
    click.stop(now + 0.07);
  }

  public playExplosion(): void {
    if (!this.started || !this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const dur = 0.7;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.22));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);

    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(70, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.3, now);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    sub.connect(sg);
    sg.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.65);
  }
}
