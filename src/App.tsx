import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnitType, GameUnit, GameState, GameCommand, PlayerRole, MapId, GameProjectile, StuckArrow, EnemyArmy, BattleLogEntry } from './types';
import { 
  FIELD_WIDTH, STATUE_HP, SPAWN_X_PLAYER, SPAWN_X_ENEMY, 
  STATUE_PLAYER_POS, STATUE_ENEMY_POS, MAX_UNITS, 
  GOLD_MINE_PLAYER_X, GOLD_MINE_ENEMY_X, ATTACK_RANGE_MELEE, 
  ATTACK_RANGE_RANGED, ATTACK_RANGE_MAGIC, INITIAL_GOLD, 
  INITIAL_GOLD_SURGE, FORMATION_OFFSETS, UNIT_CONFIGS, 
  MAP_CONFIGS, INITIAL_PLAYER_STATE 
} from './constants';
import { generateEnemyArmy, generateBattleReport } from './services/aiService';
import { AudioService } from './services/audioService';
import { mpService } from './services/multiplayerService';
import { LandingPage } from './components/LandingPage';
import { IntroSequence } from './components/IntroSequence';
import { MapSelection } from './components/MapSelection';
import { BattlefieldBackground } from './components/BattlefieldBackground';
import { ArmyVisuals } from './components/ArmyVisuals';
import { UnitCard } from './components/UnitCard';
import { SettingsModal } from './components/SettingsModal';
import { StickmanRender } from './components/StickmanRender';
import { Sword, Shield, Flag, RefreshCw } from 'lucide-react';

const TICK_RATE = 50;
const DEATH_DURATION = 2000;
const UNIT_AGILITY: Record<UnitType, number> = {
    [UnitType.WORKER]: 3,
    [UnitType.TOXIC]: 5,
    [UnitType.ARCHER]: 4,
    [UnitType.PALADIN]: 2,
    [UnitType.MAGE]: 3,
    [UnitType.BOSS]: 1,
    [UnitType.SMALL]: 6
};

// Inline components to ensure missing references are handled
const CrystalRock = ({ x, hasGold }: { x: number, hasGold: boolean }) => (
    <div className="absolute bottom-16 w-16 h-16 flex items-end justify-center z-10" style={{ left: `${x}%`, transform: 'translateX(-50%)' }}>
        <div className={`w-12 h-12 bg-cyan-900/40 rounded-full blur-md absolute bottom-0 ${hasGold ? 'animate-pulse' : ''}`}></div>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
            <path d="M50 10 L 80 40 L 70 85 L 30 85 L 20 40 Z" fill={hasGold ? "#06b6d4" : "#164e63"} stroke="#ecfeff" strokeWidth="2" />
            <path d="M50 10 L 80 40 L 50 55 L 20 40 Z" fill={hasGold ? "#22d3ee" : "#155e75"} opacity="0.8" />
            <path d="M20 40 L 50 55 L 30 85 Z" fill={hasGold ? "#0891b2" : "#0e7490"} opacity="0.6" />
            <path d="M80 40 L 70 85 L 50 55 Z" fill={hasGold ? "#0891b2" : "#0e7490"} opacity="0.6" />
        </svg>
    </div>
);

const BaseStatue = ({ x, hp, maxHp, isPlayer, stuckArrows = [] }: { x: number, hp: number, maxHp: number, isPlayer: boolean, stuckArrows?: StuckArrow[] }) => {
    const hpPercent = Math.max(0, (hp / maxHp) * 100);
    return (
        <div className="absolute bottom-16 w-24 h-32 flex flex-col items-center justify-end z-20" style={{ left: `${x}%`, transform: 'translateX(-50%)' }}>
             {/* HP Bar */}
             <div className="absolute -top-8 w-32 h-2 bg-black/50 rounded-full border border-white/20 overflow-hidden backdrop-blur-sm">
                 <div className={`h-full transition-all duration-300 ${isPlayer ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} style={{ width: `${hpPercent}%` }}></div>
             </div>
             <div className="absolute -top-12 font-mono font-bold text-white text-shadow-md">{Math.ceil(hp)}/{maxHp}</div>

             {/* Statue Visual */}
             <div className="relative w-full h-full">
                 <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl overflow-visible">
                     {/* Base */}
                     <path d="M10 120 L 90 120 L 80 100 L 20 100 Z" fill="#333" stroke="#555" />
                     {/* Pillar */}
                     <rect x="30" y="40" width="40" height="60" fill="#444" stroke="#666" />
                     {/* Crystal Top */}
                     <path d="M50 0 L 80 30 L 50 60 L 20 30 Z" fill={isPlayer ? "#3b82f6" : "#ef4444"} className="animate-pulse" />
                     <path d="M50 0 L 80 30 L 50 30 Z" fill={isPlayer ? "#60a5fa" : "#f87171"} opacity="0.5" />
                     {/* Glow */}
                     <circle cx="50" cy="30" r="20" fill={isPlayer ? "#3b82f6" : "#ef4444"} filter="blur(15px)" opacity="0.6" />
                 </svg>
                 
                 {/* Stuck Arrows */}
                 <div className="absolute inset-0 pointer-events-none">
                     {stuckArrows.map(arrow => (
                         <div key={arrow.id} style={{ position: 'absolute', left: `${arrow.x}%`, top: `${arrow.y}%`, transform: `rotate(${arrow.angle}deg)` }}>
                             <div className="w-6 h-0.5 bg-yellow-200 shadow-sm relative">
                                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-l-2 border-yellow-200 rotate-45"></div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );
};

export const App: React.FC = () => {
  // State
  const [appMode, setAppMode] = useState<'LANDING' | 'INTRO' | 'MAP_SELECT' | 'GAME'>('LANDING');
  const [role, setRole] = useState<PlayerRole>(PlayerRole.OFFLINE);
  const [mapId, setMapId] = useState<MapId>(MapId.FOREST);
  const [surgeMode, setSurgeMode] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
      units: [],
      projectiles: [],
      playerStatueHP: STATUE_HP,
      enemyStatueHP: STATUE_HP,
      playerStatueStuckArrows: [],
      enemyStatueStuckArrows: [],
      p1Gold: INITIAL_GOLD,
      p2Gold: INITIAL_GOLD,
      p1Command: GameCommand.ATTACK,
      p2Command: GameCommand.ATTACK,
      lastTick: Date.now(),
      gameStatus: 'PLAYING',
      mapId: MapId.FOREST
  });
  const [showSettings, setShowSettings] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [battleReport, setBattleReport] = useState<string | null>(null);

  // Refs
  const stateRef = useRef(gameState);
  const actionQueueRef = useRef<{ type: string; unitType?: UnitType; command?: GameCommand; side: 'player' | 'enemy' }[]>([]);
  const aiStateRef = useRef({ state: 'GATHERING', lastDecisionTime: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Sync ref
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Audio setup
  useEffect(() => {
     if (appMode === 'GAME') {
         AudioService.startMusic(mapId);
     } else {
         AudioService.stopMusic();
     }
  }, [appMode, mapId]);

  // Handlers
  const handleStartHost = (surge: boolean) => {
      setSurgeMode(surge);
      setRole(PlayerRole.HOST);
      setAppMode('MAP_SELECT');
  };

  const handleStartClient = (hostId: string) => {
      setRole(PlayerRole.CLIENT);
      // Wait for game state from host
      mpService.onMessage((msg) => {
          if (msg.type === 'GAME_STATE_UPDATE') {
               setGameState(msg.payload);
               setMapId(msg.payload.mapId);
               if (appMode !== 'GAME') setAppMode('GAME'); // Auto start
          }
      });
      setAppMode('INTRO'); 
  };

  const handleStartOffline = (surge: boolean) => {
      setSurgeMode(surge);
      setRole(PlayerRole.OFFLINE);
      setAppMode('INTRO');
  };

  const handleMapSelect = (id: MapId) => {
      setMapId(id);
      setAppMode('INTRO');
  };

  const handleIntroComplete = () => {
      // Init Game
      const initialGold = surgeMode ? INITIAL_GOLD_SURGE : INITIAL_GOLD;
      setGameState({
          ...gameState,
          mapId: mapId,
          p1Gold: initialGold,
          p2Gold: initialGold,
          playerStatueHP: STATUE_HP,
          enemyStatueHP: STATUE_HP,
          units: [],
          projectiles: [],
          gameStatus: 'PLAYING',
          lastTick: Date.now()
      });
      setAppMode('GAME');
  };

  const handleRecruit = (type: UnitType) => {
      if (role === PlayerRole.CLIENT) {
          mpService.send({ type: 'RECRUIT_REQUEST', payload: { unitType: type } });
      } else {
          actionQueueRef.current.push({ type: 'RECRUIT', unitType: type, side: 'player' });
      }
  };

  const handleCommand = (cmd: GameCommand) => {
      if (role === PlayerRole.CLIENT) {
          mpService.send({ type: 'CLIENT_COMMAND_REQUEST', payload: { command: cmd } });
      } else {
          actionQueueRef.current.push({ type: 'CHANGE_COMMAND', command: cmd, side: 'player' });
      }
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
        if (!action) continue; 
        if (action.type === 'RECRUIT' && action.unitType) {
          const config = UNIT_CONFIGS[action.unitType];
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
        } else if (action.type === 'CHANGE_COMMAND' && action.command) {
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
                      
                      const currentArrows = targetUnit.stuckArrows || [];
                      if (currentArrows.length < 5) {
                          const impactX = 10 + Math.random() * 15;
                          const impactY = (Math.random() * 30) - 10; 
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
                      const targetStatueX = p.side === 'player' ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
                      if (Math.abs(p.x - targetStatueX) < 3) {
                           hit = true;
                           if (p.side === 'player') enemyStatueHP -= p.damage; else playerStatueHP -= p.damage;
                           const arrow: StuckArrow = {
                               id: Math.random().toString(36),
                               x: Math.random() * 60 + 20,
                               y: Math.random() * 60 + 20,
                               angle: (Math.random() * 30 - 15),
                               variant: 'phys'
                           };
                           if (p.side === 'player') nextEnemyStatueStuckArrows.push(arrow);
                           else nextPlayerStatueStuckArrows.push(arrow);
                           
                           AudioService.playImpact('PHYSICAL');
                      } else {
                           hit = true; // Missed
                      }
                  }
              } else {
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
        
        if (unit.stunnedUntil && unit.stunnedUntil > now) { unit.state = 'IDLE'; return; }
        if (unit.rootedUntil && unit.rootedUntil > now) { 
            unit.currentSpeed = 0;
            unit.hp -= 0.1;
        }

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

        const dir = isPlayer ? 1 : -1;
        const targets = nextUnits.filter(u => u.side !== unit.side && u.state !== 'DYING' && u.state !== 'GARRISONED');
        const visibleTargets = targets.filter(u => Math.abs(u.x - unit.x) < 30);
        
        visibleTargets.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x));
        const primaryTarget = visibleTargets.find(u => Math.abs(u.x - unit.x) <= config.stats.range);
        
        const statueTargetX = isPlayer ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
        const canSiege = cmd === GameCommand.ATTACK && Math.abs(unit.x - statueTargetX) < config.stats.range + 1;

        if (primaryTarget || canSiege) {
            unit.state = 'ATTACKING';
            unit.currentSpeed = 0;
            if (now - unit.lastAttackTime > config.stats.attackSpeed) {
                if (unit.type === UnitType.ARCHER) {
                    nextProjectiles.push({
                        id: `arrow-${unit.id}-${now}`, x: unit.x, startX: unit.x,
                        targetX: primaryTarget ? primaryTarget.x : statueTargetX,
                        targetId: primaryTarget?.id, damage: config.stats.damage,
                        speed: 45 + Math.random() * 5, side: unit.side, visualType: 'ARROW', createdAt: now
                    });
                } else {
                    if (primaryTarget) {
                        applyDamage(primaryTarget, config.stats.damage, now, false, nextUnits);
                        if (unit.type === UnitType.BOSS) { 
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
            unit.state = 'WALKING';
            let targetV = 0;
            if (cmd === GameCommand.DEFEND) {
                const defX = isPlayer ? GOLD_MINE_PLAYER_X + 15 : GOLD_MINE_ENEMY_X - 15;
                const offset = FORMATION_OFFSETS[unit.type] || 0;
                const tx = isPlayer ? defX - offset : defX + offset;
                if (Math.abs(unit.x - tx) > 1) targetV = (unit.x < tx ? 1 : -1) * config.stats.speed;
            } else {
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

      // Sync with Client if Host
      if (role === PlayerRole.HOST) {
          const newState = {
            ...currentState,
            units: nextUnits,
            projectiles: nextProjectiles,
            playerStatueHP, enemyStatueHP, p1Gold, p2Gold, p1Command, p2Command, gameStatus: nextStatus,
            playerStatueStuckArrows: nextPlayerStatueStuckArrows, enemyStatueStuckArrows: nextEnemyStatueStuckArrows,
            lastTick: now
          };
          mpService.send({ type: 'GAME_STATE_UPDATE', payload: newState });
          setGameState(newState);
      } else {
          setGameState({
              ...currentState,
              units: nextUnits,
              projectiles: nextProjectiles,
              playerStatueHP, enemyStatueHP, p1Gold, p2Gold, p1Command, p2Command, gameStatus: nextStatus,
              playerStatueStuckArrows: nextPlayerStatueStuckArrows, enemyStatueStuckArrows: nextEnemyStatueStuckArrows,
              lastTick: now
          });
      }

    }, TICK_RATE);
    
    return () => clearInterval(intervalId);
  }, [role, appMode]);

  let content = null;
  if (appMode === 'LANDING') {
      content = <LandingPage onStartHost={handleStartHost} onStartClient={handleStartClient} onStartOffline={handleStartOffline} />;
  } else if (appMode === 'INTRO') {
      content = <IntroSequence onComplete={handleIntroComplete} />;
  } else if (appMode === 'MAP_SELECT') {
      content = <MapSelection onSelectMap={handleMapSelect} onBack={() => setAppMode('LANDING')} />;
  } else if (appMode === 'GAME') {
      const isClient = role === PlayerRole.CLIENT;
      const playerGold = isClient ? gameState.p2Gold : gameState.p1Gold;
      const enemyGold = isClient ? gameState.p1Gold : gameState.p2Gold;
      const playerCommand = isClient ? gameState.p2Command : gameState.p1Command;

      content = (
          <div className="relative w-full h-full select-none overflow-hidden">
               <BattlefieldBackground mapId={gameState.mapId} />
               <CrystalRock x={GOLD_MINE_PLAYER_X} hasGold={false} />
               <CrystalRock x={GOLD_MINE_ENEMY_X} hasGold={false} />
               <BaseStatue x={STATUE_PLAYER_POS} hp={gameState.playerStatueHP} maxHp={STATUE_HP} isPlayer={true} stuckArrows={gameState.playerStatueStuckArrows} />
               <BaseStatue x={STATUE_ENEMY_POS} hp={gameState.enemyStatueHP} maxHp={STATUE_HP} isPlayer={false} stuckArrows={gameState.enemyStatueStuckArrows} />
               
               <ArmyVisuals 
                  units={gameState.units} 
                  projectiles={gameState.projectiles}
                  isMirrored={isClient}
                  p1Command={gameState.p1Command}
                  p2Command={gameState.p2Command}
               />
               
               <div className="absolute top-0 w-full p-2 flex justify-between items-start pointer-events-none z-30">
                   <div className="bg-stone-900/80 border border-stone-600 rounded-lg p-2 pointer-events-auto backdrop-blur-md">
                       <div className="flex items-center gap-2 mb-2">
                           <span className="font-epic text-blue-400">YOU</span>
                           <div className="flex items-center gap-1 bg-black/50 px-2 rounded">
                               <span className="text-yellow-400 text-xs">◆</span>
                               <span className="font-mono font-bold text-yellow-100">{Math.floor(playerGold)}</span>
                           </div>
                       </div>
                       <div className="flex gap-1">
                           <button onClick={() => handleCommand(GameCommand.ATTACK)} className={`p-2 rounded ${playerCommand === GameCommand.ATTACK ? 'bg-red-600' : 'bg-stone-700'}`}><Sword size={16}/></button>
                           <button onClick={() => handleCommand(GameCommand.DEFEND)} className={`p-2 rounded ${playerCommand === GameCommand.DEFEND ? 'bg-blue-600' : 'bg-stone-700'}`}><Shield size={16}/></button>
                       </div>
                   </div>

                   <button onClick={() => setShowSettings(true)} className="pointer-events-auto p-2 bg-stone-900/50 rounded-full border border-stone-700 text-stone-400 hover:text-white"><RefreshCw size={20} /></button>
               </div>

               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-stone-900/90 p-2 rounded-xl border border-stone-600 shadow-2xl z-40 pointer-events-auto backdrop-blur-md overflow-x-auto max-w-[95vw]">
                   {Object.values(UNIT_CONFIGS).filter(u => u.type !== UnitType.SMALL && u.type !== UnitType.BOSS).map(u => (
                       <UnitCard 
                         key={u.type} 
                         unit={u} 
                         count={0} 
                         canAfford={playerGold >= u.cost}
                         onRecruit={handleRecruit}
                       />
                   ))}
               </div>
               
               {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onLeaveGame={() => { setAppMode('LANDING'); setRole(PlayerRole.OFFLINE); }} />}
               
               {(gameState.gameStatus === 'VICTORY' || gameState.gameStatus === 'DEFEAT') && (
                   <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
                       <div className="text-center">
                           <h1 className={`text-6xl font-epic mb-4 ${gameState.gameStatus === 'VICTORY' ? 'text-green-500' : 'text-red-500'}`}>{gameState.gameStatus}</h1>
                           <button onClick={() => { setAppMode('LANDING'); setRole(PlayerRole.OFFLINE); }} className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform">CONTINUE</button>
                       </div>
                   </div>
               )}
          </div>
      );
  }

  return (
    <div className="h-[100dvh] w-screen bg-black overflow-hidden relative">
        <div ref={viewportRef} className="absolute inset-0">
             {content}
        </div>
    </div>
  );
};