import React from 'react';
import { GameUnit, UnitType } from '../types';
import { StickmanRender } from './StickmanRender';
import { STATUE_PLAYER_POS, STATUE_ENEMY_POS } from '../constants';

interface ArmyVisualsProps {
  units: GameUnit[];
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
  isMirrored?: boolean;
  p1Retreating?: boolean;
  p2Retreating?: boolean;
}

export const ArmyVisuals: React.FC<ArmyVisualsProps> = ({ units, selectedUnitId, onSelectUnit, isMirrored = false, p1Retreating = false, p2Retreating = false }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {units.map((unit) => {
        const isPlayer = unit.side === 'player';
        const isDying = unit.state === 'DYING';
        const isMining = unit.state === 'MINING' || unit.state === 'ATTACKING'; 
        const isDepositing = unit.state === 'DEPOSITING';
        
        // Hide if retreating and at base (effectively "entered" the portal)
        const isRetreating = isPlayer ? p1Retreating : p2Retreating;
        const homeX = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
        if (isRetreating && Math.abs(unit.x - homeX) < 2.5 && !isDying) {
            return null;
        }
        
        // VISUAL LAYERING SYSTEM (Slide 2)
        // Adjust "baseDepth" to control vertical stacking on the 2.5D plane.
        // Higher baseDepth = Higher up on screen = "Further Back" visually.
        
        let baseDepth = 40; 
        
        switch (unit.type) {
            case UnitType.SMALL:
                baseDepth = 5; // Very front, below toxic? or interspersed.
                break;
            case UnitType.TOXIC:
                baseDepth = 10; // Row 1 (Front)
                break;
            case UnitType.PALADIN:
                baseDepth = 30; // Row 2
                break;
            case UnitType.ARCHER:
                baseDepth = 50; // Row 3
                break;
            case UnitType.MAGE:
                baseDepth = 70; // Row 4
                break;
            case UnitType.BOSS:
                baseDepth = 90; // Row 5 (Back)
                break;
            case UnitType.WORKER:
                baseDepth = 80; // Workers stay back/around mines
                break;
            default:
                baseDepth = 40;
        }

        const depthOffset = baseDepth;

        // Calculate visual position
        // If mirrored (Client view), the world is flipped horizontally: x -> 100 - x
        const visualX = isMirrored ? 100 - unit.x : unit.x;

        // Calculate facing scale
        // Standard (Host): Player(Blue)=1 (Right), Enemy(Red)=-1 (Left)
        // Mirrored (Client): Player(Blue)=-1 (Left), Enemy(Red)=1 (Right)
        const facingScale = (isPlayer ? 1 : -1) * (isMirrored ? -1 : 1);

        // We use transform for centering (-50%), depth offset (Y), and facing direction.
        const transformString = `translate3d(-50%, -${depthOffset}px, 0) scaleX(${facingScale})`;
        
        // Damage Number Logic
        const showDamage = unit.lastDamageTime && (Date.now() - unit.lastDamageTime < 600);
        
        // Clamp HP bar calculation
        const hpPercent = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));

        // Scale Adjustments for different unit types
        let unitScale = 0.8;
        if (unit.type === UnitType.SMALL) unitScale = 0.5;

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
            {/* Health Bar - Apply facingScale again to flip it back to "normal" if unit is flipped */}
            <div 
                className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-700 rounded overflow-hidden ${hpPercent < 100 && !isDying ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                style={{ transform: `scaleX(${facingScale})` }} 
            >
                <div 
                    className={`h-full ${isPlayer ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            
            {/* Damage Floating Text */}
            {showDamage && (
                 <div 
                    key={`${unit.id}-dmg-${unit.lastDamageTime}`}
                    className="absolute top-0 left-1/2 -translate-x-1/2 text-white font-black text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] animate-float-damage z-50 pointer-events-none whitespace-nowrap"
                    style={{ transform: `scaleX(${facingScale})`, textShadow: '2px 2px 0 #cc0000' }}
                 >
                    -{unit.lastDamageAmount}
                 </div>
            )}

            <StickmanRender 
                type={unit.type} 
                scale={unitScale} 
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