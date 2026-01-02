import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnitType, GameUnit, GameState, GameCommand, PlayerRole, MapId } from './types';
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

const BaseStatue: React.FC<{ x: number; hp: number; variant: 'BLUE' | 'RED'; isFlipped?: boolean }> = ({ x, hp, variant, isFlipped }) => {
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
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [gameState, setGameState] = useState<GameState>({
    units: [],
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

  useEffect(() => {
    if (gameState.gameStatus !== 'PLAYING') {
       const timer = setTimeout(handleReturnToMenu, 5000);
       return () => clearTimeout(timer);
    }
  }, [gameState.gameStatus, handleReturnToMenu]);

  // Unified Game Loop
  useEffect(() => {
    if ((role !== PlayerRole.HOST && role !== PlayerRole.OFFLINE) || appMode !== 'GAME') return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaTime = Math.min((now - stateRef.current.lastTick) / 1000, 0.05);
      
      let { units: nextUnits, playerStatueHP: pStatueHP, enemyStatueHP: eStatueHP, p1Gold, p2Gold, p1Command, p2Command, gameStatus } = stateRef.current;
      if (gameStatus !== 'PLAYING') return;

      let processedUnits = nextUnits.map(u => ({ ...u }));
      let newSummons: GameUnit[] = [];

      // Process Queue
      while (actionQueueRef.current.length > 0) {
        const action = actionQueueRef.current.shift();
        if (action.type === 'RECRUIT') {
          const config = UNIT_CONFIGS[action.unitType as UnitType];
          const isP1 = action.side === 'player';
          if ((isP1 ? p1Gold : p2Gold) >= config.cost) {
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
              hasGold: false
            });
            AudioService.playRecruit();
          }
        } else if (action.type === 'CHANGE_COMMAND') {
          if (action.side === 'player') p1Command = action.command; else p2Command = action.command;
        }
      }

      // --- FORMATION LOGIC ---
      // 1. Identify valid combat units (ignore workers/dying)
      const combatUnits = processedUnits.filter(u => u.type !== UnitType.WORKER && u.state !== 'DYING' && u.state !== 'MINING' && u.state !== 'DEPOSITING');
      const pUnits = combatUnits.filter(u => u.side === 'player');
      const eUnits = combatUnits.filter(u => u.side === 'enemy');

      // 2. Determine "Anchor" Offset for each side (Smallest offset present = Leading unit type)
      let pMinOffset = Infinity;
      pUnits.forEach(u => {
          const off = FORMATION_OFFSETS[u.type] || 0;
          if (off < pMinOffset) pMinOffset = off;
      });
      let eMinOffset = Infinity;
      eUnits.forEach(u => {
          const off = FORMATION_OFFSETS[u.type] || 0;
          if (off < eMinOffset) eMinOffset = off;
      });

      // 3. Calculate Frontline Position based ONLY on the leading unit types
      // Player (moves right +): Front is MAX X of leading units + their offset
      let pFront = -Infinity;
      pUnits.forEach(u => {
          const off = FORMATION_OFFSETS[u.type] || 0;
          if (off === pMinOffset) {
             const val = u.x + off;
             if (val > pFront) pFront = val;
          }
      });
      if (pFront === -Infinity) pFront = 0; // Default if no units

      // Enemy (moves left -): Front is MIN X of leading units - their offset
      let eFront = Infinity;
      eUnits.forEach(u => {
          const off = FORMATION_OFFSETS[u.type] || 0;
          if (off === eMinOffset) {
             const val = u.x - off;
             if (val < eFront) eFront = val;
          }
      });
      if (eFront === Infinity) eFront = 100;

      // Physics and Logic
      processedUnits.forEach(unit => {
        if (unit.state === 'DYING') return;
        const config = UNIT_CONFIGS[unit.type];
        const isPlayer = unit.side === 'player';
        let targetVelocity = 0;

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
             if (activeMinions < 3) {
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

        // Worker Mining Logic
        if (unit.type === UnitType.WORKER) {
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
        } else {
          // Combat & Movement for non-workers
          const cmd = isPlayer ? p1Command : p2Command;
          const dir = isPlayer ? 1 : -1;

          // --- RETREAT LOGIC (High Priority) ---
          if (cmd === GameCommand.RETREAT) {
             const homeX = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
             const distToHome = Math.abs(unit.x - homeX);
             
             // Move to tower and stay there
             if (distToHome < 2) {
                 unit.state = 'IDLE';
                 targetVelocity = 0;
             } else {
                 unit.state = 'WALKING';
                 targetVelocity = (unit.x < homeX ? 1 : -1) * config.stats.speed;
             }
          } else {
             // --- ATTACK OR DEFEND LOGIC ---
             const targetStatueX = isPlayer ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
             
             // TARGETING LOGIC: Find CLOSEST enemy
             const potentialTargets = processedUnits.filter(u => u.side !== unit.side && u.state !== 'DYING' && Math.abs(u.x - unit.x) < config.stats.range + 2);
             potentialTargets.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x));
             const enemyTarget = potentialTargets.length > 0 ? potentialTargets[0] : null;

             // Attack Logic (Aggro or Base Siege)
             // In DEFEND mode, units only attack if an enemy is within range (hold ground).
             // In ATTACK mode, units also attack statue if close.
             const canSiege = cmd === GameCommand.ATTACK && Math.abs(unit.x - targetStatueX) < config.stats.range + 1;
             
             if (enemyTarget || canSiege) {
                unit.state = 'ATTACKING';
                targetVelocity = 0;
                if (now - unit.lastAttackTime > config.stats.attackSpeed) {
                  AudioService.playAttack(unit.type);
                  if (enemyTarget) {
                    // Calculate Damage with Reductions
                    let damageDealt = config.stats.damage;
                    
                    // PALADIN DAMAGE REDUCTION
                    if (enemyTarget.type === UnitType.PALADIN) {
                        damageDealt *= 0.7; // 30% reduction
                    }

                    enemyTarget.hp -= damageDealt;
                    enemyTarget.lastDamageTime = now;
                    enemyTarget.lastDamageAmount = Math.floor(damageDealt);
                    
                    // IMPACT EFFECTS
                    const knockbackForce = (unit.type === UnitType.BOSS ? 2.5 : (unit.type === UnitType.PALADIN ? 1.5 : 0.5));
                    enemyTarget.x += isPlayer ? knockbackForce : -knockbackForce;
                    
                    if (unit.type === UnitType.TOXIC) {
                        enemyTarget.poisonTicks = 3;
                        enemyTarget.lastPoisonTickTime = now;
                    }
                    
                    if (unit.type === UnitType.BOSS || unit.type === UnitType.PALADIN) {
                        setShakeTrigger(now + 400);
                    }
                  } else if (canSiege) {
                    if (isPlayer) eStatueHP -= config.stats.damage; else pStatueHP -= config.stats.damage;
                    AudioService.playDamage();
                    if (unit.type === UnitType.BOSS) setShakeTrigger(now + 400);
                  }
                  unit.lastAttackTime = now;
                }
             } else {
                // Movement Logic
                unit.state = 'WALKING';
                
                if (cmd === GameCommand.DEFEND) {
                    // DEFENSE FORMATION LOGIC
                    // Align units relative to the defense line (ahead of gold mine)
                    // Player Front: Gold Mine (15) + Buffer (15) = 30
                    // Enemy Front: Gold Mine (85) - Buffer (15) = 70
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
                    // ATTACK Command
                    targetVelocity = dir * config.stats.speed;
                    
                    // -- APPLY FORMATION LIMITS --
                    const offset = FORMATION_OFFSETS[unit.type] || 0;
                    if (isPlayer) {
                        const limitX = pFront - offset;
                        if (offset > pMinOffset && unit.x >= limitX - 0.5) {
                            targetVelocity = 0; // Wait for front to advance
                        }
                    } else {
                        const limitX = eFront + offset;
                        if (offset > eMinOffset && unit.x <= limitX + 0.5) {
                            targetVelocity = 0; // Wait
                        }
                    }
                }
             }
          }
        }

        // Apply Smoothing
        const agility = UNIT_AGILITY[unit.type] || 5;
        unit.currentSpeed += (targetVelocity - unit.currentSpeed) * (1 - Math.exp(-agility * deltaTime));
        unit.x += unit.currentSpeed * deltaTime;
        unit.x = Math.max(0, Math.min(100, unit.x));
      });

      // Cleanup & Merge Summons
      processedUnits = [...processedUnits, ...newSummons].filter(u => {
        if (u.hp <= 0 && u.state !== 'DYING') { u.state = 'DYING'; u.deathTime = now; }
        return !(u.state === 'DYING' && now - (u.deathTime || 0) > DEATH_DURATION);
      });
      
      // --- IMPROVED AI LOGIC ---
      if ((role === PlayerRole.HOST || role === PlayerRole.OFFLINE) && now - aiStateRef.current.lastDecisionTime > 2000) {
          const aiGold = p2Gold;
          const aiUnits = processedUnits.filter(u => u.side === 'enemy' && u.state !== 'DYING');
          const playerUnits = processedUnits.filter(u => u.side === 'player' && u.state !== 'DYING');
          
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

      const nextState: GameState = { ...stateRef.current, units: processedUnits, playerStatueHP: pStatueHP, enemyStatueHP: eStatueHP, p1Gold, p2Gold, p1Command, p2Command, gameStatus: nextStatus, lastTick: now };
      setGameState(nextState);
      if (role === PlayerRole.HOST) mpService.send({ type: 'GAME_STATE_UPDATE', payload: nextState });

    }, TICK_RATE);
    return () => clearInterval(intervalId);
  }, [role, appMode]);

  if (appMode === 'INTRO') return <IntroSequence onComplete={() => setAppMode('LANDING')} />;
  if (appMode === 'LANDING') return <LandingPage onStartHost={(s) => { setRole(PlayerRole.HOST); setIsSurgeMode(s); setAppMode('MAP_SELECT'); }} onStartClient={() => { setRole(PlayerRole.CLIENT); setAppMode('GAME'); }} onStartOffline={(s) => { setRole(PlayerRole.OFFLINE); setIsSurgeMode(s); setAppMode('MAP_SELECT'); }} />;
  if (appMode === 'MAP_SELECT') return <MapSelection onSelectMap={(m) => { setGameState(prev => ({...prev, mapId: m, p1Gold: isSurgeMode?2000:50, p2Gold: isSurgeMode?2000:50})); setAppMode('GAME'); }} onBack={() => setAppMode('LANDING')} />;

  const amIHost = role !== PlayerRole.CLIENT;
  const isVictory = amIHost ? gameState.gameStatus === 'VICTORY' : gameState.gameStatus === 'DEFEAT';
  const currentCommand = amIHost ? gameState.p1Command : gameState.p2Command;

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
          <div className="relative h-full min-w-[200vw]">
            <BattlefieldBackground mapId={gameState.mapId} />
            <BaseStatue x={getVisualX(STATUE_PLAYER_POS)} hp={gameState.playerStatueHP} variant="BLUE" isFlipped={isMirrored} />
            <GoldMine x={getVisualX(GOLD_MINE_PLAYER_X)} isFlipped={isMirrored} />
            <GoldMine x={getVisualX(GOLD_MINE_ENEMY_X)} isFlipped={!isMirrored} />
            <BaseStatue x={getVisualX(STATUE_ENEMY_POS)} hp={gameState.enemyStatueHP} variant="RED" isFlipped={!isMirrored} />
            <ArmyVisuals units={gameState.units} selectedUnitId={selectedUnitId} onSelectUnit={setSelectedUnitId} isMirrored={isMirrored} />
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
         <div className="flex items-center gap-2"><Users className="text-stone-400" size={18} /><span className="text-stone-100 font-bold">{gameState.units.filter(u => u.side === (amIHost ? 'player' : 'enemy') && u.state !== 'DYING').length}/{MAX_UNITS}</span></div>
      </div>

      {/* TOP RIGHT BELOW RESOURCES: Controls (Surrender + Volume) */}
      <div className="fixed top-16 right-4 z-40 flex gap-2">
          {/* Surrender Button */}
          <button 
              onClick={() => {
                  if (window.confirm("Surrender battle?")) {
                      if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
                          setGameState(prev => ({ ...prev, playerStatueHP: 0 }));
                      } else {
                          mpService.send({ type: 'SURRENDER', payload: {} });
                          setGameState(prev => ({ ...prev, playerStatueHP: 0 }));
                      }
                  }
              }}
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
                  disabled={currentGold < u.cost}
                  onClick={() => actionQueueRef.current.push({type: 'RECRUIT', unitType: u.type, side: amIHost ? 'player' : 'enemy'})}
                  className={`p-2 rounded border flex flex-col items-center min-w-[64px] transition-all ${currentGold >= u.cost ? 'bg-stone-800 border-white/5 active:scale-95' : 'bg-stone-900 opacity-40 border-transparent grayscale'}`}
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

      {gameState.gameStatus !== 'PLAYING' && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-intro-fade">
             <div className={`bg-stone-900 p-12 rounded-2xl border-4 text-center shadow-2xl ${isVictory ? 'animate-victory-modal' : 'animate-defeat-modal'}`}>
                 <h1 className={`text-6xl font-epic mb-4 animate-flourish ${isVictory ? 'text-yellow-400' : 'text-red-600'}`}>
                     {isVictory ? 'VICTORY!' : 'DEFEAT'}
                 </h1>
                 <p className="text-stone-400 animate-subtext">The Saga continues in your glory...</p>
             </div>
         </div>
      )}
    </div>
  );
};