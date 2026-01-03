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
          // Visual X Calculation: Mirror if client
          const visualX = isMirrored ? 100 - p.x : p.x;
          // Facing: Player moves Right (1), Enemy moves Left (-1). Mirror flips this.
          // Projectile specific logic: If Target > Current, face right.
          // Since p.x increases or decreases, check direction relative to source
          // But simplified: projectiles travel FROM owner TO target.
          // If isPlayer, usually moving Right (targetX > x).
          // If isEnemy, usually moving Left (targetX < x).
          // Direction: +1 Right, -1 Left
          const moveDir = p.targetX > p.x ? 1 : -1;
          const facingScale = moveDir * (isMirrored ? -1 : 1);
          
          return (
             <div 
               key={p.id}
               className="absolute bottom-16 w-8 h-2 transition-transform duration-100 will-change-transform z-[150]"
               style={{
                   left: `${visualX}%`,
                   transform: `translate3d(-50%, -20px, 0) scaleX(${facingScale})`,
               }}
             >
                 {/* Arrow Graphic */}
                 <svg viewBox="0 0 40 10" className="w-full h-full overflow-visible drop-shadow-md">
                    <line x1="0" y1="5" x2="35" y2="5" stroke="#e5e7eb" strokeWidth="2" />
                    <path d="M30 2 L 38 5 L 30 8" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    {/* Feathers */}
                    <path d="M0 5 L 5 0 M 3 5 L 8 0 M 0 5 L 5 10 M 3 5 L 8 10" stroke="#bef264" strokeWidth="1.5" />
                    {/* Glow */}
                    <circle cx="38" cy="5" r="3" fill="#bef264" opacity="0.4" className="animate-pulse" />
                 </svg>
             </div>
          );
      })}

      {units.map((unit) => {
        const isPlayer = unit.side === 'player';
        const command = isPlayer ? p1Command : p2Command;
        const isRetreating = command === GameCommand.RETREAT;
        const isAttackingCommand = command === GameCommand.ATTACK;
        
        const isDying = unit.state === 'DYING';
        const isMining = unit.state === 'MINING' || unit.state === 'ATTACKING'; 
        const isDepositing = unit.state === 'DEPOSITING';
        const isSummoning = unit.type === UnitType.MAGE && (Date.now() - (unit.lastSummonTime || 0) < 1000);
        
        // Hide if retreating and at base (effectively "entered" the portal)
        const homeX = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
        if (isRetreating && Math.abs(unit.x - homeX) < 3 && !isDying) {
            return null;
        }
        
        // VISUAL LAYERING SYSTEM
        // Adjust "baseDepth" to control vertical stacking on the 2.5D plane.
        // Higher baseDepth = Higher up on screen = "Further Back" visually.
        
        let baseDepth = 40; 
        
        // If attacking, break rigid rows and randomize depth (except for workers)
        if (isAttackingCommand && unit.type !== UnitType.WORKER) {
             // Generate a stable pseudo-random number from the unit ID
             let hash = 0;
             for (let i = 0; i < unit.id.length; i++) {
                 hash = ((hash << 5) - hash) + unit.id.charCodeAt(i);
                 hash |= 0;
             }
             // Map hash to range 10 - 90
             baseDepth = (Math.abs(hash) % 80) + 10; 
        } else {
             // Rigid Formation Rows for Defense/Idle
             switch (unit.type) {
                case UnitType.SMALL:
                    baseDepth = 5; // Very front
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
            className={`absolute bottom-0 transition-transform duration-100 will-change-transform flex items-end justify-center ${isDying ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}
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
                isSummoning={isSummoning}
            />
          </div>
        );
      })}
    </div>
  );
};