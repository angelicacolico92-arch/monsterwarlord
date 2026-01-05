
// ... existing imports
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnitType, GameUnit, GameState, GameCommand, PlayerRole, MapId, GameProjectile, StuckArrow } from './types';
// ... rest of imports

// ... CrystalRock and BaseStatue components unchanged

// --- GAME LOGIC CONSTANTS ---
// ... constants unchanged

export const App: React.FC = () => {
  // ... state definitions unchanged

  // ... useEffects and helper functions unchanged

  // Helper: Damage Calculation (unchanged)
  const applyDamage = (target: GameUnit, rawDamage: number, now: number, isBossAttack: boolean, allUnits: GameUnit[]) => {
      // ... same content
      let damageDealt = rawDamage;
      if (target.type === UnitType.PALADIN) damageDealt *= 0.7; 
      if (target.type === UnitType.BOSS) {
          const lowHp = target.hp < target.maxHp * 0.4;
          damageDealt *= (1 - (lowHp ? 0.20 : 0.15));
      }
      // Imperial Slime Phalanx
      if (target.type === UnitType.TOXIC) {
          const nearbyAllies = allUnits.filter(u => u.side === target.side && u.type === UnitType.TOXIC && u.id !== target.id && Math.abs(u.x - target.x) < 5).length;
          damageDealt *= (1 - Math.min(nearbyAllies * 0.1, 0.3));
      }
      target.hp -= damageDealt;
      target.lastDamageTime = now;
      target.lastDamageAmount = Math.floor(damageDealt);
  };

  // --- MAIN GAME LOOP ---
  useEffect(() => {
    if ((role !== PlayerRole.HOST && role !== PlayerRole.OFFLINE) || appMode !== 'GAME') return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const currentState = stateRef.current;
      const deltaTime = Math.min((now - currentState.lastTick) / 1000, 0.05);
      
      if (currentState.gameStatus !== 'PLAYING') return;

      // Shallow copies for mutation during this tick
      let nextUnits = currentState.units.map(u => ({ ...u }));
      let nextProjectiles = currentState.projectiles ? currentState.projectiles.map(p => ({ ...p })) : [];
      let nextPlayerStatueStuckArrows = [...(currentState.playerStatueStuckArrows || [])];
      let nextEnemyStatueStuckArrows = [...(currentState.enemyStatueStuckArrows || [])];
      
      let { playerStatueHP, enemyStatueHP, p1Gold, p2Gold, p1Command, p2Command } = currentState;
      let newSummons: GameUnit[] = [];

      // 1. Process Action Queue (unchanged)
      while (actionQueueRef.current.length > 0) {
        const action = actionQueueRef.current.shift();
        if (action.type === 'RECRUIT') {
          const config = UNIT_CONFIGS[action.unitType as UnitType];
          const isP1 = action.side === 'player';
          const sideUnits = nextUnits.filter(u => u.side === action.side && u.state !== 'DYING').length;
          const currentSideGold = isP1 ? p1Gold : p2Gold;
          
          if (sideUnits < MAX_UNITS && currentSideGold >= config.cost) {
            if (isP1) p1Gold -= config.cost; else p2Gold -= config.cost;
            nextUnits.push({
              id: Math.random().toString(36).substr(2, 9),
              type: action.unitType,
              side: action.side,
              x: action.side === 'player' ? SPAWN_X_PLAYER : SPAWN_X_ENEMY,
              hp: config.stats.hp,
              maxHp: config.stats.hp,
              state: 'WALKING',
              lastAttackTime: 0,
              currentSpeed: 0,
              hasGold: false,
              stuckArrows: []
            });
            AudioService.playRecruit();
          }
        } else if (action.type === 'CHANGE_COMMAND') {
          if (action.side === 'player') p1Command = action.command; else p2Command = action.command;
        }
      }

      // 2. Process Projectiles
      nextProjectiles = nextProjectiles.filter(p => {
          const dir = p.targetX > p.x ? 1 : -1;
          p.x += dir * p.speed * deltaTime;
          
          // Bounds check
          if (p.x < 0 || p.x > 100) return false;

          const dist = Math.abs(p.x - p.targetX);
          if (dist < 1.5) {
              let targetUnit = nextUnits.find(u => u.id === p.targetId && u.state !== 'DYING' && u.state !== 'GARRISONED');
              let hit = false;

              if (p.visualType === 'ARROW') {
                  if (targetUnit) {
                      hit = true;
                      applyDamage(targetUnit, p.damage, now, false, nextUnits);
                      
                      // Add Stuck Arrow to Unit with Side-Specific Placement
                      const currentArrows = targetUnit.stuckArrows || [];
                      if (currentArrows.length < 5) {
                          // Always stick to the "front" of the unit (Visual Left, SVG Right)
                          // regardless of direction, as projectile always hits the front in this simple linear combat.
                          // Positive X (10-25) relative to center in SVG space hits the face.
                          const impactX = 10 + Math.random() * 15;
                          
                          const impactY = (Math.random() * 30) - 10; // -10 to 20
                          // Angle ~180 points the arrow "inward" from the right side in SVG space
                          const impactAngle = 180 + (Math.random() * 30 - 15);

                          targetUnit.stuckArrows = [...currentArrows, {
                              id: Math.random().toString(36),
                              x: impactX,
                              y: impactY,
                              angle: impactAngle,
                              variant: 'phys'
                          }];
                      }
                      AudioService.playImpact('PHYSICAL');
                  } else {
                      // Check Statue Hit
                      const targetStatueX = p.side === 'player' ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
                      if (Math.abs(p.x - targetStatueX) < 3) {
                           hit = true;
                           if (p.side === 'player') enemyStatueHP -= p.damage; else playerStatueHP -= p.damage;
                           // Add Stuck Arrow to Statue
                           const arrow = {
                               id: Math.random().toString(36),
                               x: Math.random() * 60 + 20,
                               y: Math.random() * 60 + 20,
                               angle: (Math.random() * 30 - 15),
                               variant: 'phys' as const
                           };
                           if (p.side === 'player') nextEnemyStatueStuckArrows.push(arrow);
                           else nextPlayerStatueStuckArrows.push(arrow);
                           
                           AudioService.playImpact('PHYSICAL');
                      } else {
                           hit = true; // Missed
                      }
                  }
              } else {
                  // Magic (Splash) logic unchanged
                  if (!targetUnit) targetUnit = nextUnits.find(u => u.side !== p.side && u.state !== 'DYING' && Math.abs(u.x - p.x) < 2);
                  if (targetUnit) {
                      hit = true;
                      applyDamage(targetUnit, p.damage, now, false, nextUnits);
                      AudioService.playImpact('MAGIC');
                  } else {
                     const statueX = p.side === 'player' ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
                     if (Math.abs(p.x - statueX) < 3) {
                         hit = true;
                         if (p.side === 'player') enemyStatueHP -= p.damage; else playerStatueHP -= p.damage;
                         AudioService.playImpact('MAGIC');
                     }
                  }
              }
              return !hit;
          }
          return true;
      });

      // 3. Update Units (Logic unchanged)
      nextUnits.forEach(unit => {
        if (unit.state === 'DYING') return;
        const config = UNIT_CONFIGS[unit.type];
        const isPlayer = unit.side === 'player';
        const cmd = isPlayer ? p1Command : p2Command;
        
        // Status Effects
        if (unit.stunnedUntil && unit.stunnedUntil > now) { unit.state = 'IDLE'; return; }
        if (unit.rootedUntil && unit.rootedUntil > now) { 
            unit.currentSpeed = 0;
            unit.hp -= 0.1; // Root DoT
        }

        // Mage Summon Ability
        if (unit.type === UnitType.MAGE && now - (unit.lastSummonTime || 0) > 10000) {
             const allies = nextUnits.filter(u => u.side === unit.side && u.state !== 'DYING').length;
             if (allies < MAX_UNITS) {
                newSummons.push({
                   id: Math.random().toString(36), type: UnitType.SMALL, side: unit.side,
                   x: unit.x + (isPlayer ? 5 : -5), hp: 60, maxHp: 60, state: 'WALKING',
                   lastAttackTime: 0, currentSpeed: 0, stuckArrows: []
                });
                unit.lastSummonTime = now;
                AudioService.playSummon();
             }
        }

        // Retreat Logic
        if (cmd === GameCommand.RETREAT) {
             const homeX = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
             if (Math.abs(unit.x - homeX) < 2) {
                 unit.state = 'GARRISONED';
                 unit.hp = Math.min(unit.hp + unit.maxHp * 0.005, unit.maxHp);
             } else {
                 unit.state = 'WALKING';
                 unit.currentSpeed += ((unit.x < homeX ? 1 : -1) * config.stats.speed - unit.currentSpeed) * 0.1;
                 unit.x += unit.currentSpeed * deltaTime;
             }
             return;
        } else if (unit.state === 'GARRISONED') {
            unit.state = 'IDLE';
        }

        // Worker Mining Logic
        if (unit.type === UnitType.WORKER) {
            const mineX = isPlayer ? GOLD_MINE_PLAYER_X : GOLD_MINE_ENEMY_X;
            const statueX = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
            if (unit.state === 'MINING') {
                if (now - unit.lastAttackTime > config.stats.attackSpeed) { unit.hasGold = true; unit.state = 'WALKING'; }
            } else if (unit.state === 'DEPOSITING') {
                if (now - unit.lastAttackTime > 500) {
                    if (isPlayer) p1Gold += 20; else p2Gold += 20;
                    unit.hasGold = false; unit.state = 'WALKING';
                }
            } else {
                const target = unit.hasGold ? statueX : mineX;
                if (Math.abs(unit.x - target) < 2) {
                    unit.state = unit.hasGold ? 'DEPOSITING' : 'MINING';
                    unit.lastAttackTime = now;
                } else {
                    unit.currentSpeed += ((unit.x < target ? 1 : -1) * config.stats.speed - unit.currentSpeed) * 0.1;
                    unit.x += unit.currentSpeed * deltaTime;
                }
            }
            return;
        }

        // Combat Logic
        const dir = isPlayer ? 1 : -1;
        const targets = nextUnits.filter(u => u.side !== unit.side && u.state !== 'DYING' && u.state !== 'GARRISONED');
        const visibleTargets = targets.filter(u => Math.abs(u.x - unit.x) < 30);
        
        // Target selection
        visibleTargets.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x));
        const primaryTarget = visibleTargets.find(u => Math.abs(u.x - unit.x) <= config.stats.range);
        
        // Base Siege
        const statueTargetX = isPlayer ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
        const canSiege = cmd === GameCommand.ATTACK && Math.abs(unit.x - statueTargetX) < config.stats.range + 1;

        if (primaryTarget || canSiege) {
            unit.state = 'ATTACKING';
            unit.currentSpeed = 0;
            if (now - unit.lastAttackTime > config.stats.attackSpeed) {
                if (unit.type === UnitType.ARCHER) {
                    // Fire Arrow
                    nextProjectiles.push({
                        id: `arrow-${unit.id}-${now}`, x: unit.x, startX: unit.x,
                        targetX: primaryTarget ? primaryTarget.x : statueTargetX,
                        targetId: primaryTarget?.id, damage: config.stats.damage,
                        speed: 45 + Math.random() * 5, side: unit.side, visualType: 'ARROW', createdAt: now
                    });
                } else {
                    // Melee/Mage Instant Damage
                    if (primaryTarget) {
                        applyDamage(primaryTarget, config.stats.damage, now, false, nextUnits);
                        if (unit.type === UnitType.BOSS) { // Cleave
                             visibleTargets.filter(t => Math.abs(t.x - unit.x) < 4).forEach(t => applyDamage(t, 20, now, true, nextUnits));
                        }
                    } else if (canSiege) {
                        if (isPlayer) enemyStatueHP -= config.stats.damage; else playerStatueHP -= config.stats.damage;
                    }
                }
                AudioService.playAttack(unit.type);
                unit.lastAttackTime = now;
            }
        } else {
            // Movement Logic
            unit.state = 'WALKING';
            let targetV = 0;
            if (cmd === GameCommand.DEFEND) {
                const defX = isPlayer ? GOLD_MINE_PLAYER_X + 15 : GOLD_MINE_ENEMY_X - 15;
                const offset = FORMATION_OFFSETS[unit.type] || 0;
                const tx = isPlayer ? defX - offset : defX + offset;
                if (Math.abs(unit.x - tx) > 1) targetV = (unit.x < tx ? 1 : -1) * config.stats.speed;
            } else {
                // Chase or March
                if (visibleTargets.length > 0) {
                    targetV = (unit.x < visibleTargets[0].x ? 1 : -1) * config.stats.speed;
                } else {
                    targetV = dir * config.stats.speed;
                }
            }
            if (unit.rootedUntil && unit.rootedUntil > now) targetV = 0;
            
            const agility = UNIT_AGILITY[unit.type] || 5;
            unit.currentSpeed += (targetV - unit.currentSpeed) * (1 - Math.exp(-agility * deltaTime));
            unit.x += unit.currentSpeed * deltaTime;
        }
      });

      // 4. AI Logic (unchanged)
      if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
          if (now - aiStateRef.current.lastDecisionTime > 2000) {
              const aiWorkers = nextUnits.filter(u => u.side === 'enemy' && u.type === UnitType.WORKER).length;
              if (aiWorkers < 6 && p2Gold >= UNIT_CONFIGS[UnitType.WORKER].cost) {
                  actionQueueRef.current.push({ type: 'RECRUIT', unitType: UnitType.WORKER, side: 'enemy' });
              } else if (p2Gold >= 150) {
                  const types = [UnitType.TOXIC, UnitType.ARCHER, UnitType.PALADIN, UnitType.MAGE, UnitType.BOSS];
                  const rnd = types[Math.floor(Math.random() * types.length)];
                  if (p2Gold >= UNIT_CONFIGS[rnd].cost) {
                      actionQueueRef.current.push({ type: 'RECRUIT', unitType: rnd, side: 'enemy' });
                  }
              }
              
              const armySize = nextUnits.filter(u => u.side === 'enemy' && u.type !== UnitType.WORKER).length;
              if (aiStateRef.current.state === 'GATHERING' && armySize > 5) {
                  aiStateRef.current.state = 'ATTACKING';
                  actionQueueRef.current.push({ type: 'CHANGE_COMMAND', side: 'enemy', command: GameCommand.ATTACK });
              } else if (aiStateRef.current.state === 'ATTACKING' && armySize < 2) {
                  aiStateRef.current.state = 'GATHERING';
                  actionQueueRef.current.push({ type: 'CHANGE_COMMAND', side: 'enemy', command: GameCommand.DEFEND });
              }
              aiStateRef.current.lastDecisionTime = now;
          }
      }

      // 5. Merge & Cleanup
      if (nextUnits.length < MAX_UNITS * 2) nextUnits.push(...newSummons);

      nextUnits = nextUnits.filter(u => {
          if (u.hp <= 0 && u.state !== 'DYING') { u.state = 'DYING'; u.deathTime = now; AudioService.playDeath(); }
          return !(u.state === 'DYING' && now - (u.deathTime || 0) > DEATH_DURATION);
      });

      const nextStatus = playerStatueHP <= 0 ? 'DEFEAT' : (enemyStatueHP <= 0 ? 'VICTORY' : 'PLAYING');
      if (nextStatus !== currentState.gameStatus) AudioService.playFanfare(nextStatus === 'VICTORY');

      // Final State Update (Safe: explicit object to avoid implicit callback interpretation)
      setGameState({
          ...currentState,
          units: nextUnits,
          projectiles: nextProjectiles,
          playerStatueHP, 
          enemyStatueHP,
          p1Gold, 
          p2Gold, 
          p1Command, 
          p2Command, 
          gameStatus: nextStatus,
          playerStatueStuckArrows: nextPlayerStatueStuckArrows, 
          enemyStatueStuckArrows: nextEnemyStatueStuckArrows,
          lastTick: now
      });

    }, TICK_RATE);
    
    return () => clearInterval(intervalId);
  }, [role, appMode]);

  // ... rest of file unchanged
  return (
    <div className="h-[100dvh] w-screen bg-black overflow-hidden relative">
        <div ref={viewportRef} className="absolute inset-0">
             {content}
        </div>
    </div>
  );
};
