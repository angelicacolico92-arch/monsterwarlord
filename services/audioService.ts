import { UnitType, MapId } from '../types';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let isMusicPlaying = false;
let sequencerInterval: any = null;
let currentStep = 0;
let tempo = 100; // Default tempo
let currentMapId: MapId = MapId.FOREST;

// Volume State
const volumes = {
    master: 0.5,
    music: 0.4, 
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

// Deep, Cavernous Kick for Mine
const playDeepKick = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  
  // 1. The Thud
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(70, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  osc.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + 0.5);

  // 2. The Echo (Cave reverb sim)
  const oscEcho = ctx.createOscillator();
  const gEcho = ctx.createGain();
  oscEcho.frequency.setValueAtTime(45, time + 0.2); // Delayed
  oscEcho.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  gEcho.gain.setValueAtTime(vol * 0.25, time + 0.2); 
  gEcho.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
  oscEcho.connect(gEcho);
  gEcho.connect(targetNode);
  oscEcho.start(time + 0.2);
  oscEcho.stop(time + 0.6);
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

const playMetallicPerc = (time: number, vol: number, targetNode: GainNode | null, highPitch = false) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  
  // Metallic: Square wave with bandpass
  osc.type = 'square';
  osc.frequency.setValueAtTime(highPitch ? 2400 : 1200, time);
  
  // Quick decay (Pickaxe hit)
  g.gain.setValueAtTime(vol * 0.4, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = highPitch ? 3000 : 1800;
  filter.Q.value = 8;

  osc.connect(filter);
  filter.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + 0.15);
};

// Heavy Anvil Sound
const playAnvil = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  
  // Heavy Ring
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, time); // Lower heavy ring
  
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol * 0.8, time + 0.02); // Impact
  g.gain.exponentialRampToValueAtTime(0.001, time + 1.2); // Long tail
  
  // Add some metallic dissonance
  const mod = ctx.createOscillator();
  mod.frequency.value = 840; // Dissonant interval
  const modGain = ctx.createGain();
  modGain.gain.value = 200;
  mod.connect(modGain);
  modGain.connect(osc.frequency);
  mod.start(time);
  mod.stop(time + 1.2);

  osc.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + 1.2);
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

// Low Cello/Bass Pad for Mine
const playLowPad = (freq: number, time: number, vol: number, duration: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  // Darker filter
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 1.5, time);

  // Heavy, slow envelope
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.5);
  g.gain.setValueAtTime(vol * 0.9, time + duration - 0.5);
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
    A4: 440.00, B4: 493.88, C5: 523.25, E5: 659.25,
    // Low notes for Mine
    E2: 82.41, G2: 98.00, B2: 123.47
};

// FOREST THEME: Light drums, Flute, Strings
const playForestSequence = (time: number, step: number, secondsPerStep: number) => {
    const barStep = step % 16;
  
    // --- DRUMS (Light, Steady) ---
    if (barStep === 0) playKick(time, 0.4, musicGain);
    if (barStep === 8) playKick(time, 0.3, musicGain);
    if (barStep === 10 && Math.random() > 0.5) playKick(time, 0.2, musicGain);
    if (barStep === 4 || barStep === 12) playSnare(time, 0.15, musicGain);
    if (barStep % 2 === 0) playHiHat(time, 0.1, musicGain);
    if (barStep % 2 !== 0 && Math.random() > 0.7) playHiHat(time, 0.05, musicGain);

    // --- HARMONY (Strings/Pads) ---
    if (barStep === 0) {
        const barIndex = Math.floor(step / 16) % 4;
        let root, third;
        if (barIndex === 0) { root = SCALE.A2; third = SCALE.C3; } // Am
        else if (barIndex === 1) { root = SCALE.C3; third = SCALE.E3; } // C
        else if (barIndex === 2) { root = SCALE.G3; third = SCALE.D3; } // G
        else { root = SCALE.A2; third = SCALE.E3; } // Am
        
        playStrings(root, time, 0.15, secondsPerStep * 16, musicGain);
        playStrings(third, time, 0.12, secondsPerStep * 16, musicGain);
    }

    // --- MELODY (Flute) ---
    const isMelodyStep = barStep % 2 === 0;
    if (isMelodyStep && Math.random() > 0.6) {
        const notes = [SCALE.A3, SCALE.C4, SCALE.D4, SCALE.E4, SCALE.G4, SCALE.A4, SCALE.C5];
        const note = notes[Math.floor(Math.random() * notes.length)];
        const finalNote = Math.random() > 0.8 ? note * 2 : note;
        playFlute(finalNote, time, 0.12, musicGain);
    }
};

// MINE THEME: "Mine March" - Deep, Industrial, Tense
const playMineSequence = (time: number, step: number, secondsPerStep: number) => {
    const barStep = step % 16;

    // --- DRUMS (Heavy March) ---
    // Deep kicks on 1 and 3 (Downbeats) - The heavy footfalls
    if (barStep === 0 || barStep === 8) playDeepKick(time, 0.6, musicGain);
    
    // Light snare/tom on 2 and 4 to drive rhythm
    if (barStep === 4 || barStep === 12) playSnare(time, 0.15, musicGain);
    
    // Occasional extra kick for syncopation
    if (barStep === 10 && Math.random() > 0.5) playDeepKick(time, 0.4, musicGain);

    // --- PERCUSSION (Industrial) ---
    // Heavy Anvil on some downbeats (Accent)
    if (barStep === 0 && step % 32 === 0) playAnvil(time, 0.25, musicGain);
    
    // Pickaxe Clinks (Syncopated high hats)
    if ((barStep === 2 || barStep === 6 || barStep === 10 || barStep === 14) && Math.random() > 0.3) {
        playMetallicPerc(time, 0.12, musicGain, Math.random() > 0.5);
    }

    // --- ATMOSPHERE (Deep Drones) ---
    // Change chord every 2 bars (32 steps) for a slow, oppressive feel
    if (step % 32 === 0) {
        const sequenceIndex = Math.floor(step / 32) % 4;
        
        // Progression: Em -> G -> C -> Bm (Darker, more epic)
        let root = SCALE.E2;
        let fifth = SCALE.B2;

        if (sequenceIndex === 1) { root = SCALE.G2; fifth = SCALE.D3; }
        else if (sequenceIndex === 2) { root = SCALE.C3; fifth = SCALE.G3; }
        else if (sequenceIndex === 3) { root = SCALE.B2; fifth = SCALE.E2; } // Tension

        // Deep Bass Drone
        playLowPad(root, time, 0.3, secondsPerStep * 32, musicGain);
        // Harmonic mid-range pad
        playStrings(fifth, time, 0.15, secondsPerStep * 32, musicGain);
    }
};

const playSwampSequence = (time: number, step: number, secondsPerStep: number) => {
    // Re-use Forest for now but slower (handled by tempo)
    playForestSequence(time, step, secondsPerStep);
};

const sequencerStep = () => {
  const ctx = getCtx();
  if (!ctx || !isMusicPlaying) return;

  const secondsPerStep = 60 / (tempo * 4); // 16th notes
  const time = ctx.currentTime + 0.1;
  
  if (currentMapId === MapId.MINE) {
      playMineSequence(time, currentStep, secondsPerStep);
  } else if (currentMapId === MapId.SWAMP) {
      playSwampSequence(time, currentStep, secondsPerStep);
  } else {
      playForestSequence(time, currentStep, secondsPerStep);
  }

  currentStep = (currentStep + 1) % 64;
};

export const AudioService = {
  unlockAudio: () => {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  },

  startMusic: (mapId: MapId = MapId.FOREST) => {
    // If music is already playing and map hasn't changed, do nothing
    if (isMusicPlaying && currentMapId === mapId) return;
    
    // Update Map ID
    currentMapId = mapId;
    
    // Set Tempo based on map
    if (mapId === MapId.MINE) tempo = 85; // Slower, heavier march
    else if (mapId === MapId.SWAMP) tempo = 90;
    else tempo = 105; // Adventure

    const ctx = getCtx();
    if (!ctx) return;
    
    // Reset step for clean transition
    currentStep = 0;
    
    if (!isMusicPlaying) {
        isMusicPlaying = true;
    }
    
    // Always restart interval to apply new tempo
    if (sequencerInterval) clearInterval(sequencerInterval);
    sequencerInterval = setInterval(sequencerStep, (60 / (tempo * 4)) * 1000);
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