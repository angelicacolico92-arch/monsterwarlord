import React, { useState, useEffect } from 'react';
import { AudioService } from '../services/audioService';

interface IntroSequenceProps {
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); 

  const handleStart = () => {
    AudioService.playSelect();
    setStep(1);
  };

  useEffect(() => {
    let timer: any;
    if (step === 1) {
      timer = setTimeout(() => setStep(2), 1800);
    } else if (step === 2) {
      timer = setTimeout(() => setStep(3), 1800);
    } else if (step === 3) {
      timer = setTimeout(onComplete, 2500);
    }
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  return (
    <div 
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white select-none cursor-pointer"
        onClick={step === 0 ? handleStart : undefined}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 animate-pulse"></div>

      {step === 0 && (
        <div className="z-10 text-center animate-pulse">
          <h1 className="text-3xl sm:text-5xl font-epic mb-8 tracking-widest text-stone-300">SLIME WARS</h1>
          <div className="border border-white/20 bg-white/5 px-8 py-3 rounded text-sm font-mono hover:bg-white/10 transition-colors">
            CLICK TO INITIALIZE
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="z-10 animate-intro-fade">
           <h2 className="text-4xl sm:text-6xl font-sketch text-red-600 drop-shadow-lg tracking-wider">WAR IS ETERNAL</h2>
        </div>
      )}

      {step === 2 && (
        <div className="z-10 animate-intro-fade">
           <h2 className="text-4xl sm:text-6xl font-sketch text-blue-500 drop-shadow-lg tracking-wider">LEAD THE LEGION</h2>
        </div>
      )}

      {step === 3 && (
        <div className="z-10 text-center animate-logo-slam">
            <h1 className="text-6xl sm:text-8xl font-epic text-transparent bg-clip-text bg-gradient-to-b from-green-300 via-lime-500 to-green-800 drop-shadow-[0_0_25px_rgba(132,204,22,0.6)]">
                SLIME WARS
            </h1>
            <p className="text-3xl sm:text-5xl text-stone-400 font-mono tracking-[0.5em] mt-2 sm:mt-4 border-t border-stone-800 pt-4">
                SAGA
            </p>
        </div>
      )}
      
      {step > 0 && (
         <button 
            onClick={(e) => { e.stopPropagation(); onComplete(); }}
            className="absolute bottom-8 text-stone-600 text-xs uppercase tracking-widest hover:text-white transition-colors z-20"
         >
            Skip Intro
         </button>
      )}
    </div>
  );
};