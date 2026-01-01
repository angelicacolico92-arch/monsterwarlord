import { UnitType } from '../types';

let audioCtx: AudioContext | null = null;
let bgmNodes: AudioNode[] = [];
let isMusicPlaying = false;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const resumeCtx = () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error(e));
    }
    return ctx;
};

export const AudioService = {
  startMusic: () => {
    if (isMusicPlaying) return;
    const ctx = resumeCtx();
    const t = ctx.currentTime;
    isMusicPlaying = true;

    // Create a dark ambient drone atmosphere
    
    // Node creation
    const osc1 = ctx.createOscillator(); // Low drone
    const osc2 = ctx.createOscillator(); // Detuned drone
    const osc3 = ctx.createOscillator(); // Sub bass
    const filter = ctx.createBiquadFilter(); // Moving filter
    const lfo = ctx.createOscillator(); // LFO for filter
    const lfoGain = ctx.createGain(); 
    const masterGain = ctx.createGain();

    // Configuration
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, t); // A1

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(55.5, t); // Slight detune for phasing

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(27.5, t); // A0 (Sub)

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);
    filter.Q.value = 1;

    lfo.type = 'sine';
    lfo.frequency.value = 0.05; // Very slow sweep (20s period)

    lfoGain.gain.value = 100; // Sweep range +/- 100Hz

    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(0.1, t + 4); // Slow fade in

    // Connections
    // LFO -> LFO Gain -> Filter Frequency
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Oscs -> Filter
    osc1.connect(filter);
    osc2.connect(filter);
    
    // Sub -> Direct to gain (keep clean low end) or filter? Let's filter slightly
    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = 100;
    osc3.connect(subFilter);
    subFilter.connect(masterGain);

    // Filter -> Master
    filter.connect(masterGain);

    // Master -> Out
    masterGain.connect(ctx.destination);

    // Start
    osc1.start(t);
    osc2.start(t);
    osc3.start(t);
    lfo.start(t);

    // Store nodes for cleanup
    bgmNodes = [osc1, osc2, osc3, filter, lfo, lfoGain, masterGain, subFilter];
  },

  stopMusic: () => {
     if (!isMusicPlaying) return;
     const ctx = getCtx();
     const t = ctx.currentTime;

     // Find master gain to fade out
     const masterGain = bgmNodes.find(n => n instanceof GainNode && (n as any).gain.value < 100); // Hacky find, but works for this structure
     if (masterGain && masterGain instanceof GainNode) {
         masterGain.gain.cancelScheduledValues(t);
         masterGain.gain.setValueAtTime(masterGain.gain.value, t);
         masterGain.gain.linearRampToValueAtTime(0, t + 1);
     }

     // Stop oscillators after fade
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
    const t = ctx.currentTime;
    
    // Coin/recruit shimmer
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(1000, t + 0.1);
    
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
    const t = ctx.currentTime;
    
    // Quick blip
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
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
    const t = ctx.currentTime;
    
    // Throttling: Slight randomization to prevent phasing and audio spam
    if (Math.random() > 0.4) return; 

    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (type === UnitType.ARCHER) {
        // Bow twang
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        osc.start();
        osc.stop(t + 0.2);
    } else if (type === UnitType.MAGE) {
        // Magic zap
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(400, t + 0.3);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        osc.connect(gain);
        osc.start();
        osc.stop(t + 0.3);
    } else if (type === UnitType.SLIME) {
        // Slime Squelch
        // A mix of a downward sine sweep (bloopy) and filtered noise (squishy)
        
        // 1. Bloop
        const bloopOsc = ctx.createOscillator();
        bloopOsc.type = 'sine';
        bloopOsc.frequency.setValueAtTime(400, t);
        bloopOsc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
        
        const bloopGain = ctx.createGain();
        bloopGain.gain.setValueAtTime(0.1, t);
        bloopGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        bloopOsc.connect(bloopGain);
        bloopGain.connect(ctx.destination);
        bloopOsc.start(t);
        bloopOsc.stop(t + 0.2);

        // 2. Wet Noise
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
           data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(800, t);
        noiseFilter.frequency.linearRampToValueAtTime(200, t + 0.2); // Closing filter makes it sound wetter
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);

    } else if (type === UnitType.GARGOYLE) {
        // Stone Gargoyle Swoop & Crunch
        // 1. Swoop (Low Sawtooth Drop)
        const swoopOsc = ctx.createOscillator();
        swoopOsc.type = 'sawtooth';
        swoopOsc.frequency.setValueAtTime(120, t);
        swoopOsc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        
        const swoopGain = ctx.createGain();
        swoopGain.gain.setValueAtTime(0.1, t);
        swoopGain.gain.linearRampToValueAtTime(0, t + 0.3);
        
        // Lowpass to muffle it like wind/stone moving
        const swoopFilter = ctx.createBiquadFilter();
        swoopFilter.type = 'lowpass';
        swoopFilter.frequency.setValueAtTime(300, t);

        swoopOsc.connect(swoopFilter);
        swoopFilter.connect(swoopGain);
        swoopGain.connect(ctx.destination);
        
        swoopOsc.start(t);
        swoopOsc.stop(t + 0.3);

        // 2. Crunch/Bite (Noise Burst with delay)
        const impactTime = t + 0.1; // Hit slightly after swoop starts
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, t);
        noiseGain.gain.setValueAtTime(0.15, impactTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, impactTime + 0.2);
        noiseGain.connect(ctx.destination);

        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
           data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Filter the noise to sound crunchy (stone)
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 400;
        noiseFilter.Q.value = 1;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noise.start(t);

    } else {
        // Melee hit (Filtered Noise) - Default
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        noise.start();
    }
  },

  playDamage: () => {
    const ctx = resumeCtx();
    const t = ctx.currentTime;
    
    // Limit frequency
    if (Math.random() > 0.3) return;

    // Heavy thud
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(t + 0.15);
  },

  playFanfare: (isVictory: boolean) => {
    const ctx = resumeCtx();
    const t = ctx.currentTime;
    const notes = isVictory 
        ? [523.25, 659.25, 783.99, 1046.50] // C Major
        : [440.00, 415.30, 392.00, 349.23]; // Descending

    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = isVictory ? 'triangle' : 'sawtooth';
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
