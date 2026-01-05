
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnitType, GameUnit, GameState, GameCommand, PlayerRole, MapId, GameProjectile, StuckArrow } from './types';
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
import { ArmyVisuals } from './components/ArmyVisuals';
import { LandingPage } from './components/LandingPage';
import { IntroSequence } from './components/IntroSequence';
import { MapSelection } from './components/MapSelection';
import { BattlefieldBackground } from './components/BattlefieldBackground';
import { AudioService } from './services/audioService';
import { mpService } from './services/multiplayerService';
import { Gem, Shield, Swords, CornerDownLeft, Users, Settings } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { UnitCard } from './components/UnitCard';

// --- VISUAL COMPONENTS ---

const CrystalRock: React.FC<{ x: number; isFlipped?: boolean }> = ({ x, isFlipped }) => (
  <div 
    className="absolute bottom-16 w-24 h-24 z-0 pointer-events-none"
    style={{ left: `${x}%`, transform: 'translateX(-50%) translate3d(0,0,0)' }}
  >
     <div className={`w-full h-full ${isFlipped ? 'scale-x-[-1]' : ''}`}>
        <svg viewBox="0 0 100 100" className="overflow-visible">
           <defs>
             <linearGradient id="miniCrystalGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0891b2" /> 
                <stop offset="60%" stopColor="#06b6d4" /> 
                <stop offset="100%" stopColor="#cffafe" stopOpacity="0.9" /> 
             </linearGradient>
             <filter id="miniGlow" x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur stdDeviation="2" result="coloredBlur" />
               <feMerge>
                 <feMergeNode in="coloredBlur" />
                 <feMergeNode in="SourceGraphic" />
               </feMerge>
             </filter>
           </defs>
           <ellipse cx="50" cy="90" rx="25" ry="6" fill="#06b6d4" opacity="0.3" filter="blur(4px)" className="animate-pulse" />
           <g filter="url(#miniGlow)">
               <path d="M30 90 L 20 60 L 35 45 L 45 85 Z" fill="url(#miniCrystalGrad)" stroke="#cffafe" strokeWidth="0.5" />
               <path d="M70 90 L 80 65 L 65 50 L 55 85 Z" fill="url(#miniCrystalGrad)" stroke="#cffafe" strokeWidth="0.5" />
               <path d="M50 95 L 35 55 L 50 20 L 65 55 Z" fill="url(#miniCrystalGrad)" stroke="#cffafe" strokeWidth="1" className="animate-idle-breathe" style={{ transformOrigin: '50% 95px' }} />
               <path d="M50 20 L 50 95" stroke="#cffafe" strokeWidth="0.5" opacity="0.5" />
           </g>
           <circle cx="50" cy="20" r="1" fill="white" className="animate-pulse" />
           <path d="M35 45 L 37 42 L 39 45 L 37 48 Z" fill="#cffafe" className="animate-bounce" style={{ animationDuration: '3s' }} opacity="0.8" />
        </svg>
     </div>
  </div>
);

const BaseStatue: React.FC<{ x: number; hp: number; variant: 'BLUE' | 'RED'; isFlipped?: boolean; isRetreating?: boolean; stuckArrows?: StuckArrow[] }> = ({ x, hp, variant, isFlipped, isRetreating, stuckArrows = [] }) => {
    const hpPercent = Math.max(0, (hp / STATUE_HP) * 100);
    const isRed = variant === 'RED';
    const primaryColor = isRed ? '#ef4444' : '#3b82f6';
    const darkColor = isRed ? '#7f1d1d' : '#1e3a8a';
    const lightColor = isRed ? '#fca5a5' : '#93c5fd';
    const portalCore = isRed ? '#4c0519' : '#1e1b4b'; 
    const portalSwirl1 = '#a855f7'; 
    const portalSwirl2 = isRed ? '#f43f5e' : '#3b82f6';

    return (
        <div 
            className="absolute bottom-16 z-10 pointer-events-none origin-bottom transition-all duration-300"
            style={{ 
                left: `${x}%`, 
                transform: 'translateX(-50%) translate3d(0,0,0)',
                height: 'min(360px, 60vh)', 
                width: 'auto', 
                aspectRatio: '220 / 380'
            }}
        >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[140%] h-3 sm:h-4 bg-black/70 rounded-full border border-white/30 backdrop-blur-md overflow-hidden z-20 shadow-lg">
                <div 
                    className={`h-full transition-all duration-500 ease-out ${isRed ? 'bg-gradient-to-r from-red-600 to-rose-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} 
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            
            <div className={`w-full h-full relative ${isFlipped ? 'scale-x-[-1]' : ''}`}>
                <svg viewBox="0 0 220 380" className="w-full h-full overflow-visible drop-shadow-2xl">
                    <defs>
                        <linearGradient id={`tower-body-${variant}`} x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor={darkColor} />
                            <stop offset="50%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={lightColor} stopOpacity="0.9" />
                        </linearGradient>
                        <radialGradient id="portal-glow" cx="0.5" cy="0.5" r="0.5">
                             <stop offset="40%" stopColor={portalCore} />
                             <stop offset="100%" stopColor={portalSwirl1} stopOpacity="0.1" />
                        </radialGradient>
                    </defs>

                    <g className={isRetreating ? "animate-pulse" : ""} opacity={0.6}>
                        <circle cx="110" cy="180" r="70" fill={portalSwirl1} filter="blur(20px)" />
                    </g>

                    <g transform="translate(0, 320)">
                       <path d="M20 0 L 40 -20 L 70 10 L 110 -15 L 150 10 L 180 -20 L 200 0 L 220 60 L 0 60 Z" fill="#44403c" />
                       <path d="M30 10 L 50 -5 L 60 15 Z" fill="#57534e" opacity="0.6" />
                       <path d="M160 5 L 180 -10 L 170 20 Z" fill="#57534e" opacity="0.6" />
                    </g>
                    
                    {/* Tower Body */}
                    <path 
                        d="M30 340 Q 10 340 10 300 Q 15 200 40 120 Q 80 20 110 20 Q 140 20 180 120 Q 205 200 210 300 Q 210 340 190 340 Q 110 360 30 340"
                        fill={`url(#tower-body-${variant})`}
                        stroke={lightColor}
                        strokeWidth="2"
                        className="animate-idle-breathe"
                        style={{ transformOrigin: 'bottom center' }}
                    />

                    {/* Portal */}
                    <g transform="translate(110, 180)">
                        <circle cx="0" cy="0" r="55" fill="none" stroke={darkColor} strokeWidth="8" opacity="0.6" />
                        <circle cx="0" cy="0" r="55" fill={portalCore} opacity="0.8" />
                        <g className={isRetreating ? "animate-spin-fast" : "animate-portal-spin"} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                            <path d="M-40 -20 Q 0 -60 40 -20 Q 0 20 -40 -20" fill="none" stroke={portalSwirl1} strokeWidth="4" opacity="0.8" />
                            <path d="M-20 40 Q 60 0 20 -40" fill="none" stroke={portalSwirl2} strokeWidth="3" opacity="0.7" transform="rotate(90)" />
                        </g>
                    </g>

                    {/* Stuck Arrows on Statue */}
                    {stuckArrows.map(arrow => (
                        <g key={arrow.id} transform={`translate(${arrow.x * 2.2}, ${arrow.y * 3.8}) rotate(${arrow.angle})`}>
                            <line x1="0" y1="0" x2="-25" y2="0" stroke="white" strokeWidth="2" />
                            <path d="M-25 0 L -30 -4 L -30 4 Z" fill="#facc15" stroke="none" />
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};

// --- GAME LOGIC CONSTANTS ---
const TICK_RATE = 20; 
const DEATH_DURATION = 1500;
const UNIT_AGILITY: Record<string, number> = {
  [UnitType.WORKER]: 5.0,
  [UnitType.SMALL]: 6.0,
  [UnitType.TOXIC]: 10.0,
  [UnitType.ARCHER]: 3.5,
  [UnitType.MAGE]: 2.5,
  [UnitType.PALADIN]: 2.0,
  [UnitType.BOSS]: 1.0
};

export const App: React.FC = () => {
  // Navigation State
  const [appMode, setAppMode] = useState<'INTRO' | 'LANDING' | 'MAP_SELECT' | 'GAME'>('INTRO');
  const [role, setRole] = useState<PlayerRole>(PlayerRole.HOST);
  const [isSurgeMode, setIsSurgeMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  
  // Game Logic State
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    units: [],
    projectiles: [],
    playerStatueHP: STATUE_HP,
    enemyStatueHP: STATUE_HP,
    playerStatueStuckArrows: [],
    enemyStatueStuckArrows: [],
    p1Gold: INITIAL_GOLD,
    p2Gold: INITIAL_GOLD,
    p1Command: GameCommand.DEFEND,
    p2Command: GameCommand.DEFEND,
    lastTick: Date.now(),
    gameStatus: 'PLAYING',
    mapId: MapId.FOREST
  });

  // Refs for Game Loop to access latest state without closure staleness
  const stateRef = useRef(gameState);
  const aiStateRef = useRef({ lastDecisionTime: 0, state: 'GATHERING' });
  const actionQueueRef = useRef<any[]>([]);
  
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Audio Control
  useEffect(() => {
    if (appMode === 'GAME') AudioService.startMusic(gameState.mapId);
    else AudioService.stopMusic();
  }, [appMode, gameState.mapId]);

  const isMirrored = role === PlayerRole.CLIENT;
  const currentGold = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Gold : gameState.p2Gold;
  const getVisualX = useCallback((x: number) => isMirrored ? 100 - x : x, [isMirrored]);

  const handleReturnToMenu = useCallback(() => {
    setIsSurgeMode(false);
    mpService.destroy();
    setAppMode('LANDING');
    setShowSettings(false);
  }, []);

  const handleLeaveGame = () => {
      setShowSettings(false);
      setShowSurrenderConfirm(true);
  };

  // Helper: Damage Calculation
  const applyDamage = (target: GameUnit, rawDamage: number, now: number, isBossAttack: boolean, allUnits: GameUnit[]) => {
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

      // 1. Process Action Queue
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
                      // Add Stuck Arrow to Unit
                      // Safe mutation because nextUnits contains shallow copies and we are creating a new array for stuckArrows
                      const currentArrows = targetUnit.stuckArrows || [];
                      if (currentArrows.length < 5) {
                          targetUnit.stuckArrows = [...currentArrows, {
                              id: Math.random().toString(36),
                              x: Math.random() * 40 - 20,
                              y: Math.random() * 60 - 30,
                              angle: (dir === 1 ? -10 : 190) + (Math.random() * 20 - 10),
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
                  // Magic (Splash)
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

      // 3. Update Units
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

      // 4. AI Logic
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

  // --- RENDER UI ---
  // Eliminate early returns by using a conditional variable for content
  // This guarantees hook count consistency across renders
  
  let content = null;

  if (appMode === 'INTRO') {
      content = <IntroSequence onComplete={() => setAppMode('LANDING')} />;
  } else if (appMode === 'LANDING') {
      content = <LandingPage 
          onStartHost={(s) => { setRole(PlayerRole.HOST); setIsSurgeMode(s); setAppMode('MAP_SELECT'); }} 
          onStartClient={() => { setRole(PlayerRole.CLIENT); setAppMode('GAME'); }} 
          onStartOffline={(s) => { setRole(PlayerRole.OFFLINE); setIsSurgeMode(s); setAppMode('MAP_SELECT'); }} 
      />;
  } else if (appMode === 'MAP_SELECT') {
      content = <MapSelection 
          onSelectMap={(m) => { 
              setGameState(prev => ({ ...prev, mapId: m, p1Gold: isSurgeMode ? INITIAL_GOLD_SURGE : INITIAL_GOLD, p2Gold: isSurgeMode ? INITIAL_GOLD_SURGE : INITIAL_GOLD }));
              setAppMode('GAME'); 
          }} 
          onBack={() => setAppMode('LANDING')} 
      />;
  } else {
      // GAME Mode
      content = (
          <>
            <div className="absolute inset-0 flex flex-col bg-inamorta select-none overflow-x-auto overflow-y-hidden touch-pan-x z-0 isolation-isolate">
                <div className="relative h-full w-[200vw] overflow-hidden">
                    <BattlefieldBackground mapId={gameState.mapId} />
                    <BaseStatue 
                        x={getVisualX(STATUE_PLAYER_POS)} 
                        hp={gameState.playerStatueHP} 
                        variant="BLUE" 
                        isFlipped={isMirrored} 
                        isRetreating={gameState.p1Command === GameCommand.RETREAT}
                        stuckArrows={isMirrored ? gameState.enemyStatueStuckArrows : gameState.playerStatueStuckArrows}
                    />
                    <CrystalRock x={getVisualX(GOLD_MINE_PLAYER_X)} isFlipped={isMirrored} />
                    <CrystalRock x={getVisualX(GOLD_MINE_ENEMY_X)} isFlipped={!isMirrored} />
                    <BaseStatue 
                        x={getVisualX(STATUE_ENEMY_POS)} 
                        hp={gameState.enemyStatueHP} 
                        variant="RED" 
                        isFlipped={!isMirrored} 
                        isRetreating={gameState.p2Command === GameCommand.RETREAT} 
                        stuckArrows={!isMirrored ? gameState.enemyStatueStuckArrows : gameState.playerStatueStuckArrows}
                    />
                    <ArmyVisuals 
                        units={gameState.units} 
                        projectiles={gameState.projectiles}
                        selectedUnitId={selectedUnitId} 
                        onSelectUnit={(id) => setSelectedUnitId(id)} 
                        isMirrored={isMirrored}
                        p1Command={gameState.p1Command}
                        p2Command={gameState.p2Command}
                    />
                </div>
            </div>

            {/* TOP LEFT: Player Info */}
            <div className="fixed top-4 left-4 z-40 flex items-center gap-3 bg-black/40 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/10 shadow-lg select-none">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-300 flex items-center justify-center shadow-inner">
                    <span className="font-epic text-xs text-white font-bold">P1</span>
                </div>
                <div className="flex flex-col leading-none">
                    <span className="font-epic text-stone-200 text-xs tracking-wider">COMMANDER</span>
                    <span className="text-[10px] text-blue-400 font-mono">ONLINE</span>
                </div>
            </div>

            {/* TOP RIGHT: Resources */}
            <div className="fixed top-4 right-4 z-40 bg-black/70 px-4 py-2 rounded-full border border-white/10 flex gap-4 items-center">
                <div className="flex items-center gap-2"><Gem className="text-cyan-400" size={18} /><span className="text-cyan-100 font-bold">{Math.floor(currentGold)}</span></div>
                <div className="flex items-center gap-2"><Users className={gameState.units.filter(u => u.side === (isMirrored ? 'enemy' : 'player') && u.state !== 'DYING').length >= MAX_UNITS ? "text-red-500" : "text-stone-400"} size={18} /><span className="text-stone-100 font-bold">{gameState.units.filter(u => u.side === (isMirrored ? 'enemy' : 'player') && u.state !== 'DYING').length}/{MAX_UNITS}</span></div>
            </div>

            <div className="fixed top-16 right-4 z-40 flex gap-2">
                <button onClick={() => { AudioService.playSelect(); setShowSettings(true); }} className="p-2 bg-black/60 rounded-full border border-white/20 text-stone-300 hover:text-white shadow-lg active:scale-95"><Settings size={20} /></button>
            </div>
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onLeaveGame={handleLeaveGame} />}

            {/* RECRUITMENT BAR */}
            <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 bg-black/80 p-2 rounded-xl flex gap-2 border border-white/10 max-w-[90vw] overflow-x-auto no-scrollbar">
                {Object.values(UNIT_CONFIGS).filter(u => u.cost > 0).map(u => (
                    <div key={u.type} className="transform scale-90 origin-top">
                        <UnitCard
                            unit={u}
                            count={gameState.units.filter(unit => unit.side === (isMirrored ? 'enemy' : 'player') && unit.type === u.type).length}
                            canAfford={currentGold >= u.cost}
                            onRecruit={() => actionQueueRef.current.push({type: 'RECRUIT', unitType: u.type, side: isMirrored ? 'enemy' : 'player'})}
                            variant={isMirrored ? "RED" : "BLUE"}
                        />
                    </div>
                ))}
            </div>

            {/* COMMANDS */}
            <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
                {[GameCommand.ATTACK, GameCommand.DEFEND, GameCommand.RETREAT].map(cmd => (
                    <button 
                        key={cmd}
                        onClick={() => actionQueueRef.current.push({type: 'CHANGE_COMMAND', side: isMirrored ? 'enemy' : 'player', command: cmd})} 
                        className={`p-3 rounded-full border-2 shadow-lg active:scale-95 transition-all duration-200 ${gameState.p1Command === cmd ? 'bg-blue-600 border-white scale-110 ring-2 ring-blue-400' : 'bg-stone-900/40 border-white/10'}`}
                    >
                        {cmd === GameCommand.ATTACK && <Swords size={24} />}
                        {cmd === GameCommand.DEFEND && <Shield size={24} />}
                        {cmd === GameCommand.RETREAT && <CornerDownLeft size={24} />}
                    </button>
                ))}
            </div>
            
            {showSurrenderConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-stone-900 p-8 rounded-2xl border-2 border-red-500/30 shadow-2xl text-center">
                        <h2 className="text-2xl font-epic text-red-500 mb-4">SURRENDER?</h2>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setShowSurrenderConfirm(false)} className="px-6 py-2 rounded bg-stone-700 font-bold hover:bg-stone-600">CANCEL</button>
                            <button onClick={() => { setGameState(prev => ({ ...prev, playerStatueHP: 0 })); setShowSurrenderConfirm(false); }} className="px-6 py-2 rounded bg-red-900 font-bold text-red-100 hover:bg-red-700">SURRENDER</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.gameStatus !== 'PLAYING' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-intro-fade">
                    <div className="bg-stone-900 p-12 rounded-2xl border-4 text-center shadow-2xl animate-victory-modal">
                        <h1 className={`text-6xl font-epic mb-4 animate-flourish ${gameState.gameStatus === 'VICTORY' ? 'text-yellow-400' : 'text-red-600'}`}>
                            {gameState.gameStatus === 'VICTORY' ? 'VICTORY!' : 'DEFEAT'}
                        </h1>
                        <button onClick={handleReturnToMenu} className="px-8 py-3 rounded-lg font-bold text-lg bg-stone-700 hover:bg-stone-600 text-white border-stone-900 border-b-4 active:border-b-0 active:translate-y-1 transition-all">RETURN TO BASE</button>
                    </div>
                </div>
            )}
          </>
      );
  }

  return (
    <div className="h-[100dvh] w-screen bg-black overflow-hidden relative">
        {content}
    </div>
  );
};
