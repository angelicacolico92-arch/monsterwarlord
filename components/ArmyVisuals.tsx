import React from 'react';
import { GameUnit, GameProjectile, UnitType, GameCommand } from '../types';
import { StickmanRender } from './StickmanRender';
import { STATUE_PLAYER_POS, STATUE_ENEMY_POS } from '../constants';

interface ArmyVisualsProps {
  units: GameUnit[];
  projectiles?: GameProjectile[];
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
  isMirrored?: boolean;
  p1Command: GameCommand;
  p2Command: GameCommand;
}

// Determine the base visual depth (Y-position) of a unit based on its role and command.
const getUnitBaseDepth = (unit: GameUnit, command: GameCommand) => {
    // Workers always stay near the back/mines
    if (unit.type === UnitType.WORKER) return 80;

    // If attacking, they usually scramble in random lanes
    if (command === GameCommand.ATTACK) {
        let hash = 0;
        for (let i = 0; i < unit.id.length; i++) {
            hash = ((hash << 5) - hash) + unit.id.charCodeAt(i);
            hash |= 0;
        }
        return (Math.abs(hash) % 80) + 10;
    }

    // Defensive/Idle formations use rigid rows
    switch (unit.type) {
        case UnitType.SMALL: return 5;
        case UnitType.TOXIC: return 10;
        case UnitType.PALADIN: return 30;
        case UnitType.ARCHER: return 50;
        case UnitType.MAGE: return 70;
        case UnitType.BOSS: return 90;
        default: return 40;
    }
};

export const ArmyVisuals: React.FC<ArmyVisualsProps> = ({ 
  units, 
  projectiles = [],
  selectedUnitId, 
  onSelectUnit, 
  isMirrored = false, 
  p1Command,
  p2Command
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* RENDER PROJECTILES */}
      {projectiles.map(p => {
          const isPlayer = p.side === 'player';
          const visualX = isMirrored ? 100 - p.x : p.x;
          // Facing logic: standard +1 is Right, -1 is Left.
          // Projectile logic based on targetX vs currentX
          const moveDir = p.targetX > p.x ? 1 : -1;
          const facingScale = moveDir * (isMirrored ? -1 : 1);
          
          return (
             <div 
               key={p.id}
               className="absolute bottom-16 w-10 h-3 transition-transform duration-100 will-change-transform z-[150]"
               style={{
                   left: `${visualX}%`,
                   transform: `translate3d(-50%, -20px, 0) scaleX(${facingScale})`,
               }}
             >
                 {/* Arrow Graphic */}
                 <svg viewBox="0 0 40 10" className="w-full h-full overflow-visible drop-shadow-md">
                    <line x1="5" y1="5" x2="35" y2="5" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M32 2 L 40 5 L 32 8 L 34 5 Z" fill="#bef264" stroke="none" />
                    <path d="M10 5 L 2 1 L 4 5 Z" fill="#bef264" opacity="0.9" />
                    <path d="M10 5 L 2 9 L 4 5 Z" fill="#bef264" opacity="0.9" />
                    <circle cx="38" cy="5" r="3" fill="#bef264" opacity="0.3" className="animate-pulse" />
                 </svg>
             </div>
          );
      })}

      {units.map((unit) => {
        const isPlayer = unit.side === 'player';
        const command = isPlayer ? p1Command : p2Command;
        const isRetreating = command === GameCommand.RETREAT;
        
        const isDying = unit.state === 'DYING';
        const isMining = unit.state === 'MINING' || unit.state === 'ATTACKING'; 
        const isDepositing = unit.state === 'DEPOSITING';
        const isSummoning = unit.type === UnitType.MAGE && (Date.now() - (unit.lastSummonTime || 0) < 1000);
        const isFirebursting = unit.type === UnitType.MAGE && (Date.now() - (unit.lastAbility1Time || 0) < 1000);
        const isRooted = !!unit.rootedUntil && unit.rootedUntil > Date.now();
        
        // Hide if retreating and at base
        const homeX = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
        if (isRetreating && Math.abs(unit.x - homeX) < 3 && !isDying) {
            return null;
        }
        
        // VISUAL LAYERING SYSTEM
        // Calculate Base Depth
        let depthOffset = getUnitBaseDepth(unit, command);
        
        // TARGET ALIGNMENT LOGIC:
        // If unit has a specific target, override depth to align with that target's depth.
        if (unit.targetId) {
            const target = units.find(u => u.id === unit.targetId);
            if (target) {
                // Determine target's base depth based on their own command/type
                const targetCommand = target.side === 'player' ? p1Command : p2Command;
                const targetDepth = getUnitBaseDepth(target, targetCommand);
                
                // Add deterministic jitter based on unit ID so they don't perfectly overlap
                let hash = 0;
                for (let i = 0; i < unit.id.length; i++) {
                    hash = ((hash << 5) - hash) + unit.id.charCodeAt(i);
                    hash |= 0;
                }
                const jitter = (hash % 10) - 5; // +/- 5px spread
                
                depthOffset = Math.max(5, Math.min(95, targetDepth + jitter));
            }
        }

        // Calculate visual position
        const visualX = isMirrored ? 100 - unit.x : unit.x;
        const facingScale = (isPlayer ? 1 : -1) * (isMirrored ? -1 : 1);
        const transformString = `translate3d(-50%, -${depthOffset}px, 0) scaleX(${facingScale})`;
        
        // Damage Number Logic
        const showDamage = unit.lastDamageTime && (Date.now() - unit.lastDamageTime < 600);
        const hpPercent = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));

        // Scale Adjustments
        let unitScale = 0.8;
        if (unit.type === UnitType.SMALL) unitScale = 0.5;

        return (
          <div 
            key={unit.id} 
            className={`absolute bottom-0 transition-transform duration-300 will-change-transform flex items-end justify-center ${isDying ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDying) onSelectUnit?.(unit.id);
            }}
            style={{
               left: `${visualX}%`,
               transform: transformString,
               zIndex: isDying ? 0 : 200 - Math.floor(depthOffset), // Closer units (lower offset) have higher Z
               width: '80px',
               height: '80px'
            }}
          >
            {/* Health Bar */}
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
                isMoving={unit.state === 'WALKING' && !isRooted} // Stop walking anim if rooted
                isDying={isDying}
                isSelected={selectedUnitId === unit.id}
                hasGold={unit.hasGold}
                isSummoning={isSummoning}
                isFirebursting={isFirebursting}
                isRooted={isRooted}
            />
          </div>
        );
      })}
    </div>
  );
};