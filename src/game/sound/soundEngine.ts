/**
 * Procedural Web Audio Sound Engine for Tokyo Horizon
 * Zero external MP3 files - 100% procedural synthesized audio
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  // Engine audio nodes
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private distortion: WaveShaperNode | null = null;

  // Turbo & BOV
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Tire squeal
  private skidNoiseNode: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;

  // Wind rush
  private windGain: GainNode | null = null;

  // Rain & thunder
  private rainGain: GainNode | null = null;

  // Radio synthesizer
  private radioGain: GainNode | null = null;
  private radioTimer: number | null = null;
  private radioStep: number = 0;
  private radioStation: 'eurobeat' | 'synthwave' | 'rainy_lofi' | 'off' = 'eurobeat';

  // State cache
  private prevThrottle: number = 0;
  private currentEngineType: string = 'w16';

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSynth();
      this.setupTurboAndBov();
      this.setupTireSkidSynth();
      this.setupWindSynth();
      this.setupRainSynth();
      this.setupRadio();

      this.initialized = true;
    } catch {
      // AudioContext unavailable
    }
  }

  private makeDistortionCurve(amount: number = 20): Float32Array<ArrayBuffer> {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const buffer = new ArrayBuffer(nSamples * 4);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.masterGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.distortion = this.ctx.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(18);
    this.distortion.oversample = '2x';

    // Multi-cylinder harmonic oscillators
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(27.5, this.ctx.currentTime);

    this.osc1.connect(this.distortion);
    this.osc2.connect(this.distortion);
    this.subOsc.connect(this.distortion);

    this.distortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
    this.subOsc.start();
  }

  private setupTurboAndBov() {
    if (!this.ctx || !this.masterGain) return;

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);
    this.turboOsc.start();
  }

  private setupTireSkidSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.skidNoiseNode = this.ctx.createBufferSource();
    this.skidNoiseNode.buffer = noiseBuffer;
    this.skidNoiseNode.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.skidFilter.Q.setValueAtTime(4, this.ctx.currentTime);

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.skidNoiseNode.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.masterGain);
    this.skidNoiseNode.start();
  }

  private setupWindSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windSource.start();
  }

  private setupRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rainSource.start();
  }

  public setEngineType(type: string) {
    this.currentEngineType = type;
  }

  public update(telemetry: {
    rpm: number;
    maxRpm: number;
    throttle: number;
    speedKmh: number;
    slipAngle: number;
    isDrifting: boolean;
    isNitro: boolean;
    isRaining: boolean;
  }) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const rpmNorm = Math.min(Math.max(telemetry.rpm / telemetry.maxRpm, 0.1), 1.0);

    // Multi-cylinder base frequency calibration
    let basePitch = 40;
    if (this.currentEngineType === 'w16') {
      basePitch = 38; // Bugatti W16 deep low displacement rumble
    } else if (this.currentEngineType === 'rb26') {
      basePitch = 50; // Skyline twin-cam inline 6 metallic howl
    } else if (this.currentEngineType === 'flat6') {
      basePitch = 56; // Porsche high-rev 9000 RPM scream
    } else if (this.currentEngineType === 'v8twin') {
      basePitch = 45; // Koenigsegg flat-plane V8
    } else {
      basePitch = 52; // V12
    }

    const fundamental = basePitch + rpmNorm * (basePitch * 5.2);

    if (this.osc1 && this.osc2 && this.subOsc) {
      this.osc1.frequency.setTargetAtTime(fundamental, now, 0.04);
      this.osc2.frequency.setTargetAtTime(fundamental * 2, now, 0.04);
      this.subOsc.frequency.setTargetAtTime(fundamental * 0.5, now, 0.04);
    }

    if (this.engineFilter) {
      const cutoff = 400 + rpmNorm * 3200 + (telemetry.throttle > 0.5 ? 800 : 0);
      this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.05);
    }

    if (this.engineGain) {
      const loadVolume = 0.18 + telemetry.throttle * 0.16 + rpmNorm * 0.14 + (telemetry.isNitro ? 0.1 : 0);
      this.engineGain.gain.setTargetAtTime(loadVolume, now, 0.04);
    }

    // Turbo spool
    if (this.turboGain && this.turboOsc) {
      const turboWhistle = telemetry.throttle * rpmNorm * 0.12;
      const turboFreq = 1600 + rpmNorm * 3800;
      this.turboGain.gain.setTargetAtTime(turboWhistle, now, 0.08);
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.08);
    }

    // Blow-off valve (BOV) flutter on rapid throttle release
    if (this.prevThrottle > 0.6 && telemetry.throttle < 0.2 && rpmNorm > 0.45) {
      this.triggerBOV();
    }
    this.prevThrottle = telemetry.throttle;

    // Tire squeal / drift skid sound
    if (this.skidGain && this.skidFilter) {
      const slipMagnitude = Math.abs(telemetry.slipAngle);
      let skidVol = 0;
      if (slipMagnitude > 0.15 && telemetry.speedKmh > 20) {
        skidVol = Math.min((slipMagnitude - 0.15) * 1.5, 0.4);
      }
      this.skidGain.gain.setTargetAtTime(skidVol, now, 0.06);
      this.skidFilter.frequency.setTargetAtTime(1000 + slipMagnitude * 1200, now, 0.05);
    }

    // High speed wind sound
    if (this.windGain) {
      const speedNorm = Math.min(telemetry.speedKmh / 450, 1.0);
      const windVol = speedNorm > 0.1 ? Math.pow(speedNorm, 1.8) * 0.25 : 0;
      this.windGain.gain.setTargetAtTime(windVol, now, 0.1);
    }

    // Rain ambient audio
    if (this.rainGain) {
      const rainVol = telemetry.isRaining ? 0.12 : 0;
      this.rainGain.gain.setTargetAtTime(rainVol, now, 0.3);
    }
  }

  // Blow-off valve sound effect
  public triggerBOV() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Filtered noise burst with sequential flutter pulses
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.55);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const bovSource = this.ctx.createBufferSource();
    bovSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(3.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    // Rapid flutter decay (tsuu-tsuu-tsuu)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    bovSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    bovSource.start(now);
    bovSource.stop(now + 0.55);
  }

  // Exhaust pop & backfire crackle
  public triggerExhaustPop() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const popOsc = this.ctx.createOscillator();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(130, now);
    popOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.4, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    popOsc.connect(popGain);
    popGain.connect(this.masterGain);

    popOsc.start(now);
    popOsc.stop(now + 0.1);
  }

  // Speed trap radar chime
  public triggerSpeedCameraChime() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const chime = this.ctx.createOscillator();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(880, now);
    chime.frequency.setValueAtTime(1760, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    chime.connect(gain);
    gain.connect(this.masterGain);

    chime.start(now);
    chime.stop(now + 0.4);
  }

  // Nitro boost whoosh
  public triggerNitroStart() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Crash impact crunch
  public triggerCrash() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Thunder rumbler for storms
  public triggerThunder() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 2.2);
    const noise = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.8));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + 2.2);
  }

  // Procedural J-Wave / Eurobeat / Lo-Fi Radio Synthesizer
  private setupRadio() {
    if (!this.ctx || !this.masterGain) return;

    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.radioGain.connect(this.masterGain);

    this.startRadioSequence();
  }

  private startRadioSequence() {
    if (this.radioTimer) clearInterval(this.radioTimer);

    // 130 BPM = 115ms per 16th note step
    const intervalMs = 120;
    const eurobeatBassNotes = [110, 110, 130.8, 110, 98, 98, 110, 123.5, 146.8, 146.8, 130.8, 110, 98, 110, 130.8, 164.8];
    const synthLeadNotes = [440, 523.2, 659.2, 587.3, 440, 523.2, 783.9, 659.2];

    this.radioTimer = window.setInterval(() => {
      if (!this.ctx || !this.radioGain || this.isMuted || this.radioStation === 'off') return;

      const now = this.ctx.currentTime;
      const step = this.radioStep % 16;
      this.radioStep++;

      if (this.radioStation === 'eurobeat') {
        // Punchy Eurobeat synth bass
        const bassFreq = eurobeatBassNotes[step];
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq * 0.5, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.1);

        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.12, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.radioGain);

        osc.start(now);
        osc.stop(now + 0.11);

        // Hi-hat pulse on every off-beat
        if (step % 2 === 1) {
          this.triggerHiHat(now);
        }

        // Arpeggiated melody note
        if (step % 4 === 0) {
          const leadFreq = synthLeadNotes[(step / 4) % synthLeadNotes.length];
          const leadOsc = this.ctx.createOscillator();
          leadOsc.type = 'square';
          leadOsc.frequency.setValueAtTime(leadFreq, now);

          const leadFilter = this.ctx.createBiquadFilter();
          leadFilter.type = 'lowpass';
          leadFilter.frequency.setValueAtTime(1400, now);

          const leadGain = this.ctx.createGain();
          leadGain.gain.setValueAtTime(0.05, now);
          leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          leadOsc.connect(leadFilter);
          leadFilter.connect(leadGain);
          leadGain.connect(this.radioGain);

          leadOsc.start(now);
          leadOsc.stop(now + 0.22);
        }
      } else if (this.radioStation === 'synthwave') {
        // Chill warm synthwave chords & kick on beat 0, 4, 8, 12
        if (step % 4 === 0) {
          const chord = [220, 261.6, 329.6, 392];
          chord.forEach((freq) => {
            if (!this.ctx || !this.radioGain) return;
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            const chordGain = this.ctx.createGain();
            chordGain.gain.setValueAtTime(0.04, now);
            chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(chordGain);
            chordGain.connect(this.radioGain);

            osc.start(now);
            osc.stop(now + 0.45);
          });
        }
      } else if (this.radioStation === 'rainy_lofi') {
        // Melancholic electric piano chord every 8 steps
        if (step % 8 === 0) {
          const lofiChord = [174.6, 220, 261.6, 311.1]; // Fmaj7 chord
          lofiChord.forEach((freq) => {
            if (!this.ctx || !this.radioGain) return;
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            osc.connect(gain);
            gain.connect(this.radioGain);

            osc.start(now);
            osc.stop(now + 0.8);
          });
        }
      }
    }, intervalMs);
  }

  private triggerHiHat(time: number) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'highpass' as unknown as OscillatorType;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const noise = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = this.ctx.createBufferSource();
    source.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.radioGain);

    source.start(time);
    source.stop(time + 0.04);
  }

  public setRadioStation(station: 'eurobeat' | 'synthwave' | 'rainy_lofi' | 'off') {
    this.radioStation = station;
  }

  public getRadioStation() {
    return this.radioStation;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted() {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
