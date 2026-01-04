import { UnitType } from '../types';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let isMusicPlaying = false;
let sequencerInterval: any = null;
let currentStep = 0;
let tempo = 100; // Slightly slower for that "Adventure" feel

// Volume State
const volumes = {
    master: 0.5,
    music: 0.4, // Lower music volume as requested
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
const playKick = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  
  // Softer Kick for Forest Theme
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.4);
  
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
  
  osc.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + 0.4);
};

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
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.15); // Slightly longer tail
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1500, time); // Softer tone
  
  noise.connect(filter);
  filter.connect(g);
  g.connect(targetNode);
  noise.start(time);
};

const playHiHat = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 8000;

  const g = ctx.createGain();
  g.gain.setValueAtTime(vol * 0.5, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

  noise.connect(filter);
  filter.connect(g);
  g.connect(targetNode);
  noise.start(time);
};

// --- INSTRUMENTS ---

// Flute: Sine wave, soft attack, smooth sustain
const playFlute = (freq: number, time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  
  // Envelope: Soft attack, sustain, soft release
  const attack = 0.05;
  const sustain = 0.1;
  const release = 0.1;
  
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + attack); 
  g.gain.setValueAtTime(vol * 0.8, time + attack + sustain);
  g.gain.exponentialRampToValueAtTime(0.001, time + attack + sustain + release);

  // Subtle Vibrato
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 5; // 5Hz
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 2; // Depth
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  vibrato.start(time);
  vibrato.stop(time + attack + sustain + release);

  osc.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + attack + sustain + release);
};

// Strings/Pad: Sawtooth + Lowpass, slow attack
const playStrings = (freq: number, time: number, vol: number, duration: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  // Filter to soften the buzz
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 2, time);

  // Envelope: Slow attack, long release
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.3);
  g.gain.setValueAtTime(vol * 0.8, time + duration - 0.5);
  g.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + duration);
};

// --- SEQUENCER SCALES ---
// A Minor / C Major Scale (Fantasy Feel)
const SCALE = {
    A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
    A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00,
    A4: 440.00, C5: 523.25, E5: 659.25
};

const step = () => {
  const ctx = getCtx();
  if (!ctx || !isMusicPlaying) return;

  const secondsPerStep = 60 / (tempo * 4); // 16th notes
  const time = ctx.currentTime + 0.1;
  
  // --- DRUMS (Light, Steady) ---
  const barStep = currentStep % 16;
  
  // Kick on 1, 9 (and soft syncopation)
  if (barStep === 0) playKick(time, 0.4, musicGain);
  if (barStep === 8) playKick(time, 0.3, musicGain);
  if (barStep === 10 && Math.random() > 0.5) playKick(time, 0.2, musicGain);

  // Snare on 5, 13 (Soft backbeat)
  if (barStep === 4 || barStep === 12) playSnare(time, 0.15, musicGain);

  // HiHats (Steady 8ths, with random 16ths)
  if (barStep % 2 === 0) playHiHat(time, 0.1, musicGain);
  if (barStep % 2 !== 0 && Math.random() > 0.7) playHiHat(time, 0.05, musicGain);

  // --- HARMONY (Strings/Pads) ---
  // Change chord every 16 steps (1 bar)
  // Progression: Am -> C -> G -> Am
  if (barStep === 0) {
      const barIndex = Math.floor(currentStep / 16) % 4;
      let root, third;
      if (barIndex === 0) { root = SCALE.A2; third = SCALE.C3; } // Am
      else if (barIndex === 1) { root = SCALE.C3; third = SCALE.E3; } // C
      else if (barIndex === 2) { root = SCALE.G3; third = SCALE.D3; } // G (using D as 5th for open sound)
      else { root = SCALE.A2; third = SCALE.E3; } // Am
      
      playStrings(root, time, 0.15, secondsPerStep * 16, musicGain);
      playStrings(third, time, 0.12, secondsPerStep * 16, musicGain);
  }

  // --- MELODY (Flute) ---
  // Playful, sparse melody on top
  const isMelodyStep = barStep % 2 === 0; // Quantize to 8th notes
  if (isMelodyStep && Math.random() > 0.6) {
      // Pick a note from the pentatonic scale
      const notes = [SCALE.A3, SCALE.C4, SCALE.D4, SCALE.E4, SCALE.G4, SCALE.A4, SCALE.C5];
      const note = notes[Math.floor(Math.random() * notes.length)];
      
      // Chance for a higher octave flourish
      const finalNote = Math.random() > 0.8 ? note * 2 : note;
      
      playFlute(finalNote, time, 0.12, musicGain);
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
    // Clear any existing interval just in case
    if (sequencerInterval) clearInterval(sequencerInterval);
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
    if (!ctx || !sfxGain) return; 
    const time = ctx.currentTime;
    if (isVictory) {
      [523, 659, 783, 1046].forEach((f, i) => playSynth(f, 'sawtooth', time + i * 0.15, 0.15, 0.3, 0.3, sfxGain));
    } else {
      [392, 349, 311, 261].forEach((f, i) => playSynth(f, 'sawtooth', time + i * 0.2, 0.15, 0.3, 0.3, sfxGain));
    }
  }
};