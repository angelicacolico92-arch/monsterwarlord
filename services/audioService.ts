import { UnitType } from '../types';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let isMusicPlaying = false;
let sequencerInterval: any = null;
let currentStep = 0;
let tempo = 110;

const getCtx = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (CtxClass) {
      audioCtx = new CtxClass();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
      masterGain.gain.setValueAtTime(0.4, audioCtx.currentTime);

      musicGain = audioCtx.createGain();
      musicGain.connect(masterGain);
      musicGain.gain.setValueAtTime(0.6, audioCtx.currentTime); // 60% music volume as recommended
    }
  }
  return audioCtx;
};

const playSynth = (freq: number, type: OscillatorType, start: number, duration: number, volume: number, decay: number) => {
  const ctx = getCtx();
  if (!ctx || !musicGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(volume, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration + decay);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(start);
  osc.stop(start + duration + decay + 0.1);
};

// --- DRUM SYNTHS ---
const playKick = (time: number, vol = 0.5) => {
  const ctx = getCtx();
  if (!ctx || !musicGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(time);
  osc.stop(time + 0.5);
};

const playSnare = (time: number, vol = 0.3) => {
  const ctx = getCtx();
  if (!ctx || !musicGain) return;
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noise.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1000, time);
  noise.connect(filter);
  filter.connect(g);
  g.connect(musicGain);
  noise.start(time);
};

const playPluck = (freq: number, time: number, vol = 0.2) => {
  playSynth(freq, 'triangle', time, 0.05, vol, 0.15);
};

const playBrass = (freq: number, time: number, vol = 0.15) => {
  playSynth(freq, 'sawtooth', time, 0.15, vol, 0.3);
};

// --- SEQUENCER SCALES ---
const HEROIC_SCALE = [130.81, 164.81, 196.00, 220.00, 261.63]; // C Major Pen

const step = () => {
  const ctx = getCtx();
  if (!ctx || !isMusicPlaying) return;

  const secondsPerStep = 60 / (tempo * 4);
  const time = ctx.currentTime + 0.1;

  const isKick = currentStep % 8 === 0 || (currentStep % 8 === 4 && Math.random() > 0.7);
  const isSnare = currentStep % 8 === 4;
  const isPluck = currentStep % 2 === 0;

  if (isKick) playKick(time, 0.4);
  if (isSnare) playSnare(time, 0.2);
  
  if (isPluck) {
    const note = HEROIC_SCALE[Math.floor(Math.random() * HEROIC_SCALE.length)] * 2;
    playPluck(note, time, 0.1);
  }

  if (currentStep % 16 === 0) {
    playBrass(HEROIC_SCALE[0] * 2, time, 0.1);
    playBrass(HEROIC_SCALE[2] * 2, time + secondsPerStep * 2, 0.1);
  }

  currentStep = (currentStep + 1) % 64;
};

export const AudioService = {
  unlockAudio: () => {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  },

  startMusic: () => {
    if (isMusicPlaying) return;
    const ctx = getCtx();
    if (!ctx) return;
    isMusicPlaying = true;
    currentStep = 0;
    sequencerInterval = setInterval(step, (60 / (tempo * 4)) * 1000);
  },

  stopMusic: () => {
    isMusicPlaying = false;
    if (sequencerInterval) clearInterval(sequencerInterval);
  },

  playSelect: () => {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;
    const time = ctx.currentTime;
    playSynth(440, 'sine', time, 0.05, 0.2, 0.05);
    playSynth(880, 'sine', time + 0.05, 0.05, 0.15, 0.05);
  },

  playRecruit: () => {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;
    const time = ctx.currentTime;
    playSynth(220, 'triangle', time, 0.1, 0.3, 0.2);
    playSynth(330, 'triangle', time + 0.1, 0.1, 0.2, 0.2);
  },

  playDamage: () => {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;
    const time = ctx.currentTime;
    playSynth(100, 'sawtooth', time, 0.1, 0.3, 0.3);
  },

  playSummon: () => {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;
    const time = ctx.currentTime;
    // Magic shimmering sound
    playSynth(660, 'sine', time, 0.1, 0.2, 0.2);
    playSynth(880, 'sine', time + 0.05, 0.1, 0.15, 0.2);
    playSynth(1320, 'sine', time + 0.1, 0.1, 0.1, 0.2);
  },

  playAttack: (type: UnitType) => {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;
    const time = ctx.currentTime;
    switch (type) {
      case UnitType.BOSS: playKick(time, 0.6); break;
      case UnitType.ARCHER: playSynth(1200, 'sine', time, 0.02, 0.1, 0.05); break;
      case UnitType.MAGE: playSynth(600, 'square', time, 0.1, 0.1, 0.4); break;
      default: playSynth(300, 'triangle', time, 0.05, 0.15, 0.1);
    }
  },

  playFanfare: (isVictory: boolean) => {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;
    const time = ctx.currentTime;
    if (isVictory) {
      [523, 659, 783, 1046].forEach((f, i) => playBrass(f, time + i * 0.15, 0.3));
    } else {
      [392, 349, 311, 261].forEach((f, i) => playBrass(f, time + i * 0.2, 0.3));
    }
  }
};