import React from 'react';
import { GameUnit, UnitType } from '../types';
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
        
        // Single Line Formation: Fixed rows, no random jitter to ensure clean lines.
        
        // Row Logic: Depth offset (pixels from bottom)
        // 1st row (Front): Toxic
        // 2nd row: Paladin
        // 3rd row: Archer & Gargoyle
        // 4th row: Mage
        // 5th row (Back): Boss
        // Miner: Back near mines
        
        let baseDepth = 40; 
        
        switch (unit.type) {
            case UnitType.TOXIC:
                baseDepth = 10; // 1st Row (Front/Bottom)
                break;
            case UnitType.PALADIN:
                baseDepth = 25; // 2nd Row
                break;
            case UnitType.ARCHER:
                baseDepth = 40; // 3rd Row
                break;
            case UnitType.GARGOYLE:
                baseDepth = 45; // 3rd Row (Flying slightly above Archers)
                break;
            case UnitType.MAGE:
                baseDepth = 55; // 4th Row
                break;
            case UnitType.BOSS:
                baseDepth = 70; // Last Row
                break;
            case UnitType.WORKER:
                baseDepth = 85; // Furthest back to align with mines
                break;
            default:
                baseDepth = 40;
        }

        const depthOffset = baseDepth; // Removed jitter for strict single line

        // Calculate visual position
        // If mirrored (Client view), the world is flipped horizontally: x -> 100 - x
        const visualX = isMirrored ? 100 - unit.x : unit.x;

        // Calculate facing scale
        // Standard (Host): Player(Blue)=1 (Right), Enemy(Red)=-1 (Left)
        // Mirrored (Client): Player(Blue)=-1 (Left), Enemy(Red)=1 (Right)
        const facingScale = (isPlayer ? 1 : -1) * (isMirrored ? -1 : 1);

        // We use transform for centering (-50%), depth offset (Y), and facing direction.
        const transformString = `translate3d(-50%, -${depthOffset}px, 0) scaleX(${facingScale})`;

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
               transform: transformString,
               zIndex: isDying ? 0 : 200 - depthOffset, // Closer units (lower offset) have higher Z to appear in front
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