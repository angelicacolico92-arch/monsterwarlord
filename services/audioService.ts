
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

// Generic Synth Helper
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

// --- BATTLE SOUNDS ---

// Melee: Slap + Thud + Light Metal
const playMeleeHit = (time: number, targetNode: GainNode | null) => {
    const ctx = getCtx();
    if (!ctx || !targetNode) return;

    // 1. Slime Slap (Mid-range noise/chirp)
    const oscSlap = ctx.createOscillator();
    const gSlap = ctx.createGain();
    oscSlap.frequency.setValueAtTime(400, time);
    oscSlap.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    gSlap.gain.setValueAtTime(0.3, time);
    gSlap.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    oscSlap.connect(gSlap);
    gSlap.connect(targetNode);
    oscSlap.start(time);
    oscSlap.stop(time + 0.15);

    // 2. Body Thud (Low impact)
    const oscThud = ctx.createOscillator();
    const gThud = ctx.createGain();
    oscThud.type = 'sine';
    oscThud.frequency.setValueAtTime(150, time);
    oscThud.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    gThud.gain.setValueAtTime(0.5, time);
    gThud.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    oscThud.connect(gThud);
    gThud.connect(targetNode);
    oscThud.start(time);
    oscThud.stop(time + 0.2);

    // 3. Light Metal Tap (Armor)
    const oscMetal = ctx.createOscillator();
    const gMetal = ctx.createGain();
    oscMetal.type = 'triangle';
    oscMetal.frequency.setValueAtTime(1200, time);
    gMetal.gain.setValueAtTime(0.1, time);
    gMetal.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    oscMetal.connect(gMetal);
    gMetal.connect(targetNode);
    oscMetal.start(time);
    oscMetal.stop(time + 0.1);
};

// Knight: Metallic Shing
const playKnightSlash = (time: number, targetNode: GainNode | null) => {
    const ctx = getCtx();
    if (!ctx || !targetNode) return;

    // Metal Ring/Shine
    const oscRing = ctx.createOscillator();
    const gRing = ctx.createGain();
    oscRing.type = 'sine';
    oscRing.frequency.setValueAtTime(2000, time);
    oscRing.frequency.exponentialRampToValueAtTime(4000, time + 0.1); // Quick up-sweep for "Shing"
    gRing.gain.setValueAtTime(0.1, time);
    gRing.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    
    // Noise scrape
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    const gNoise = ctx.createGain();
    gNoise.gain.setValueAtTime(0.2, time);
    gNoise.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    noise.connect(filter);
    filter.connect(gNoise);
    gNoise.connect(targetNode);
    noise.start(time);

    oscRing.connect(gRing);
    gRing.connect(targetNode);
    oscRing.start(time);
    oscRing.stop(time + 0.3);
}

// Boss: Low Boom-Thump
const playHeavyHit = (time: number, targetNode: GainNode | null) => {
    const ctx = getCtx();
    if (!ctx || !targetNode) return;

    // Deep Boom
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(10, time + 0.4);
    g.gain.setValueAtTime(0.8, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.connect(g);
    g.connect(targetNode);
    osc.start(time);
    osc.stop(time + 0.5);
};

// Archer: Quick Fwip (Release)
const playArcherRelease = (time: number, targetNode: GainNode | null) => {
    const ctx = getCtx();
    if (!ctx || !targetNode) return;

    // Filtered Noise Swipe
    const bufferSize = ctx.sampleRate * 0.1; // 0.1s
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(1500, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.1);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    noise.connect(filter);
    filter.connect(g);
    g.connect(targetNode);
    noise.start(time);
};

// Mage: Low Woom + Shimmer
const playMagicCast = (time: number, targetNode: GainNode | null) => {
    const ctx = getCtx();
    if (!ctx || !targetNode) return;

    // Low Woom (Swell)
    const oscLow = ctx.createOscillator();
    const gLow = ctx.createGain();
    oscLow.type = 'sine';
    oscLow.frequency.setValueAtTime(100, time);
    oscLow.frequency.linearRampToValueAtTime(200, time + 0.2);
    
    gLow.gain.setValueAtTime(0, time);
    gLow.gain.linearRampToValueAtTime(0.4, time + 0.1);
    gLow.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    // Crystal Shimmer
    const oscHigh = ctx.createOscillator();
    const gHigh = ctx.createGain();
    oscHigh.type = 'sine';
    oscHigh.frequency.setValueAtTime(2000, time);
    
    // Vibrato
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 10;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(oscHigh.frequency);
    lfo.start(time);

    gHigh.gain.setValueAtTime(0.1, time);
    gHigh.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    oscLow.connect(gLow);
    gLow.connect(targetNode);
    oscLow.start(time);
    oscLow.stop(time + 0.4);

    oscHigh.connect(gHigh);
    gHigh.connect(targetNode);
    oscHigh.start(time);
    oscHigh.stop(time + 0.4);
};

// Impact: Plip/Thok (Physical) or Fshoom (Magic)
const playImpactSound = (time: number, type: 'PHYSICAL' | 'MAGIC' | 'SLIME', targetNode: GainNode | null) => {
    const ctx = getCtx();
    if (!ctx || !targetNode) return;

    if (type === 'MAGIC') {
        // Soft Fireburst (Noise puff)
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.linearRampToValueAtTime(100, time + 0.2);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.5, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        noise.connect(filter);
        filter.connect(g);
        g.connect(targetNode);
        noise.start(time);
    } else {
        // Physical/Slime: Plip/Thok (Quick pitch drop)
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.05); // Fast drop
        
        g.gain.setValueAtTime(type === 'PHYSICAL' ? 0.3 : 0.5, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(g);
        g.connect(targetNode);
        osc.start(time);
        osc.stop(time + 0.1);
    }
};

// Death: Glop Collapse
const playGlopDeath = (time: number, targetNode: GainNode | null) => {
    const ctx = getCtx();
    if (!ctx || !targetNode) return;

    // 3 bubble pops
    [0, 0.05, 0.1].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const freq = 400 - (i * 100);
        osc.frequency.setValueAtTime(freq, time + offset);
        osc.frequency.exponentialRampToValueAtTime(freq / 2, time + offset + 0.05);
        
        g.gain.setValueAtTime(0.2, time + offset);
        g.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.05);
        
        osc.connect(g);
        g.connect(targetNode);
        osc.start(time + offset);
        osc.stop(time + offset + 0.1);
    });
};

// --- DRUM SYNTHS FOR MUSIC ---
const playKick = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.4);
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
  osc.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + 0.4);
};

const playDeepKick = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
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
  const oscEcho = ctx.createOscillator();
  const gEcho = ctx.createGain();
  oscEcho.frequency.setValueAtTime(45, time + 0.2); 
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
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.15); 
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1500, time);
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
  osc.type = 'square';
  osc.frequency.setValueAtTime(highPitch ? 2400 : 1200, time);
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

const playAnvil = (time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, time);
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol * 0.8, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
  const mod = ctx.createOscillator();
  mod.frequency.value = 840; 
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

const playFlute = (freq: number, time: number, vol: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  const attack = 0.05;
  const sustain = 0.1;
  const release = 0.1;
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + attack); 
  g.gain.setValueAtTime(vol * 0.8, time + attack + sustain);
  g.gain.exponentialRampToValueAtTime(0.001, time + attack + sustain + release);
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 5; 
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 2; 
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  vibrato.start(time);
  vibrato.stop(time + attack + sustain + release);
  osc.connect(g);
  g.connect(targetNode);
  osc.start(time);
  osc.stop(time + attack + sustain + release);
};

const playStrings = (freq: number, time: number, vol: number, duration: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 2, time);
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

const playLowPad = (freq: number, time: number, vol: number, duration: number, targetNode: GainNode | null) => {
  const ctx = getCtx();
  if (!ctx || !targetNode) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 1.5, time);
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

const SCALE = {
    A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
    A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00,
    A4: 440.00, B4: 493.88, C5: 523.25, E5: 659.25,
    E2: 82.41, G2: 98.00, B2: 123.47
};

const playForestSequence = (time: number, step: number, secondsPerStep: number) => {
    const barStep = step % 16;
    if (barStep === 0) playKick(time, 0.4, musicGain);
    if (barStep === 8) playKick(time, 0.3, musicGain);
    if (barStep === 10 && Math.random() > 0.5) playKick(time, 0.2, musicGain);
    if (barStep === 4 || barStep === 12) playSnare(time, 0.15, musicGain);
    if (barStep % 2 === 0) playHiHat(time, 0.1, musicGain);
    if (barStep % 2 !== 0 && Math.random() > 0.7) playHiHat(time, 0.05, musicGain);

    if (barStep === 0) {
        const barIndex = Math.floor(step / 16) % 4;
        let root, third;
        if (barIndex === 0) { root = SCALE.A2; third = SCALE.C3; } 
        else if (barIndex === 1) { root = SCALE.C3; third = SCALE.E3; } 
        else if (barIndex === 2) { root = SCALE.G3; third = SCALE.D3; } 
        else { root = SCALE.A2; third = SCALE.E3; } 
        
        playStrings(root, time, 0.15, secondsPerStep * 16, musicGain);
        playStrings(third, time, 0.12, secondsPerStep * 16, musicGain);
    }

    const isMelodyStep = barStep % 2 === 0;
    if (isMelodyStep && Math.random() > 0.6) {
        const notes = [SCALE.A3, SCALE.C4, SCALE.D4, SCALE.E4, SCALE.G4, SCALE.A4, SCALE.C5];
        const note = notes[Math.floor(Math.random() * notes.length)];
        const finalNote = Math.random() > 0.8 ? note * 2 : note;
        playFlute(finalNote, time, 0.12, musicGain);
    }
};

const playMineSequence = (time: number, step: number, secondsPerStep: number) => {
    const barStep = step % 16;
    if (barStep === 0 || barStep === 8) playDeepKick(time, 0.6, musicGain);
    if (barStep === 4 || barStep === 12) playSnare(time, 0.15, musicGain);
    if (barStep === 10 && Math.random() > 0.5) playDeepKick(time, 0.4, musicGain);
    if (barStep === 0 && step % 32 === 0) playAnvil(time, 0.25, musicGain);
    if ((barStep === 2 || barStep === 6 || barStep === 10 || barStep === 14) && Math.random() > 0.3) {
        playMetallicPerc(time, 0.12, musicGain, Math.random() > 0.5);
    }
    if (step % 32 === 0) {
        const sequenceIndex = Math.floor(step / 32) % 4;
        let root = SCALE.E2;
        let fifth = SCALE.B2;
        if (sequenceIndex === 1) { root = SCALE.G2; fifth = SCALE.D3; }
        else if (sequenceIndex === 2) { root = SCALE.C3; fifth = SCALE.G3; }
        else if (sequenceIndex === 3) { root = SCALE.B2; fifth = SCALE.E2; }
        playLowPad(root, time, 0.3, secondsPerStep * 32, musicGain);
        playStrings(fifth, time, 0.15, secondsPerStep * 32, musicGain);
    }
};

const playSwampSequence = (time: number, step: number, secondsPerStep: number) => {
    playForestSequence(time, step, secondsPerStep);
};

const sequencerStep = () => {
  const ctx = getCtx();
  if (!ctx || !isMusicPlaying) return;
  const secondsPerStep = 60 / (tempo * 4); 
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
    if (isMusicPlaying && currentMapId === mapId) return;
    currentMapId = mapId;
    if (mapId === MapId.MINE) tempo = 85; 
    else if (mapId === MapId.SWAMP) tempo = 90;
    else tempo = 105; 
    const ctx = getCtx();
    if (!ctx) return;
    currentStep = 0;
    if (!isMusicPlaying) isMusicPlaying = true;
    if (sequencerInterval) clearInterval(sequencerInterval);
    sequencerInterval = setInterval(sequencerStep, (60 / (tempo * 4)) * 1000);
  },

  stopMusic: () => {
    isMusicPlaying = false;
    if (sequencerInterval) clearInterval(sequencerInterval);
  },
  
  isMusicPlaying: () => isMusicPlaying,

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
    playSynth(1800, 'sine', time, 0.02, 0.1, 0.15, sfxGain);
    playSynth(2800, 'sine', time, 0.01, 0.05, 0.1, sfxGain);
  },

  playSummon: () => {
    const ctx = getCtx();
    if (!ctx || !sfxGain) return;
    const time = ctx.currentTime;
    playMagicCast(time, sfxGain);
  },

  playAttack: (type: UnitType) => {
    const ctx = getCtx();
    if (!ctx || !sfxGain) return;
    const time = ctx.currentTime;
    switch (type) {
      case UnitType.BOSS: playHeavyHit(time, sfxGain); break;
      case UnitType.ARCHER: playArcherRelease(time, sfxGain); break;
      case UnitType.MAGE: playMagicCast(time, sfxGain); break;
      case UnitType.TOXIC: playKnightSlash(time, sfxGain); break; // Imperial Knight Sound
      default: playMeleeHit(time, sfxGain); // Warrior, Paladin, Worker, Minion
    }
  },

  playImpact: (type: 'PHYSICAL' | 'MAGIC' | 'SLIME' = 'PHYSICAL') => {
      const ctx = getCtx();
      if (!ctx || !sfxGain) return;
      playImpactSound(ctx.currentTime, type, sfxGain);
  },

  playDeath: () => {
      const ctx = getCtx();
      if (!ctx || !sfxGain) return;
      playGlopDeath(ctx.currentTime, sfxGain);
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
