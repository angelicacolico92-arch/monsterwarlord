import { UnitType } from '../types';

let audioCtx: AudioContext | null = null;
let bgmNodes: AudioNode[] = [];
let isMusicPlaying = false;
let isUnlocked = false;

const getCtx = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (CtxClass) {
        audioCtx = new CtxClass();
    }
  }
  return audioCtx;
};

const resumeCtx = () => {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Audio resume failed:", e));
    }
    return ctx;
};

export const AudioService = {
  // Call this on the first user interaction
  unlockAudio: () => {
      if (isUnlocked) return;
      const ctx = getCtx();
      if (!ctx) return;

      // Play a silent buffer to fully unlock the audio engine on iOS
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      resumeCtx();
      isUnlocked = true;
  },

  startMusic: () => {
    if (isMusicPlaying) return;
    const ctx = resumeCtx();
    if (!ctx) return;
    
    const t = ctx.currentTime;
    isMusicPlaying = true;

    // Node creation
    const osc1 = ctx.createOscillator(); // Bass drone
    const osc2 = ctx.createOscillator(); // High chime
    const filter = ctx.createBiquadFilter(); // Env filter
    const lfo = ctx.createOscillator(); // Wobble
    const masterGain = ctx.createGain();

    // Configuration
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(45, t); // F1

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(180, t); // F3

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.Q.value = 5;

    lfo.type = 'sine';
    lfo.frequency.value = 0.5; // slow wobble

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;

    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(0.08, t + 4); 

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(masterGain); // Bass bypass filter
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    lfo.start(t);

    bgmNodes = [osc1, osc2, filter, lfo, lfoGain, masterGain];
  },

  stopMusic: () => {
     if (!isMusicPlaying) return;
     const ctx = getCtx();
     if (!ctx) return;
     
     const t = ctx.currentTime;

     const masterGain = bgmNodes.find(n => n instanceof GainNode && (n as any).gain.value < 100); 
     if (masterGain && masterGain instanceof GainNode) {
         masterGain.gain.cancelScheduledValues(t);
         masterGain.gain.setValueAtTime(masterGain.gain.value, t);
         masterGain.gain.linearRampToValueAtTime(0, t + 1);
     }

     setTimeout(() => {
         bgmNodes.forEach(node => {
             if (node instanceof OscillatorNode) {
                 try { node.stop(); } catch(e){}
             }
             node.disconnect();
         });
         bgmNodes = [];
     }, 1100);
     
     isMusicPlaying = false;
  },

  playRecruit: () => {
    const ctx = resumeCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Wet pop sound
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(t + 0.1);
  },

  playSelect: () => {
    const ctx = resumeCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    // Bubble blip
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(t + 0.05);
  },

  playAttack: (type: UnitType) => {
    const ctx = resumeCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    if (Math.random() > 0.4) return; 

    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (type === UnitType.ARCHER || type === UnitType.TOXIC) {
        // Spit / Thwip
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        osc.start();
        osc.stop(t + 0.15);
    } else if (type === UnitType.MAGE) {
        // Magic gloop
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.3);
        // Add wobble
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 20;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 50;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        osc.connect(gain);
        osc.start();
        osc.stop(t + 0.3);
    } else {
        // Melee Splat (Worker, Paladin, Boss)
        // Filtered Noise
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.linearRampToValueAtTime(100, t + 0.15); // Closing filter

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        noise.connect(filter);
        filter.connect(gain);
        noise.start();
    }
  },

  playDamage: () => {
    const ctx = resumeCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    if (Math.random() > 0.3) return;

    // Squish damage
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(t + 0.1);
  },

  playFanfare: (isVictory: boolean) => {
    const ctx = resumeCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = isVictory 
        ? [400, 500, 600, 800] 
        : [300, 250, 200, 100]; 

    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.2);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, t + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.2 + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.2);
        osc.stop(t + i * 0.2 + 0.4);
    });
  }
};