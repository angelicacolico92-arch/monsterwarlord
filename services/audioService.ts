import { UnitType } from '../types';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let isMusicPlaying = false;
let sequencerInterval: any = null;
let currentStep = 0;
let tempo = 110;

// Volume State
const volumes = {
    master: 0.5,
    music: 0.6,
    sfx: 0.7
};

const getCtx = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (CtxClass) {
      audioCtx = new CtxClass();
      
      // Master
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
      masterGain.gain.setValueAtTime(volumes.master, audioCtx.currentTime);

      // Music Bus
      musicGain = audioCtx.createGain();
      musicGain.connect(masterGain);
      musicGain.gain.setValueAtTime(volumes.music, audioCtx.currentTime);

      // SFX Bus
      sfxGain = audioCtx.createGain();
      sfxGain.connect(masterGain);
      sfxGain.gain.setValueAtTime(volumes.sfx, audioCtx.currentTime);
    }
  }
  return audioCtx;
};

// Update volume immediately
const updateVolumes = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    if (masterGain) masterGain.gain.setTargetAtTime(volumes.master, t, 0.1);
    if (musicGain) musicGain.gain.setTargetAtTime(volumes.music, t, 0.1);
    if (sfxGain) sfxGain.gain.setTargetAtTime(volumes.sfx, t, 0.1);
};

const playSynth = (freq: number, type: OscillatorType, start: number, duration: number, volume: number, decay: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(volume, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration + decay);
  osc.connect(g);
  g.connect(targetNode);
  osc.start(start);
  osc.stop(start + duration + decay + 0.1);
};

// --- DRUM SYNTHS ---
// Fix: removed default value for vol because targetNode is required and follows it.
const playKick = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  osc.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + 0.5);
};

// Fix: removed default value for vol because targetNode is required and follows it.
const playSnare = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
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
  g.connect(targetNode);
  noise.start(time);
};

const playPluck = (freq: number, time: number, vol = 0.2) => {
  playSynth(freq, 'triangle', time, 0.05, vol, 0.15, musicGain);
};

const playBrass = (freq: number, time: number, vol = 0.15) => {
  playSynth(freq, 'sawtooth', time, 0.15, vol, 0.3, musicGain);
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

  if (isKick) playKick(time, 0.4, musicGain);
  if (isSnare) playSnare(time, 0.2, musicGain);
  
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
  
  isMusicPlaying: () => isMusicPlaying,

  // SETTINGS API
  setMasterVolume: (val: number) => {
      volumes.master = Math.max(0, Math.min(1, val));
      updateVolumes();
  },
  setMusicVolume: (val: number) => {
      volumes.music = Math.max(0, Math.min(1, val));
      updateVolumes();
  },
  setSfxVolume: (val: number) => {
      volumes.sfx = Math.max(0, Math.min(1, val));
      updateVolumes();
  },
  getVolumes: () => ({ ...volumes }),

  // SFX CALLS (Routed to sfxGain)
  playSelect: () => {
    const ctx = getCtx();
    if (!ctx || !sfxGain) return;
    const time = ctx.currentTime;
    playSynth(440, 'sine', time, 0.05, 0.2, 0.05, sfxGain);
    playSynth(880, 'sine', time + 0.05, 0.15, 0.05, 0.05, sfxGain);
  },

  playRecruit: () => {
    const ctx = getCtx();
    if (!ctx || !sfxGain) return;
    const time = ctx.currentTime;
    playSynth(220, 'triangle', time, 0.1, 0.3, 0.2, sfxGain);
    playSynth(330, 'triangle', time + 0.1, 0.1, 0.2, 0.2, sfxGain);
  },

  playDamage: () => {
    const ctx = getCtx();
    if (!ctx || !sfxGain) return;
    const time = ctx.currentTime;
    playSynth(100, 'sawtooth', time, 0.1, 0.3, 0.3, sfxGain);
  },

  playSummon: () => {
    const ctx = getCtx();
    if (!ctx || !sfxGain) return;
    const time = ctx.currentTime;
    // Magic shimmering sound
    playSynth(660, 'sine', time, 0.1, 0.2, 0.2, sfxGain);
    playSynth(880, 'sine', time + 0.05, 0.1, 0.15, 0.2, sfxGain);
    playSynth(1320, 'sine', time + 0.1, 0.1, 0.1, 0.2, sfxGain);
  },

  playAttack: (type: UnitType) => {
    const ctx = getCtx();
    if (!ctx || !sfxGain) return;
    const time = ctx.currentTime;
    switch (type) {
      case UnitType.BOSS: playKick(time, 0.6, sfxGain); break;
      case UnitType.ARCHER: playSynth(1200, 'sine', time, 0.02, 0.1, 0.05, sfxGain); break;
      case UnitType.MAGE: playSynth(600, 'square', time, 0.1, 0.1, 0.4, sfxGain); break;
      default: playSynth(300, 'triangle', time, 0.05, 0.15, 0.1, sfxGain);
    }
  },

  playFanfare: (isVictory: boolean) => {
    const ctx = getCtx();
    if (!ctx || !musicGain) return; // Fanfare uses music gain usually as it's musical
    const time = ctx.currentTime;
    // We use musicGain for fanfare to ensure it's controlled by music volume, or maybe SFX? 
    // Let's use SFX for fanfare as it's an event sound.
    if (isVictory) {
      [523, 659, 783, 1046].forEach((f, i) => playSynth(f, 'sawtooth', time + i * 0.15, 0.15, 0.3, 0.3, sfxGain));
    } else {
      [392, 349, 311, 261].forEach((f, i) => playSynth(f, 'sawtooth', time + i * 0.2, 0.15, 0.3, 0.3, sfxGain));
    }
  }
};