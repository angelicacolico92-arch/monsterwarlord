
import React from 'react';
import { GameUnit, GameProjectile, UnitType, GameCommand } from '../types';
import { StickmanRender } from './StickmanRender';

interface ArmyVisualsProps {
  units: GameUnit[];
  projectiles?: GameProjectile[];
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
  isMirrored?: boolean;
  p1Command: GameCommand;
  p2Command: GameCommand;
}

const getUnitBaseDepth = (unit: GameUnit, command: GameCommand) => {
    if (unit.type === UnitType.WORKER) return 80;
    if (command === GameCommand.ATTACK) {
        let hash = 0;
        for (let i = 0; i < unit.id.length; i++) hash = ((hash << 5) - hash) + unit.id.charCodeAt(i);
        return (Math.abs(hash) % 80) + 10;
    }
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
          const isPlayerSide = p.side === 'player';
          const visualX = isMirrored ? 100 - p.x : p.x;
          
          // Visual Facing: Player arrows always face RIGHT, Enemy arrows always face LEFT (unless mirrored view flips it)
          // Actually, let's strictly follow the rule: "Player arrows face right, enemy arrows face left" relative to the game logic
          // If mirrored (Client view): Player (Host) is on right, Enemy (Client) is on left? No, Client is usually P2.
          // Let's stick to: visual direction matches movement.
          // If p.targetX > p.x (Moving Right) -> Face Right.
          // If p.targetX < p.x (Moving Left) -> Face Left.
          
          const moveDir = p.targetX > p.x ? 1 : -1;
          const visualDir = moveDir * (isMirrored ? -1 : 1); // Flip visual direction if view is mirrored

          let hash = 0;
          for (let i = 0; i < p.id.length; i++) hash = ((hash << 5) - hash) + p.id.charCodeAt(i);
          const laneJitter = (Math.abs(hash) % 20) - 10;

          let yOffset = -20;
          let rotation = 0;

          if (p.visualType === 'ARROW') {
              const totalDist = Math.abs(p.targetX - p.startX);
              const currentDist = Math.abs(p.x - p.startX);
              
              if (totalDist > 0) {
                  const progress = Math.min(1, Math.max(0, currentDist / totalDist));
                  const maxArcHeight = Math.min(10, totalDist * 0.2); 
                  const arcY = 4 * maxArcHeight * progress * (1 - progress);
                  yOffset = -35 - arcY + laneJitter; 
                  
                  // Calculate slope for rotation
                  const slope = 4 * maxArcHeight * (1 - 2 * progress);
                  // Basic rotation based on arc slope
                  rotation = -Math.atan(slope / 50) * (180 / Math.PI);
                  // Correct rotation based on direction
                  if (visualDir === -1) rotation = -rotation; 
              }
          } else {
             // Magic logic
             yOffset = -40 + laneJitter;
          }
          
          return (
             <div 
               key={p.id}
               className="absolute bottom-16 w-10 h-3 transition-transform duration-100 will-change-transform z-[110]"
               style={{
                   left: `${visualX}%`,
                   transform: `translate3d(-50%, ${yOffset}px, 0) scaleX(${visualDir}) rotate(${rotation}deg)`,
               }}
             >
                 {p.visualType === 'ARROW' ? (
                     <svg viewBox="0 0 40 10" className="w-full h-full overflow-visible drop-shadow-sm">
                        <line x1="-5" y1="5" x2="20" y2="5" stroke="#fff" strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="4 2" />
                        <line x1="2" y1="5" x2="35" y2="5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M32 3 L 40 5 L 32 7 L 34 5 Z" fill="#34d399" stroke="none" /> {/* Single Head */}
                        <path d="M8 5 L 2 2 L 2 8 Z" fill="#facc15" stroke="#a16207" strokeWidth="0.2" />
                     </svg>
                 ) : (
                     <div className="w-4 h-4 rounded-full bg-purple-500 blur-sm animate-pulse shadow-[0_0_10px_#a855f7]"></div>
                 )}
             </div>
          );
      })}

      {units.map((unit) => {
        if (unit.state === 'GARRISONED') return null;

        const isPlayer = unit.side === 'player';
        const command = isPlayer ? p1Command : p2Command;
        const isDying = unit.state === 'DYING';
        
        let depthOffset = getUnitBaseDepth(unit, command);
        if (unit.targetId) {
            const target = units.find(u => u.id === unit.targetId);
            if (target) {
                const targetCommand = target.side === 'player' ? p1Command : p2Command;
                const targetDepth = getUnitBaseDepth(target, targetCommand);
                let hash = 0;
                for (let i = 0; i < unit.id.length; i++) hash = ((hash << 5) - hash) + unit.id.charCodeAt(i);
                depthOffset = Math.max(5, Math.min(95, targetDepth + ((Math.abs(hash) % 10) - 5)));
            }
        }

        const visualX = isMirrored ? 100 - unit.x : unit.x;
        const facingScale = (isPlayer ? 1 : -1) * (isMirrored ? -1 : 1);
        const transformString = `translate3d(-50%, -${depthOffset}px, 0) scaleX(${facingScale})`;
        
        const showDamage = unit.lastDamageTime && (Date.now() - unit.lastDamageTime < 600);
        const hpPercent = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));

        let unitScale = 0.8;
        if (unit.type === UnitType.SMALL) unitScale = 0.5;

        return (
          <div 
            key={unit.id} 
            className={`absolute bottom-0 transition-transform duration-500 ease-in-out will-change-transform flex items-end justify-center ${isDying ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}
            onClick={(e) => { e.stopPropagation(); if (!isDying) onSelectUnit?.(unit.id); }}
            style={{
               left: `${visualX}%`,
               transform: transformString,
               zIndex: isDying ? 0 : 100 - Math.floor(depthOffset),
               width: '80px',
               height: '80px'
            }}
          >
            {/* Health Bar */}
            <div 
                className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-700 rounded overflow-hidden ${hpPercent < 100 && !isDying ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                style={{ transform: `scaleX(${facingScale})` }} 
            >
                <div className={`h-full ${isPlayer ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${hpPercent}%` }} />
            </div>
            
            {showDamage && (
                 <div 
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
                isMining={unit.state === 'MINING' || unit.state === 'ATTACKING'}
                isDepositing={unit.state === 'DEPOSITING'}
                isMoving={unit.state === 'WALKING' && !unit.rootedUntil} 
                isDying={isDying}
                isSelected={selectedUnitId === unit.id}
                hasGold={unit.hasGold}
                isSummoning={unit.type === UnitType.MAGE && (Date.now() - (unit.lastSummonTime || 0) < 1000)}
                isFirebursting={unit.type === UnitType.MAGE && (Date.now() - (unit.lastAbility1Time || 0) < 1000)}
                isBossAbility={unit.type === UnitType.BOSS && (Date.now() - (unit.lastAbility2Time || 0) < 1000)}
                isRooted={!!unit.rootedUntil && unit.rootedUntil > Date.now()}
                lastAttackTime={unit.lastAttackTime}
                stuckArrows={unit.stuckArrows}
            />
          </div>
        );
      })}
    </div>
  );
};
