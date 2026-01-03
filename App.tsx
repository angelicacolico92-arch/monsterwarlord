import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnitType, GameUnit, GameState, GameCommand, PlayerRole, MapId, GameProjectile } from './types';
import { 
  UNIT_CONFIGS, 
  SPAWN_X_PLAYER, 
  SPAWN_X_ENEMY, 
  STATUE_HP, 
  GOLD_MINE_PLAYER_X, 
  GOLD_MINE_ENEMY_X, 
  STATUE_PLAYER_POS, 
  STATUE_ENEMY_POS,
  MAX_UNITS,
  INITIAL_GOLD,
  INITIAL_GOLD_SURGE,
  FORMATION_OFFSETS
} from './constants';
import { StickmanRender } from './components/StickmanRender';
import { ArmyVisuals } from './components/ArmyVisuals';
import { LandingPage } from './components/LandingPage';
import { IntroSequence } from './components/IntroSequence';
import { MapSelection } from './components/MapSelection';
import { BattlefieldBackground } from './components/BattlefieldBackground';
import { AudioService } from './services/audioService';
import { mpService } from './services/multiplayerService';
import { Coins, Shield, Swords, Music, VolumeX, CornerDownLeft, Users, Flag } from 'lucide-react';

const GoldMine: React.FC<{ x: number; isFlipped?: boolean }> = ({ x, isFlipped }) => (
  <div 
    className="absolute bottom-20 w-32 h-32 z-0 pointer-events-none"
    style={{ left: `${x}%`, transform: 'translateX(-50%) translate3d(0,0,0)' }}
  >
     <div className={`w-full h-full ${isFlipped ? 'scale-x-[-1]' : ''}`}>
        <svg viewBox="0 0 100 100" className="drop-shadow-lg overflow-visible">
           <path d="M10 100 L 25 60 L 75 60 L 90 100 Z" fill="#44403c" stroke="#292524" strokeWidth="2" />
           <path d="M35 100 Q 50 60 65 100" fill="#1c1917" />
           <circle cx="30" cy="80" r="4" fill="#fbbf24" opacity="0.8" />
           <circle cx="70" cy="75" r="3" fill="#fbbf24" opacity="0.6" />
           <circle cx="50" cy="55" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
           <path d="M25 60 L 25 30" stroke="#78350f" strokeWidth="4" />
           <path d="M75 60 L 75 30" stroke="#78350f" strokeWidth="4" />
           <path d="M20 30 L 80 30" stroke="#78350f" strokeWidth="4" />
        </svg>
     </div>
  </div>
);

const BaseStatue: React.FC<{ x: number; hp: number; variant: 'BLUE' | 'RED'; isFlipped?: boolean; isRetreating?: boolean }> = ({ x, hp, variant, isFlipped, isRetreating }) => {
    const hpPercent = Math.max(0, (hp / STATUE_HP) * 100);
    const isRed = variant === 'RED';
    const primaryColor = isRed ? '#ef4444' : '#3b82f6';
    const darkColor = isRed ? '#7f1d1d' : '#1e3a8a';
    const lightColor = isRed ? '#fca5a5' : '#93c5fd';

    return (
        <div 
            className="absolute bottom-16 z-10 pointer-events-none origin-bottom transition-all duration-300"
            style={{ 
                left: `${x}%`, 
                transform: 'translateX(-50%) translate3d(0,0,0)',
                height: 'min(340px, 55vh)', 
                width: 'auto', 
                aspectRatio: '200 / 350'
            }}
        >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[140%] h-3 sm:h-4 bg-black/70 rounded-full border border-white/30 backdrop-blur-md overflow-hidden z-20 shadow-lg">
                <div 
                    className={`h-full transition-all duration-500 ease-out ${isRed ? 'bg-gradient-to-r from-red-600 to-rose-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} 
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            
            <div className={`w-full h-full relative ${isFlipped ? 'scale-x-[-1]' : ''}`}>
                <svg viewBox="0 0 200 350" className="w-full h-full overflow-visible drop-shadow-2xl">
                    <defs>
                        <linearGradient id={`slime-body-${variant}`} x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor={darkColor} />
                            <stop offset="40%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={lightColor} stopOpacity="0.9" />
                        </linearGradient>
                    </defs>

                    {/* PORTAL EFFECT - BEHIND */}
                    {isRetreating && (
                        <g className="animate-portal-spin" style={{ opacity: 0.6 }}>
                            {/* Swirling Rings */}
                             <path d="M100 100 A 100 100 0 0 1 100 300 A 100 100 0 0 1 100 100" 
                                   fill="none" stroke={primaryColor} strokeWidth="4" strokeDasharray="20 40" />
                             <path d="M100 130 A 70 70 0 0 0 100 270 A 70 70 0 0 0 100 130" 
                                   fill="none" stroke={lightColor} strokeWidth="6" strokeDasharray="30 30" />
                        </g>
                    )}

                    <path d="M20 340 Q 0 340 10 320 Q 50 300 100 310 Q 150 300 190 320 Q 200 340 180 340 Q 140 355 100 350 Q 60 355 20 340" 
                          fill={darkColor} opacity="0.8" />
                    <path 
                        d="M50 320 C 20 250, 40 150, 70 80 Q 100 50, 130 80 C 160 150, 180 250, 150 320 Q 100 340, 50 320 Z" 
                        fill={`url(#slime-body-${variant})`} 
                        stroke={lightColor} 
                        strokeWidth="2" 
                        strokeOpacity="0.5"
                    />
                    <circle cx="100" cy="70" r="25" fill="white" opacity="0.2" className="animate-pulse" />

                    {/* PORTAL EFFECT - FRONT/CENTER GLOW */}
                    {isRetreating && (
                         <circle cx="100" cy="200" r="0" fill={lightColor} opacity="0.4">
                             <animate attributeName="r" values="10;80" dur="1.5s" repeatCount="indefinite" />
                             <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
                         </circle>
                    )}
                </svg>
            </div>
        </div>
    );
};

const TICK_RATE = 20; 
const DEATH_DURATION = 1500;
const UNIT_AGILITY: Record<string, number> = {
  [UnitType.WORKER]: 10.0,
  [UnitType.SMALL]: 12.0,
  [UnitType.TOXIC]: 8.0,
  [UnitType.ARCHER]: 7.0,
  [UnitType.MAGE]: 5.0,
  [UnitType.PALADIN]: 4.0,
  [UnitType.BOSS]: 2.0
};

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'INTRO' | 'LANDING' | 'MAP_SELECT' | 'GAME'>('INTRO');
  const [role, setRole] = useState<PlayerRole>(PlayerRole.HOST);
  const [isSurgeMode, setIsSurgeMode] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [gameState, setGameState] = useState<GameState>({
    units: [],
    projectiles: [],
    playerStatueHP: STATUE_HP,
    enemyStatueHP: STATUE_HP,
    p1Gold: INITIAL_GOLD,
    p2Gold: INITIAL_GOLD,
    p1Command: GameCommand.DEFEND,
    p2Command: GameCommand.DEFEND,
    lastTick: Date.now(),
    gameStatus: 'PLAYING',
    mapId: MapId.FOREST
  });

  const stateRef = useRef(gameState);
  const aiStateRef = useRef({ lastDecisionTime: 0 });
  const actionQueueRef = useRef<any[]>([]);
  
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  const isMirrored = role === PlayerRole.CLIENT;
  const currentGold = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Gold : gameState.p2Gold;

  const getVisualX = useCallback((x: number) => isMirrored ? 100 - x : x, [isMirrored]);
  
  const handleReturnToMenu = useCallback(() => {
    setIsSurgeMode(false);
    mpService.destroy();
    setAppMode('LANDING');
  }, []);

  const toggleMusic = () => {
    if (isMusicEnabled) {
        AudioService.stopMusic();
        setIsMusicEnabled(false);
    } else {
        AudioService.startMusic();
        setIsMusicEnabled(true);
    }
  };

  // Helper function for damage calculation
  const applyDamage = (target: GameUnit, rawDamage: number, now: number, isBossAttack: boolean) => {
      let damageDealt = rawDamage;

      // PALADIN DAMAGE REDUCTION (Existing)
      if (target.type === UnitType.PALADIN) {
          damageDealt *= 0.7; 
      }
      
      // BOSS GELATIN ARMOR (New Passive)
      if (target.type === UnitType.BOSS) {
          // Reduces damage by 15-20%. Increases when HP < 40%.
          const lowHp = target.hp < target.maxHp * 0.4;
          const reduction = lowHp ? 0.20 : 0.15;
          damageDealt *= (1 - reduction);
      }

      target.hp -= damageDealt;
      target.lastDamageTime = now;
      target.lastDamageAmount = Math.floor(damageDealt);
  };

  // Unified Game Loop
  useEffect(() => {
    if ((role !== PlayerRole.HOST && role !== PlayerRole.OFFLINE) || appMode !== 'GAME') return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaTime = Math.min((now - stateRef.current.lastTick) / 1000, 0.05);
      
      let { units: nextUnits, projectiles: nextProjectiles, playerStatueHP: pStatueHP, enemyStatueHP: eStatueHP, p1Gold, p2Gold, p1Command, p2Command, gameStatus } = stateRef.current;
      if (gameStatus !== 'PLAYING') return;

      let processedUnits = nextUnits.map(u => ({ ...u }));
      let processedProjectiles = nextProjectiles ? nextProjectiles.map(p => ({ ...p })) : [];
      let newSummons: GameUnit[] = [];

      // Process Queue
      while (actionQueueRef.current.length > 0) {
        const action = actionQueueRef.current.shift();
        if (action.type === 'RECRUIT') {
          const config = UNIT_CONFIGS[action.unitType as UnitType];
          const isP1 = action.side === 'player';
          const currentSideUnits = processedUnits.filter(u => u.side === action.side && u.state !== 'DYING').length;

          if (currentSideUnits < MAX_UNITS && (isP1 ? p1Gold : p2Gold) >= config.cost) {
            if (isP1) p1Gold -= config.cost; else p2Gold -= config.cost;
            processedUnits.push({
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
              lastAbility1Time: 0,
              lastAbility2Time: 0,
              attackCount: 0
            });
            AudioService.playRecruit();
          }
        } else if (action.type === 'CHANGE_COMMAND') {
          if (action.side === 'player') p1Command = action.command; else p2Command = action.command;
        }
      }

      // --- PROJECTILE LOGIC ---
      processedProjectiles = processedProjectiles.filter(p => {
          // Move projectile
          const dir = p.targetX > p.x ? 1 : -1;
          p.x += dir * p.speed * deltaTime;

          // Check Bounds
          if (p.x < 0 || p.x > 100) return false;

          // Check Collision
          let hit = false;
          // Simple proximity check to target position (or any enemy unit in range?)
          // For reliability, we check if it passed the target X or is very close
          const dist = Math.abs(p.x - p.targetX);
          
          if (dist < 1) {
              hit = true;
              
              // Apply damage
              // Try to find the specific target first
              let targetUnit = processedUnits.find(u => u.id === p.targetId && u.state !== 'DYING');
              
              // If specific target is dead/gone, hit ANY enemy unit near the impact zone
              if (!targetUnit) {
                  targetUnit = processedUnits.find(u => 
                      u.side !== p.side && 
                      u.state !== 'DYING' && 
                      u.hp > 0 &&
                      Math.abs(u.x - p.x) < 2
                  );
              }

              if (targetUnit) {
                  applyDamage(targetUnit, p.damage, now, false);
              } else {
                 // Hit Statue?
                 const isPlayerProjectile = p.side === 'player';
                 const statueX = isPlayerProjectile ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
                 if (Math.abs(p.x - statueX) < 3) {
                     if (isPlayerProjectile) eStatueHP -= p.damage; else pStatueHP -= p.damage;
                     AudioService.playDamage();
                 }
              }
          }
          
          return !hit; // Keep if not hit
      });


      // Physics and Logic
      processedUnits.forEach(unit => {
        if (unit.state === 'DYING') return;
        const config = UNIT_CONFIGS[unit.type];
        const isPlayer = unit.side === 'player';
        let targetVelocity = 0;

        // Check Stun Status
        if (unit.stunnedUntil && unit.stunnedUntil > now) {
            unit.state = 'IDLE';
            unit.currentSpeed = 0;
            return; // Skip rest of logic
        }

        // Check Root Status (Shadow Grasp)
        if (unit.rootedUntil && unit.rootedUntil > now) {
            unit.state = 'IDLE';
            targetVelocity = 0;
            unit.currentSpeed = 0;
            
            // Apply Minor Dot while rooted (approx 10 dmg per second)
            // 20ms tick rate * 50 = 1000ms. 0.2 * 50 = 10 dmg.
            unit.hp -= 0.2;
            // No lastDamageTime update to avoid spamming text
            
            // Do NOT return here, allow attacks if in range, just movement is restricted.
            // But we need to bypass movement calculation below.
        }

        // Poison Logic
        if (unit.poisonTicks && unit.poisonTicks > 0) {
            if (now - (unit.lastPoisonTickTime || 0) > 1000) {
                unit.hp -= 15; // Poison tick damage
                unit.poisonTicks -= 1;
                unit.lastPoisonTickTime = now;
                unit.lastDamageTime = now;
                unit.lastDamageAmount = 15;
            }
        }

        // Mage Summoning Logic
        if (unit.type === UnitType.MAGE) {
          if (!unit.lastSummonTime) unit.lastSummonTime = now;
          if (now - unit.lastSummonTime > 10000) { // 10s cooldown
             const activeMinions = processedUnits.filter(u => u.side === unit.side && u.ownerId === unit.id && u.state !== 'DYING').length;
             // Only summon if total units for this side is less than MAX_UNITS
             const totalSideUnits = processedUnits.filter(u => u.side === unit.side && u.state !== 'DYING').length;
             
             if (activeMinions < 3 && totalSideUnits < MAX_UNITS) {
                AudioService.playSummon();
                newSummons.push({
                   id: Math.random().toString(36).substr(2, 9),
                   type: UnitType.SMALL,
                   side: unit.side,
                   x: unit.x + (isPlayer ? 5 : -5),
                   hp: UNIT_CONFIGS[UnitType.SMALL].stats.hp,
                   maxHp: UNIT_CONFIGS[UnitType.SMALL].stats.hp,
                   state: 'WALKING',
                   lastAttackTime: 0,
                   currentSpeed: 0,
                   ownerId: unit.id
                });
                unit.lastSummonTime = now;
             }
          }
        }

        // Determine active command for this unit's side
        const cmd = isPlayer ? p1Command : p2Command;

        // --- RETREAT LOGIC (High Priority - Applies to ALL units) ---
        if (cmd === GameCommand.RETREAT) {
             const homeX = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
             const distToHome = Math.abs(unit.x - homeX);
             
             // Move to tower
             if (distToHome < 2) {
                 unit.state = 'IDLE';
                 targetVelocity = 0;
             } else {
                 unit.state = 'WALKING';
                 targetVelocity = (unit.x < homeX ? 1 : -1) * config.stats.speed;
             }
        } 
        // --- Worker Mining Logic (Only if not retreating) ---
        else if (unit.type === UnitType.WORKER) {
          const minePos = isPlayer ? GOLD_MINE_PLAYER_X : GOLD_MINE_ENEMY_X;
          const statuePos = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
          const miningRange = 2;

          if (unit.state === 'MINING') {
            if (now - unit.lastAttackTime > config.stats.attackSpeed) { unit.hasGold = true; unit.state = 'WALKING'; }
          } else if (unit.state === 'DEPOSITING') {
            if (now - unit.lastAttackTime > 500) {
              if (isPlayer) p1Gold += 20; else p2Gold += 20;
              unit.hasGold = false;
              unit.state = 'WALKING';
            }
          } else {
            const targetPos = unit.hasGold ? statuePos : minePos;
            if (Math.abs(unit.x - targetPos) < miningRange) {
              unit.state = unit.hasGold ? 'DEPOSITING' : 'MINING';
              unit.lastAttackTime = now;
            } else {
              targetVelocity = (unit.x < targetPos ? 1 : -1) * config.stats.speed;
            }
          }
        } 
        // --- Combat Logic (Only if not retreating and not worker) ---
        else {
          const dir = isPlayer ? 1 : -1;
          const targetStatueX = isPlayer ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
             
          // TARGETING & AGGRO
          const AGGRO_RANGE = 30; // Vision range to start charging
          const potentialTargets = processedUnits.filter(u => u.side !== unit.side && u.state !== 'DYING');
          
          // 1. Identify Aggro Target (Visible enemy for charging)
          const visibleTargets = potentialTargets.filter(u => Math.abs(u.x - unit.x) < AGGRO_RANGE);
          visibleTargets.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x));
          const aggroTarget = visibleTargets.length > 0 ? visibleTargets[0] : null;

          // 2. Identify Attack Target (In range to hit)
          // We prioritize the aggro target if it's in range, otherwise closest in range
          const targetsInRange = visibleTargets.filter(u => Math.abs(u.x - unit.x) <= config.stats.range);
          const primaryTarget = targetsInRange.length > 0 ? targetsInRange[0] : null;

          // Set Visual Target ID (This triggers the depth/row change in visuals)
          unit.targetId = aggroTarget ? aggroTarget.id : null;

          // Attack Logic (Aggro or Base Siege)
          const canSiege = cmd === GameCommand.ATTACK && Math.abs(unit.x - targetStatueX) < config.stats.range + 1;
          const shouldAttack = !!primaryTarget || canSiege;
          
          // BOSS LOGIC: Last Goo Stand (Passive) - Enrage at low HP
          if (unit.type === UnitType.BOSS && unit.hp < unit.maxHp * 0.25 && !unit.isEnraged) {
              unit.isEnraged = true;
          }

          if (shouldAttack) {
            // ACTIVE ABILITIES (Boss & Mage)
            let abilityTriggered = false;
            
            // --- BOSS ABILITIES ---
            if (unit.type === UnitType.BOSS) {
                // Ability 2: Mega Slime Crash (25s Cooldown)
                if (!unit.lastAbility2Time) unit.lastAbility2Time = 0;
                if (now - unit.lastAbility2Time > 25000) {
                    const jumpTargetX = unit.x + (dir * 15);
                    const enemiesInJumpZone = potentialTargets.filter(u => Math.abs(u.x - jumpTargetX) < 6);
                    
                    if (enemiesInJumpZone.length > 0) {
                        unit.lastAbility2Time = now;
                        unit.x = Math.max(0, Math.min(100, jumpTargetX));
                        setShakeTrigger(now + 600);
                        AudioService.playAttack(UnitType.BOSS);
                        enemiesInJumpZone.forEach(target => {
                            target.hp -= 90;
                            target.lastDamageTime = now;
                            target.lastDamageAmount = 90;
                            target.stunnedUntil = now + 1500;
                        });
                        abilityTriggered = true;
                    }
                }

                // Ability 1: Slime Wave (10s Cooldown)
                if (!abilityTriggered) {
                    if (!unit.lastAbility1Time) unit.lastAbility1Time = 0;
                    if (now - unit.lastAbility1Time > 10000) {
                         const waveRange = 12;
                         const enemiesInLine = potentialTargets.filter(u => {
                             const dist = (u.x - unit.x) * dir;
                             return dist > 0 && dist < waveRange;
                         });
                         
                         if (enemiesInLine.length > 0) {
                             unit.lastAbility1Time = now;
                             AudioService.playSummon(); 
                             enemiesInLine.forEach(target => {
                                 target.hp -= 30;
                                 target.lastDamageTime = now;
                                 target.lastDamageAmount = 30;
                                 target.slowedUntil = now + 2000;
                             });
                             abilityTriggered = true;
                         }
                    }
                }
            }

            // --- MAGE ABILITIES ---
            if (unit.type === UnitType.MAGE && !abilityTriggered) {
                // Ability 1: Mystic Fireburst (AoE + Slow) - 15s Cooldown
                if (!unit.lastAbility1Time) unit.lastAbility1Time = 0;
                if (now - unit.lastAbility1Time > 15000) {
                    // Radius Increased to 10 so it actually hits frontline enemies from the mage's position
                    const burstRadius = 10; 
                    const burstTargets = potentialTargets.filter(u => Math.abs(u.x - unit.x) < burstRadius);
                    
                    if (burstTargets.length > 0) {
                        unit.lastAbility1Time = now;
                        AudioService.playAttack(UnitType.MAGE); // Reuse existing sound
                        burstTargets.forEach(target => {
                            applyDamage(target, 60, now, false);
                            target.slowedUntil = now + 3000; // 3s Slow
                        });
                        abilityTriggered = true;
                    }
                }

                // Ability 2: Shadow Grasp (Root) - 25s Cooldown
                if (!abilityTriggered) {
                    if (!unit.lastAbility2Time) unit.lastAbility2Time = 0;
                    if (now - unit.lastAbility2Time > 25000) {
                        if (primaryTarget) {
                            unit.lastAbility2Time = now;
                            primaryTarget.rootedUntil = now + 2500; // 2.5s Root
                            primaryTarget.lastDamageTime = now; // Flash red to show effect hit
                            abilityTriggered = true;
                            // Visuals handled by renderer checking rootedUntil prop
                        }
                    }
                }
            }

            if (!abilityTriggered) {
                unit.state = 'ATTACKING';
                targetVelocity = 0;
                
                // Effective stats (Enrage modifiers)
                let currentAttackSpeed = config.stats.attackSpeed;
                let currentDamage = config.stats.damage;
                if (unit.isEnraged) {
                    currentAttackSpeed *= 0.8; // 20% faster
                    currentDamage *= 1.1; // 10% more damage
                }

                if (now - unit.lastAttackTime > currentAttackSpeed) {
                    AudioService.playAttack(unit.type);
                    
                    if (primaryTarget) {
                        // Combat resolution
                        // If Boss, use AoE Basic Attack (Colossal Slam)
                        if (unit.type === UnitType.BOSS) {
                            const meleeTargets = targetsInRange.filter(u => Math.abs(u.x - unit.x) < config.stats.range);
                            
                            // Splatter Impact (Passive): Every 3rd attack
                            const attackCount = (unit.attackCount || 0) + 1;
                            unit.attackCount = attackCount;
                            const isSplatter = attackCount % 3 === 0;
                            
                            const splashBonus = isSplatter ? 15 : 0;
                            const finalDamage = currentDamage + splashBonus;

                            meleeTargets.forEach(target => {
                                applyDamage(target, finalDamage, now, unit.type === UnitType.BOSS);
                                // Knockback
                                target.x += dir * 2;
                            });
                            
                            setShakeTrigger(now + 300);
                        } else if (unit.type === UnitType.ARCHER) {
                            // ARCHER PROJECTILE LOGIC
                            // Fire projectile instead of instant damage
                            const proj: GameProjectile = {
                                id: `proj-${unit.id}-${now}`,
                                x: unit.x,
                                targetX: primaryTarget.x,
                                targetId: primaryTarget.id,
                                damage: currentDamage,
                                speed: 25, // Fast arrow speed
                                side: unit.side,
                                visualType: 'ARROW',
                                createdAt: now
                            };
                            processedProjectiles.push(proj);

                        } else {
                            // Standard Unit Attack (Melee & Mage)
                            applyDamage(primaryTarget, currentDamage, now, false);
                            
                            if (unit.type === UnitType.TOXIC) {
                                primaryTarget.poisonTicks = 3;
                                primaryTarget.lastPoisonTickTime = now;
                            }
                            if (unit.type === UnitType.PALADIN) {
                                setShakeTrigger(now + 200);
                            }
                        }
                    } else if (canSiege) {
                        // Statue Siege logic
                        if (unit.type === UnitType.ARCHER) {
                             const proj: GameProjectile = {
                                id: `proj-${unit.id}-${now}`,
                                x: unit.x,
                                targetX: targetStatueX,
                                damage: currentDamage,
                                speed: 25,
                                side: unit.side,
                                visualType: 'ARROW',
                                createdAt: now
                             };
                             processedProjectiles.push(proj);
                        } else {
                            if (isPlayer) eStatueHP -= currentDamage; else pStatueHP -= currentDamage;
                            AudioService.playDamage();
                            if (unit.type === UnitType.BOSS) setShakeTrigger(now + 400);
                        }
                    }
                    unit.lastAttackTime = now;
                }
            } else {
                // Ability was used, effectively consumed the 'turn' but keeps flow
                unit.state = 'ATTACKING'; 
                targetVelocity = 0;
            }
          } else {
            // Movement Logic
            
            // Check if we should "Charge" (Walk towards aggro target even if out of range)
            let isCharging = false;
            if (aggroTarget && cmd !== GameCommand.RETREAT) {
                if (cmd === GameCommand.ATTACK) {
                    isCharging = true;
                } else if (cmd === GameCommand.DEFEND) {
                    // Only charge if very close (Defensive Aggro)
                    if (Math.abs(aggroTarget.x - unit.x) < 8) isCharging = true;
                }
            }
            
            if (isCharging && aggroTarget) {
                unit.state = 'WALKING';
                targetVelocity = (unit.x < aggroTarget.x ? 1 : -1) * config.stats.speed;
            } else {
                // STANDARD MOVEMENT (No immediate target)
                unit.state = 'WALKING';
                
                if (cmd === GameCommand.DEFEND) {
                    // DEFENSE FORMATION LOGIC
                    const defenseFrontX = isPlayer ? GOLD_MINE_PLAYER_X + 15 : GOLD_MINE_ENEMY_X - 15;
                    const offset = FORMATION_OFFSETS[unit.type] || 0;
                    
                    const targetX = isPlayer 
                        ? defenseFrontX - offset 
                        : defenseFrontX + offset;
                    
                    const dist = Math.abs(unit.x - targetX);
                    
                    if (dist < 1.5) {
                        targetVelocity = 0;
                        unit.state = 'IDLE';
                    } else {
                        targetVelocity = (unit.x < targetX ? 1 : -1) * config.stats.speed;
                    }
                } else {
                    // ATTACK Command (March forward)
                    targetVelocity = dir * config.stats.speed;
                }
            }
          }
        }
        
        // Prevent movement if Rooted (Override targetVelocity from above)
        if (unit.rootedUntil && unit.rootedUntil > now) {
            targetVelocity = 0;
        }

        // Apply Speed & Slows
        if (unit.slowedUntil && unit.slowedUntil > now) {
            targetVelocity *= 0.7; // 30% Slow
        }

        // Apply Smoothing
        const agility = UNIT_AGILITY[unit.type] || 5;
        unit.currentSpeed += (targetVelocity - unit.currentSpeed) * (1 - Math.exp(-agility * deltaTime));
        unit.x += unit.currentSpeed * deltaTime;
        unit.x = Math.max(0, Math.min(100, unit.x));
      });

      // Cleanup & Merge Summons
      // Check limits on summons too to prevent over-cap during merge if multiple mages summon same tick
      // Simple cap enforcement: if we exceed cap, just drop excess summons
      
      // Separate lists for final check
      const playerUnits = processedUnits.filter(u => u.side === 'player' && u.state !== 'DYING');
      const enemyUnits = processedUnits.filter(u => u.side === 'enemy' && u.state !== 'DYING');
      const playerSummons = newSummons.filter(u => u.side === 'player');
      const enemySummons = newSummons.filter(u => u.side === 'enemy');
      
      // Add summons only if space permits
      if (playerUnits.length < MAX_UNITS) {
          processedUnits.push(...playerSummons.slice(0, MAX_UNITS - playerUnits.length));
      }
      if (enemyUnits.length < MAX_UNITS) {
          processedUnits.push(...enemySummons.slice(0, MAX_UNITS - enemyUnits.length));
      }

      processedUnits = processedUnits.filter(u => {
        if (u.hp <= 0 && u.state !== 'DYING') { u.state = 'DYING'; u.deathTime = now; }
        return !(u.state === 'DYING' && now - (u.deathTime || 0) > DEATH_DURATION);
      });
      
      // --- IMPROVED AI LOGIC ---
      if ((role === PlayerRole.HOST || role === PlayerRole.OFFLINE) && now - aiStateRef.current.lastDecisionTime > 2000) {
          const aiGold = p2Gold;
          const aiUnits = processedUnits.filter(u => u.side === 'enemy' && u.state !== 'DYING');
          const playerUnits = processedUnits.filter(u => u.side === 'player' && u.state !== 'DYING');
          
          if (aiUnits.length < MAX_UNITS) {
            // Economy: Ensure workers
            const workers = aiUnits.filter(u => u.type === UnitType.WORKER).length;
            const desiredWorkers = Math.min(6, Math.max(2, Math.floor(aiUnits.length / 3))); // Scale economy
            
            if (workers < desiredWorkers && aiGold >= UNIT_CONFIGS[UnitType.WORKER].cost) {
              actionQueueRef.current.push({ type: 'RECRUIT', unitType: UnitType.WORKER, side: 'enemy' });
            } else {
              // Combat Unit Strategy
              const playerTanks = playerUnits.filter(u => u.type === UnitType.PALADIN || u.type === UnitType.BOSS).length;
              const playerRanged = playerUnits.filter(u => u.type === UnitType.ARCHER || u.type === UnitType.MAGE).length;
              const playerSwarm = playerUnits.filter(u => u.type === UnitType.TOXIC || u.type === UnitType.SMALL).length;
              
              let desiredUnit = UnitType.PALADIN; // Default tank

              // Counter-play
              if (playerTanks > 1) desiredUnit = UnitType.MAGE; // Magic vs Armor
              else if (playerSwarm > 3) desiredUnit = UnitType.TOXIC; // Splash vs Swarm
              else if (playerRanged > 2) desiredUnit = UnitType.BOSS; // High HP vs Ranged
              else if (Math.random() > 0.6) desiredUnit = UnitType.ARCHER; // Mix in ranged

              // Smart Saving: Sometimes save for a BOSS if we have a decent army
              const saveForBoss = Math.random() > 0.7 && aiUnits.length > 5;
              
              if (saveForBoss) {
                  if (aiGold >= UNIT_CONFIGS[UnitType.BOSS].cost) {
                      actionQueueRef.current.push({ type: 'RECRUIT', unitType: UnitType.BOSS, side: 'enemy' });
                  }
              } else {
                  // Buy if affordable
                  if (aiGold >= UNIT_CONFIGS[desiredUnit].cost) {
                      actionQueueRef.current.push({ type: 'RECRUIT', unitType: desiredUnit, side: 'enemy' });
                  } else if (aiGold >= UNIT_CONFIGS[UnitType.TOXIC].cost && Math.random() > 0.6) {
                      // Fallback to cheaper unit if main choice is too expensive
                      actionQueueRef.current.push({ type: 'RECRUIT', unitType: UnitType.TOXIC, side: 'enemy' });
                  }
              }
            }
          }
          
          // Aggression Management
          const hasBoss = aiUnits.some(u => u.type === UnitType.BOSS);
          const armyAdvantage = aiUnits.length > playerUnits.length * 1.4;
          const underAttack = aiUnits.length < playerUnits.length * 0.5;
          
          if ((hasBoss || armyAdvantage) && p2Command !== GameCommand.ATTACK) {
               actionQueueRef.current.push({ type: 'CHANGE_COMMAND', side: 'enemy', command: GameCommand.ATTACK });
          } else if (underAttack && p2Command === GameCommand.ATTACK) {
               actionQueueRef.current.push({ type: 'CHANGE_COMMAND', side: 'enemy', command: GameCommand.RETREAT });
          }

          aiStateRef.current.lastDecisionTime = now;
      }

      const nextStatus: GameState['gameStatus'] = pStatueHP <= 0 ? 'DEFEAT' : (eStatueHP <= 0 ? 'VICTORY' : 'PLAYING');
      if (nextStatus !== gameStatus) AudioService.playFanfare(nextStatus === 'VICTORY');

      const nextState: GameState = { 
          ...stateRef.current, 
          units: processedUnits, 
          projectiles: processedProjectiles,
          playerStatueHP: pStatueHP, 
          enemyStatueHP: eStatueHP, 
          p1Gold, 
          p2Gold, 
          p1Command, 
          p2Command, 
          gameStatus: nextStatus, 
          lastTick: now 
      };
      setGameState(nextState);
      if (role === PlayerRole.HOST) mpService.send({ type: 'GAME_STATE_UPDATE', payload: nextState });

    }, TICK_RATE);
    return () => clearInterval(intervalId);
  }, [role, appMode]);

  if (appMode === 'INTRO') return <IntroSequence onComplete={() => setAppMode('LANDING')} />;
  if (appMode === 'LANDING') return <LandingPage 
      onStartHost={(s) => { setRole(PlayerRole.HOST); setIsSurgeMode(s); setAppMode('MAP_SELECT'); }} 
      onStartClient={() => { 
          setRole(PlayerRole.CLIENT); 
          // Reset Game State for new match (Client side initial)
          setGameState({
            units: [],
            projectiles: [],
            playerStatueHP: STATUE_HP,
            enemyStatueHP: STATUE_HP,
            p1Gold: INITIAL_GOLD,
            p2Gold: INITIAL_GOLD,
            p1Command: GameCommand.DEFEND,
            p2Command: GameCommand.DEFEND,
            lastTick: Date.now(),
            gameStatus: 'PLAYING',
            mapId: MapId.FOREST
          });
          setSelectedUnitId(null);
          actionQueueRef.current = [];
          setAppMode('GAME'); 
      }} 
      onStartOffline={(s) => { setRole(PlayerRole.OFFLINE); setIsSurgeMode(s); setAppMode('MAP_SELECT'); }} 
  />;

  if (appMode === 'MAP_SELECT') return <MapSelection 
      onSelectMap={(m) => { 
          // Reset Game State for new match (Host/Offline)
          setGameState({
            units: [],
            projectiles: [],
            playerStatueHP: STATUE_HP,
            enemyStatueHP: STATUE_HP,
            p1Gold: isSurgeMode ? INITIAL_GOLD_SURGE : INITIAL_GOLD,
            p2Gold: isSurgeMode ? INITIAL_GOLD_SURGE : INITIAL_GOLD,
            p1Command: GameCommand.DEFEND,
            p2Command: GameCommand.DEFEND,
            lastTick: Date.now(),
            gameStatus: 'PLAYING',
            mapId: m
          });
          setSelectedUnitId(null);
          actionQueueRef.current = [];
          aiStateRef.current = { lastDecisionTime: 0 };
          setAppMode('GAME'); 
      }} 
      onBack={() => setAppMode('LANDING')} 
  />;

  const amIHost = role !== PlayerRole.CLIENT;
  const isVictory = amIHost ? gameState.gameStatus === 'VICTORY' : gameState.gameStatus === 'DEFEAT';
  const currentCommand = amIHost ? gameState.p1Command : gameState.p2Command;
  const mySide = amIHost ? 'player' : 'enemy';
  const myUnitsCount = gameState.units.filter(u => u.side === mySide && u.state !== 'DYING').length;

  return (
    <div className="h-[100dvh] w-screen bg-black overflow-hidden relative">
      <div 
        ref={scrollContainerRef}
        className={`absolute inset-0 flex flex-col bg-inamorta select-none overflow-x-auto overflow-y-hidden touch-pan-x ${shakeTrigger > Date.now() ? 'animate-shake' : ''}`}
        onMouseDown={(e) => { setIsDragging(true); setStartX(e.pageX); setScrollLeft(scrollContainerRef.current!.scrollLeft); }}
        onMouseMove={(e) => { if (!isDragging) return; scrollContainerRef.current!.scrollLeft = scrollLeft - (e.pageX - startX) * 1.5; }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
          <div className="relative h-full w-[200vw] overflow-hidden">
            <BattlefieldBackground mapId={gameState.mapId} />
            <BaseStatue 
                x={getVisualX(STATUE_PLAYER_POS)} 
                hp={gameState.playerStatueHP} 
                variant="BLUE" 
                isFlipped={isMirrored} 
                isRetreating={gameState.p1Command === GameCommand.RETREAT} 
            />
            <GoldMine x={getVisualX(GOLD_MINE_PLAYER_X)} isFlipped={isMirrored} />
            <GoldMine x={getVisualX(GOLD_MINE_ENEMY_X)} isFlipped={!isMirrored} />
            <BaseStatue 
                x={getVisualX(STATUE_ENEMY_POS)} 
                hp={gameState.enemyStatueHP} 
                variant="RED" 
                isFlipped={!isMirrored} 
                isRetreating={gameState.p2Command === GameCommand.RETREAT} 
            />
            <ArmyVisuals 
                units={gameState.units} 
                projectiles={gameState.projectiles}
                selectedUnitId={selectedUnitId} 
                onSelectUnit={setSelectedUnitId} 
                isMirrored={isMirrored}
                p1Command={gameState.p1Command}
                p2Command={gameState.p2Command}
            />
          </div>
      </div>

      {/* TOP LEFT: Player Profile */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-3 bg-black/40 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/10 shadow-lg select-none">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-300 flex items-center justify-center shadow-inner">
              <span className="font-epic text-xs text-white font-bold">P1</span>
          </div>
          <div className="flex flex-col leading-none">
              <span className="font-epic text-stone-200 text-xs tracking-wider">COMMANDER</span>
              <span className="text-[10px] text-blue-400 font-mono">ONLINE</span>
          </div>
      </div>

      {/* TOP RIGHT: Resources & Population */}
      <div className="fixed top-4 right-4 z-40 bg-black/70 px-4 py-2 rounded-full border border-white/10 flex gap-4 items-center">
         <div className="flex items-center gap-2"><Coins className="text-yellow-400" size={18} /><span className="text-yellow-100 font-bold">{Math.floor(currentGold)}</span></div>
         <div className="flex items-center gap-2"><Users className={myUnitsCount >= MAX_UNITS ? "text-red-500" : "text-stone-400"} size={18} /><span className={myUnitsCount >= MAX_UNITS ? "text-red-400 font-bold" : "text-stone-100 font-bold"}>{myUnitsCount}/{MAX_UNITS}</span></div>
      </div>

      {/* TOP RIGHT BELOW RESOURCES: Controls (Surrender + Volume) */}
      <div className="fixed top-16 right-4 z-40 flex gap-2">
          {/* Surrender Button */}
          <button 
              onClick={() => setShowSurrenderConfirm(true)}
              className="bg-black/60 p-2 rounded-full border border-red-500/30 text-red-500 hover:bg-red-900/50 transition-colors shadow-lg active:scale-95"
              title="Surrender"
          >
              <Flag size={20} />
          </button>
          
          {/* Volume Button (Moved here) */}
          <button onClick={toggleMusic} className="p-2 bg-black/60 rounded-full border border-white/20 text-yellow-400 shadow-lg active:scale-95">
              {isMusicEnabled ? <Music size={20} /> : <VolumeX size={20} />}
          </button>
      </div>

      {/* TOP CENTER: Army Recruitment Bar */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 bg-black/80 p-2 rounded-xl flex gap-2 border border-white/10 max-w-[90vw] overflow-x-auto no-scrollbar">
          {Object.values(UNIT_CONFIGS).filter(u => u.cost > 0).map(u => (
              <button 
                  key={u.type} 
                  disabled={currentGold < u.cost || myUnitsCount >= MAX_UNITS}
                  onClick={() => actionQueueRef.current.push({type: 'RECRUIT', unitType: u.type, side: amIHost ? 'player' : 'enemy'})}
                  className={`p-2 rounded border flex flex-col items-center min-w-[64px] transition-all ${currentGold >= u.cost && myUnitsCount < MAX_UNITS ? 'bg-stone-800 border-white/5 active:scale-95' : 'bg-stone-900 opacity-40 border-transparent grayscale'}`}
              >
                  <div className="scale-50 h-8 w-8 flex items-center justify-center">
                    <StickmanRender type={u.type} isPlayer={amIHost} />
                  </div>
                  <span className="text-[10px] text-yellow-500 font-bold">{u.cost}</span>
              </button>
          ))}
      </div>

      {/* BOTTOM RIGHT: Commands */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
          <button 
            onClick={() => actionQueueRef.current.push({type: 'CHANGE_COMMAND', side: amIHost ? 'player' : 'enemy', command: GameCommand.ATTACK})} 
            className={`p-3 rounded-full border-2 shadow-lg active:scale-95 transition-all duration-200 ${currentCommand === GameCommand.ATTACK ? 'bg-red-600 border-white scale-110 ring-2 ring-red-400 shadow-red-900/50' : 'bg-red-900/40 border-white/10 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'}`}
            title="Attack"
          >
            <Swords size={24} />
          </button>
          
          <button 
            onClick={() => actionQueueRef.current.push({type: 'CHANGE_COMMAND', side: amIHost ? 'player' : 'enemy', command: GameCommand.DEFEND})} 
            className={`p-3 rounded-full border-2 shadow-lg active:scale-95 transition-all duration-200 ${currentCommand === GameCommand.DEFEND ? 'bg-blue-600 border-white scale-110 ring-2 ring-blue-400 shadow-blue-900/50' : 'bg-blue-900/40 border-white/10 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'}`}
            title="Defend"
          >
            <Shield size={24} />
          </button>
          
          <button 
            onClick={() => actionQueueRef.current.push({type: 'CHANGE_COMMAND', side: amIHost ? 'player' : 'enemy', command: GameCommand.RETREAT})} 
            className={`p-3 rounded-full border-2 shadow-lg active:scale-95 transition-all duration-200 ${currentCommand === GameCommand.RETREAT ? 'bg-orange-600 border-white scale-110 ring-2 ring-orange-400 shadow-orange-900/50' : 'bg-orange-900/40 border-white/10 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'}`}
            title="Retreat"
          >
            <CornerDownLeft size={24} />
          </button>
      </div>
      
      {/* Surrender Confirmation Modal */}
      {showSurrenderConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-stone-900 p-8 rounded-2xl border-2 border-red-500/30 shadow-2xl text-center max-w-sm mx-4 transform transition-all scale-100">
                <h2 className="text-2xl font-epic text-red-500 mb-2">SURRENDER?</h2>
                <p className="text-stone-400 mb-6 text-sm">Your army will fall, and the battle will be lost. Are you sure?</p>
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => setShowSurrenderConfirm(false)}
                        className="px-6 py-2 rounded bg-stone-700 hover:bg-stone-600 text-white font-bold transition-colors active:scale-95"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={() => {
                            if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
                                setGameState(prev => ({ ...prev, playerStatueHP: 0 }));
                            } else {
                                mpService.send({ type: 'SURRENDER', payload: {} });
                                setGameState(prev => ({ ...prev, playerStatueHP: 0 }));
                            }
                            setShowSurrenderConfirm(false);
                        }}
                        className="px-6 py-2 rounded bg-red-900 hover:bg-red-700 text-red-100 border border-red-500 font-bold transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-95"
                    >
                        SURRENDER
                    </button>
                </div>
            </div>
        </div>
      )}

      {gameState.gameStatus !== 'PLAYING' && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-intro-fade">
             <div className={`bg-stone-900 p-12 rounded-2xl border-4 text-center shadow-2xl ${isVictory ? 'animate-victory-modal' : 'animate-defeat-modal'}`}>
                 <h1 className={`text-6xl font-epic mb-4 animate-flourish ${isVictory ? 'text-yellow-400' : 'text-red-600'}`}>
                     {isVictory ? 'VICTORY!' : 'DEFEAT'}
                 </h1>
                 <p className="text-stone-400 animate-subtext mb-8">The Saga continues in your glory...</p>
                 <button 
                    onClick={handleReturnToMenu}
                    className={`px-8 py-3 rounded-lg font-bold text-lg transition-all active:scale-95 border-b-4 animate-subtext ${isVictory ? 'bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-800' : 'bg-stone-700 hover:bg-stone-600 text-white border-stone-900'}`}
                    style={{ animationDelay: '1s' }}
                 >
                    RETURN TO BASE
                 </button>
             </div>
         </div>
      )}
    </div>
  );
};