import React from 'react';
import { UnitType, UnitConfig } from '../types';
import { StickmanRender } from './StickmanRender';

interface UnitCardProps {
  unit: UnitConfig;
  count: number;
  canAfford: boolean;
  onRecruit: (type: UnitType) => void;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, count, canAfford, onRecruit }) => {
  return (
    <div 
      className={`
        relative p-2 rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all select-none
        ${canAfford 
            ? 'bg-stone-700 border-stone-900 hover:bg-stone-600 cursor-pointer shadow-lg' 
            : 'bg-stone-900 border-black opacity-50 cursor-not-allowed'}
      `}
      onClick={() => canAfford && onRecruit(unit.type)}
    >
      <div className="flex items-center gap-3">
        {/* Unit Icon Container - Gold Border style */}
        <div className={`
            h-16 w-16 flex-shrink-0 rounded bg-gradient-to-br from-blue-200 to-blue-400 border-2 
            ${canAfford ? 'border-yellow-500' : 'border-gray-700'} 
            flex items-center justify-center overflow-hidden
        `}>
             <StickmanRender type={unit.type} scale={0.7} color="#000" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold font-epic text-yellow-100 truncate">{unit.name}</h3>
                <span className="text-xs font-mono bg-black/40 px-1 rounded text-white">{count}</span>
            </div>
            
            <p className="text-[10px] text-stone-300 leading-tight truncate mb-1">{unit.description}</p>
            
            <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <span className="flex items-center gap-0.5"><span className="text-red-400">⚔</span> {unit.stats.damage}</span>
                <span className="flex items-center gap-0.5"><span className="text-green-400">❤</span> {unit.stats.hp}</span>
            </div>
        </div>
        
        {/* Cost Button Area */}
        <div className="flex flex-col items-end justify-center pl-2 border-l border-white/10">
            <div className={`text-sm font-bold ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                {unit.cost} 
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Gold</div>
        </div>
      </div>
    </div>
  );
};