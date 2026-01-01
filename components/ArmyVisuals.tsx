import React from 'react';
import { GameUnit } from '../types';
import { StickmanRender } from './StickmanRender';

interface ArmyVisualsProps {
  units: GameUnit[];
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
  isMirrored?: boolean;
}

export const ArmyVisuals: React.FC<ArmyVisualsProps> = ({ units, selectedUnitId, onSelectUnit, isMirrored = false }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {units.map((unit) => {
        const isPlayer = unit.side === 'player';
        const isDying = unit.state === 'DYING';
        const isMining = unit.state === 'MINING' || unit.state === 'ATTACKING'; 
        const isDepositing = unit.state === 'DEPOSITING';
        
        const depthOffset = parseInt(unit.id.slice(-2), 16) % 20; 

        // Calculate visual position
        // If mirrored (Client view), the world is flipped horizontally: x -> 100 - x
        const visualX = isMirrored ? 100 - unit.x : unit.x;

        // Calculate facing scale
        // Standard (Host): Player(Blue)=1 (Right), Enemy(Red)=-1 (Left)
        // Mirrored (Client): Player(Blue)=-1 (Left), Enemy(Red)=1 (Right)
        const facingScale = (isPlayer ? 1 : -1) * (isMirrored ? -1 : 1);

        return (
          <div 
            key={unit.id} 
            className={`absolute bottom-0 transition-transform duration-100 will-change-transform ${isDying ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDying) onSelectUnit?.(unit.id);
            }}
            style={{
               left: `${visualX}%`,
               transform: `translateX(-50%) scaleX(${facingScale}) translateY(-${depthOffset}px)`,
               zIndex: isDying ? 0 : 100 - depthOffset,
               width: '80px',
               height: '80px'
            }}
          >
            {/* Health Bar */}
            <div 
                className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-700 rounded overflow-hidden ${unit.hp < unit.maxHp && !isDying ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                style={{ transform: `scaleX(${facingScale})` }} 
            >
                <div 
                    className={`h-full ${isPlayer ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
                />
            </div>

            <StickmanRender 
                type={unit.type} 
                scale={0.8} 
                isPlayer={isPlayer}
                color={isPlayer ? "#1a1a1a" : "#3f0000"} 
                isAttacking={unit.state === 'ATTACKING'} 
                isMining={isMining}
                isDepositing={isDepositing}
                isMoving={unit.state === 'WALKING'}
                isDying={isDying}
                isSelected={selectedUnitId === unit.id}
                hasGold={unit.hasGold}
            />
          </div>
        );
      })}
    </div>
  );
};