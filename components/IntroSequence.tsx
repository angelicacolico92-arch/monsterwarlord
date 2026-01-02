import React, { useState, useEffect } from 'react';
import { AudioService } from '../services/audioService';
import { StickmanRender } from './StickmanRender';
import { UnitType } from '../types';

interface IntroSequenceProps {
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStart = () => {
    // Critical for iOS: Unlock audio context on first user gesture
    AudioService.unlockAudio();
    AudioService.playSelect();
    setStarted(true);
  };

  useEffect(() => {
    if (!started) return;

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800); // Slight pause at 100% before finishing
          return 100;
        }
        // Random increment for organic loading feel
        return Math.min(prev + Math.random() * 4, 100); 
      });
    }, 80);

    return () => clearInterval(interval);
  }, [started, onComplete]);

  if (!started) {
    return (
      <div 
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white select-none cursor-pointer overflow-hidden touch-manipulation h-[100dvh]"
        onClick={handleStart}
      >
         {/* Background */}
         <div className="absolute inset-0 bg-gradient-to-b from-green-950 to-black"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40 animate-pulse"></div>
         
         <div className="z-10 text-center flex flex-col items-center justify-center h-full gap-8 animate-pulse pointer-events-none p-4">
            <h1 className="text-5xl sm:text-7xl font-sketch text-green-500 drop-shadow-lg tracking-tighter">SLIME WARS</h1>
            <div className="border-2 border-green-600 bg-green-900/30 px-8 py-3 sm:px-12 sm:py-5 rounded-xl text-green-100 font-bold tracking-widest hover:bg-green-800/50 transition-all shadow-[0_0_30px_rgba(22,163,74,0.3)] text-sm sm:text-lg">
                TAP TO START
            </div>
         </div>
         
         {/* Hint for mobile users */}
         <div className="absolute bottom-6 text-[10px] sm:text-xs text-green-500/50 uppercase tracking-widest">Tap anywhere to begin</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden bg-stone-900 select-none h-[100dvh] w-screen">
      {/* Background: subtle forest or slime-themed gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900 via-stone-950 to-black"></div>
      
      {/* Slime overlay pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/gooey-pattern.png')]"></div>

      {/* Main Content Container - Flex layout distributes space vertically */}
      <div className="relative z-10 flex flex-col items-center justify-between w-full h-full max-w-4xl mx-auto py-4 sm:py-8 px-4">
        
        {/* Game Logo */}
        <div className="text-center transform transition-transform duration-500 pt-2 sm:pt-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-sketch text-transparent bg-clip-text bg-gradient-to-b from-lime-400 to-green-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] filter">
              SLIME WARS
            </h1>
            <p className="text-lg sm:text-2xl font-epic text-yellow-500 tracking-[0.4em] -mt-1 sm:mt-2 drop-shadow-md">SAGA</p>
        </div>

        {/* Big Slime Animation Container - Takes available middle space */}
        <div className="flex-1 flex items-center justify-center w-full relative min-h-[150px]">
            {/* Glow/Puddle effect */}
            <div className="absolute w-32 h-8 sm:w-48 sm:h-12 bg-green-500/30 rounded-full blur-xl animate-pulse translate-y-12 sm:translate-y-16"></div>
            
            {/* Scaled Render */}
            <div className="transform scale-[2.0] sm:scale-[2.5] md:scale-[3.5] transition-transform duration-700">
               <StickmanRender 
                  type={UnitType.TOXIC} // Green Slime for "green slime tones"
                  isPlayer={true} // Lime green color
                  isMoving={true} // Triggers 'animate-slime-bounce'
                  scale={1}
               />
            </div>
        </div>

        {/* Progress Bar / Loading Indicator: Place at bottom */}
        <div className="w-full max-w-xs sm:max-w-md space-y-2 sm:space-y-3 pb-2 sm:pb-6">
           {/* Bar Container */}
           <div className="h-4 sm:h-6 bg-black/60 rounded-full border-2 border-stone-600 p-0.5 sm:p-1 overflow-hidden backdrop-blur-md relative shadow-lg">
              {/* Fill Animation */}
              <div 
                className="h-full bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(234,179,8,0.5)] relative"
                style={{ width: `${progress}%` }}
              >
                  {/* Gloss shine */}
                  <div className="absolute top-0 left-0 w-full h-[50%] bg-white/30 rounded-t-full"></div>
              </div>
           </div>
           
           {/* Tip Text / Message */}
           <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono px-1">
               <span className="text-green-200/90 animate-pulse tracking-wide truncate mr-2">Tip: Protect your miners!</span>
               <span className="text-stone-500 font-bold">{Math.floor(progress)}%</span>
           </div>
        </div>

      </div>
    </div>
  );
};