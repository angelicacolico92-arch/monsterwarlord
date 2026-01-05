
import React from 'react';
import { UnitType, UnitConfig } from '../types';
import { StickmanRender } from './StickmanRender';
import { Gem } from 'lucide-react';

interface UnitCardProps {
  unit: UnitConfig;
  count: number;
  canAfford: boolean;
  onRecruit: (type: UnitType) => void;
  variant?: 'BLUE' | 'RED';
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, canAfford, onRecruit, variant = 'BLUE' }) => {
  const isRed = variant === 'RED';
  
  return (
    <button
      className={`
        group relative flex flex-col items-center justify-center p-1.5 rounded-lg border-b-[3px] active:border-b-0 active:translate-y-[3px] transition-all select-none
        ${canAfford 
            ? 'bg-stone-800 border-stone-950 hover:bg-stone-700 cursor-pointer shadow-lg active:shadow-none' 
            : 'bg-stone-900 border-black opacity-40 cursor-not-allowed filter grayscale'}
        w-[72px] h-[80px]
      `}
      onClick={() => canAfford && onRecruit(unit.type)}
    >
      {/* Unit Icon Container */}
      <div className={`
          relative h-10 w-10 rounded border mb-1.5 overflow-hidden
          ${isRed ? 'bg-gradient-to-br from-red-900/40 to-red-800/40 border-red-500/30' : 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-500/30'}
          flex items-center justify-center
      `}>
           <div className="transform translate-y-1">
              <StickmanRender type={unit.type} scale={0.6} color="#000" isPlayer={!isRed} />
           </div>
      </div>

      {/* Cost Label */}
      <div className={`
          flex items-center gap-1 text-[11px] font-bold font-mono leading-none
          ${canAfford ? 'text-cyan-300' : 'text-stone-500'}
      `}>
          <Gem size={10} className={canAfford ? "text-cyan-400" : "text-stone-600"} fill="currentColor" /> 
          {unit.cost}
      </div>
    </button>
  );
};
