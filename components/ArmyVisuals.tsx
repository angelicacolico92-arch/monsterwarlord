import React from 'react';
import { GameUnit } from '../types';
import { StickmanRender } from './StickmanRender';

interface ArmyVisualsProps {
  units: GameUnit[];
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
}

export const ArmyVisuals: React.FC<ArmyVisualsProps> = ({ units, selectedUnitId, onSelectUnit }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {units.map((unit) => {
        const isPlayer = unit.side === 'player';
        const isDying = unit.state === 'DYING';
        const isMining = unit.state === 'MINING' || unit.state === 'ATTACKING'; // Support legacy ATTACKING for now
        const isDepositing = unit.state === 'DEPOSITING';
        
        // Z-index based on Y position (simulated depth) or just ID to keep consistent
        // We'll use a random slight vertical offset for depth perception
        const depthOffset = parseInt(unit.id.slice(-2), 16) % 20; 

        return (
          <div 
            key={unit.id} 
            className={`absolute bottom-0 transition-transform duration-100 will-change-transform ${isDying ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDying) onSelectUnit?.(unit.id);
            }}
            style={{
               left: `${unit.x}%`,
               // Transform: 
               // 1. Center the unit horizontally (-50%)
               // 2. Flip if enemy
               // 3. Move up by depth offset
               transform: `translateX(-50%) scaleX(${isPlayer ? 1 : -1}) translateY(-${depthOffset}px)`,
               zIndex: isDying ? 0 : 100 - depthOffset, // Dying units go to back
               width: '80px',
               height: '80px'
            }}
          >
            {/* Health Bar (Hide if dying) */}
            <div 
                className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-700 rounded overflow-hidden ${unit.hp < unit.maxHp && !isDying ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                style={{ transform: `scaleX(${isPlayer ? 1 : -1})` }} // Prevent HP bar from flipping text direction if we had text
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
                color={isPlayer ? "#1a1a1a" : "#3f0000"} // Kept for legacy compatibility if needed
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