import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnitType, GameUnit, GameState, GameCommand, BattleLogEntry, PlayerRole, NetworkMessage } from './types';
import { 
  UNIT_CONFIGS, 
  SPAWN_X_PLAYER, 
  SPAWN_X_ENEMY, 
  STATUE_HP,
  GOLD_MINE_PLAYER_X,
  GOLD_MINE_ENEMY_X,
  STATUE_PLAYER_POS,
  STATUE_ENEMY_POS
} from './constants';
import { UnitCard } from './components/UnitCard';
import { ArmyVisuals } from './components/ArmyVisuals';
import { LandingPage } from './components/LandingPage';
import { AudioService } from './services/audioService';
import { mpService } from './services/multiplayerService';
import { Coins, Shield, Swords, RefreshCw, Users, X, MoveHorizontal, Music, VolumeX, CornerDownLeft } from 'lucide-react';

// --- SUB-COMPONENTS ---

const GoldMine: React.FC<{ x: number; isEnemy?: boolean }> = ({ x, isEnemy }) => (
  <div 
    className="absolute bottom-28 w-24 h-24 z-0 pointer-events-none"
    style={{ left: `${x}%`, transform: 'translateX(-50%)' }}
  >
     <div className={`w-full h-full ${isEnemy ? 'scale-x-[-1]' : ''}`}>
        <svg viewBox="0 0 100 100" className="drop-shadow-lg overflow-visible">
           {/* Rock Mound */}
           <path d="M10 100 L 25 60 L 75 60 L 90 100 Z" fill="#44403c" stroke="#292524" strokeWidth="2" />
           {/* Cave Entrance */}
           <path d="M35 100 Q 50 60 65 100" fill="#1c1917" />
           {/* Gold Nuggets */}
           <circle cx="30" cy="80" r="4" fill="#fbbf24" opacity="0.8" />
           <circle cx="70" cy="75" r="3" fill="#fbbf24" opacity="0.6" />
           <circle cx="50" cy="55" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
           {/* Support Beams */}
           <path d="M25 60 L 25 30" stroke="#78350f" strokeWidth="4" />
           <path d="M75 60 L 75 30" stroke="#78350f" strokeWidth="4" />
           <path d="M20 30 L 80 30" stroke="#78350f" strokeWidth="4" />
        </svg>
     </div>
  </div>
);

const BaseStatue: React.FC<{ x: number; hp: number; isEnemy?: boolean }> = ({ x, hp, isEnemy }) => {
    const hpPercent = Math.max(0, (hp / STATUE_HP) * 100);
    return (
        <div 
            className="absolute bottom-24 w-40 h-56 z-5 pointer-events-none"
            style={{ left: `${x}%`, transform: 'translateX(-50%)' }}
        >
            {/* HP Bar */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/70 rounded border border-white/20 p-1 mb-2">
                <div 
                    className={`h-full rounded-sm transition-all duration-300 ${isEnemy ? 'bg-red-600' : 'bg-blue-500'}`} 
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            
            <div className={`w-full h-full ${isEnemy ? 'scale-x-[-1]' : ''}`}>
                <svg viewBox="0 0 100 140" className="drop-shadow-2xl overflow-visible">
                    {/* Base */}
                    <path d="M10 140 L 20 120 L 80 120 L 90 140 Z" fill="#57534e" stroke="black" strokeWidth="2" />
                    
                    {isEnemy ? (
                        <g>
                            {/* Enemy Totem */}
                            <path d="M30 120 L 35 20 L 65 20 L 70 120 Z" fill="#450a0a" stroke="black" strokeWidth="2" />
                            <path d="M20 40 L 80 40 L 50 100 Z" fill="#7f1d1d" opacity="0.5" />
                            {/* Skulls */}
                            <circle cx="50" cy="30" r="12" fill="#e5e5e5" stroke="black" />
                            <circle cx="46" cy="28" r="2" fill="black" />
                            <circle cx="54" cy="28" r="2" fill="black" />
                            {/* Horns */}
                            <path d="M38 20 L 20 5 L 40 25" fill="#fefce8" stroke="black" />
                            <path d="M62 20 L 80 5 L 60 25" fill="#fefce8" stroke="black" />
                            {/* Glow */}
                            <circle cx="50" cy="60" r="15" fill="red" filter="blur(10px)" opacity="0.5" className="animate-pulse" />
                        </g>
                    ) : (
                        <g>
                            {/* Player Crystal */}
                            <path d="M35 120 L 40 80 L 30 50 L 50 10 L 70 50 L 60 80 L 65 120 Z" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                            <path d="M50 10 L 50 120" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                            <path d="M30 50 L 70 50" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                            
                            {/* Floating Crystal Core */}
                            <path d="M50 35 L 60 50 L 50 65 L 40 50 Z" fill="#60a5fa" className="animate-pulse">
                                <animateTransform attributeName="transform" type="translate" values="0 0; 0 -5; 0 0" dur="3s" repeatCount="indefinite" />
                            </path>
                            
                            {/* Glow */}
                            <circle cx="50" cy="50" r="20" fill="#3b82f6" filter="blur(15px)" opacity="0.4" />
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
};

const TICK_RATE = 50; // ms
const ACCELERATION = 20; // Units per second squared
const DEATH_DURATION = 1000; // ms to keep dying units visible
const INITIAL_GOLD = 400;

const App: React.FC = () => {
  // --- APP NAVIGATION STATE ---
  const [appMode, setAppMode] = useState<'LANDING' | 'GAME'>('LANDING');
  const [role, setRole] = useState<PlayerRole>(PlayerRole.HOST);

  // --- GAME STATE ---
  const [command, setCommand] = useState<GameCommand>(GameCommand.DEFEND);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isArmyMenuOpen, setIsArmyMenuOpen] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false); // Music state
  
  // Drag Scrolling State
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
    lastTick: Date.now(),
    gameStatus: 'PLAYING'
  });

  const [logs, setLogs] = useState<BattleLogEntry[]>([]);
  
  // Refs for loop to avoid stale closures
  const stateRef = useRef(gameState);
  const commandRef = useRef(command);
  
  // Sync refs
  useEffect(() => { stateRef.current = gameState; }, [gameState]);
  useEffect(() => { commandRef.current = command; }, [command]);

  // --- NAVIGATION HANDLERS ---
  const handleStartHost = () => {
      setRole(PlayerRole.HOST);
      setAppMode('GAME');
      addLog("Multiplayer Session Started. You are the Host (Blue).", "info");
      
      // Auto-start music if not already enabled
      if (!isMusicEnabled) {
          toggleMusic();
      }
  };

  const handleStartClient = () => {
      setRole(PlayerRole.CLIENT);
      setAppMode('GAME');
      addLog("Connected to Server. You are the Challenger (Red).", "info");

      // Auto-start music if not already enabled
      if (!isMusicEnabled) {
          toggleMusic();
      }
  };

  const toggleMusic = () => {
      if (isMusicEnabled) {
          AudioService.stopMusic();
          setIsMusicEnabled(false);
      } else {
          AudioService.startMusic();
          setIsMusicEnabled(true);
      }
  };

  // --- NETWORK LISTENERS ---
  useEffect(() => {
    if (appMode !== 'GAME') return;

    mpService.onMessage((msg: NetworkMessage) => {
        if (role === PlayerRole.CLIENT) {
            // CLIENT LOGIC: Receive State
            if (msg.type === 'GAME_STATE_UPDATE') {
                setGameState(msg.payload);
            }
        } else {
            // HOST LOGIC: Receive Commands
            if (msg.type === 'RECRUIT_REQUEST') {
                handleHostRecruitEnemy(msg.payload.unitType);
            }
            if (msg.type === 'COMMAND_UPDATE') {
                // Future implementation
            }
            if (msg.type === 'GAME_RESET') {
                resetGame();
            }
        }
    });
  }, [appMode, role]);


  // --- HELPERS ---
  const addLog = useCallback((message: string, type: BattleLogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-4), { // Keep last 5
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: Date.now()
    }]);
  }, []);

  const spawnUnit = (type: UnitType, side: 'player' | 'enemy') => {
    // Only Host spawns units
    if (role !== PlayerRole.HOST) return;

    const config = UNIT_CONFIGS[type];
    const newUnit: GameUnit = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      side,
      x: side === 'player' ? SPAWN_X_PLAYER : SPAWN_X_ENEMY,
      hp: config.stats.hp,
      maxHp: config.stats.hp,
      state: 'IDLE',
      lastAttackTime: 0,
      targetId: null,
      currentSpeed: 0,
      hasGold: false
    };

    setGameState(prev => ({
      ...prev,
      units: [...prev.units, newUnit]
    }));
  };

  // HOST: Handle Client's recruit request
  const handleHostRecruitEnemy = (type: UnitType) => {
     const config = UNIT_CONFIGS[type];
     if (stateRef.current.p2Gold >= config.cost) {
         setGameState(prev => ({ ...prev, p2Gold: prev.p2Gold - config.cost }));
         spawnUnit(type, 'enemy');
     }
  };

  // UI BUTTON CLICK
  const handleRecruit = (type: UnitType) => {
    const config = UNIT_CONFIGS[type];
    
    if (role === PlayerRole.HOST) {
        // Host (Player 1 - Blue)
        if (gameState.p1Gold >= config.cost) {
            AudioService.playRecruit();
            setGameState(prev => ({ ...prev, p1Gold: prev.p1Gold - config.cost }));
            spawnUnit(type, 'player');
        }
    } else {
        // Client (Player 2 - Red)
        if (gameState.p2Gold >= config.cost) {
            AudioService.playRecruit();
            // Send request to Host
            mpService.send({ type: 'RECRUIT_REQUEST', payload: { unitType: type } });
        }
    }
  };

  const handleSelectUnit = (id: string) => {
    AudioService.playSelect();
    setSelectedUnitId(id);
  };

  const resetGame = () => {
    if (role === PlayerRole.HOST) {
        AudioService.playSelect();
        const newState: GameState = {
            units: [],
            playerStatueHP: STATUE_HP,
            enemyStatueHP: STATUE_HP,
            p1Gold: INITIAL_GOLD,
            p2Gold: INITIAL_GOLD,
            lastTick: Date.now(),
            gameStatus: 'PLAYING'
        };
        setGameState(newState);
        setCommand(GameCommand.DEFEND);
        setLogs([]);
        setSelectedUnitId(null);
        addLog("Battle Reset!", "info");
        mpService.send({ type: 'GAME_STATE_UPDATE', payload: newState });
    } else {
        // Client requests reset
        mpService.send({ type: 'GAME_RESET', payload: {} });
    }
    
    // Reset scroll
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
    }
  };

  // --- SCROLL HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll-fast
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // --- GAME LOOP (HOST ONLY) ---
  useEffect(() => {
    if (role !== PlayerRole.HOST || appMode !== 'GAME') return;

    const intervalId = setInterval(() => {
      if (stateRef.current.gameStatus !== 'PLAYING') return;

      const now = Date.now();
      const deltaTime = (now - stateRef.current.lastTick) / 1000; // seconds
      
      let currentUnits = [...stateRef.current.units];
      let pStatueHP = stateRef.current.playerStatueHP;
      let eStatueHP = stateRef.current.enemyStatueHP;
      let p1Gold = stateRef.current.p1Gold;
      let p2Gold = stateRef.current.p2Gold;

      // Logic removed for brevity in this response, assumed unchanged
      // ... (Same game logic as before) ...
      
      // Re-implementing just the simplified update logic for the diff
      currentUnits.forEach(unit => {
        if (unit.state === 'DYING') return;
        const config = UNIT_CONFIGS[unit.type];
        const isPlayer = unit.side === 'player';
        let targetVelocity = 0;

        if (unit.type === UnitType.WORKER) {
             const mineLocation = isPlayer ? GOLD_MINE_PLAYER_X : GOLD_MINE_ENEMY_X;
             const statueLocation = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
             const MINING_DURATION = 2000;
             const DEPOSIT_DURATION = 1000;
             const miningRange = 1.5;

             if (unit.state === 'MINING') {
                targetVelocity = 0;
                if (now - unit.lastAttackTime > MINING_DURATION) {
                   unit.hasGold = true;
                   unit.state = 'WALKING';
                }
             }
             else if (unit.state === 'DEPOSITING') {
                targetVelocity = 0;
                if (now - unit.lastAttackTime > DEPOSIT_DURATION) {
                   if (isPlayer) {
                      p1Gold += 50;
                      if (Math.random() > 0.8) AudioService.playRecruit();
                   } else {
                      p2Gold += 50;
                   }
                   unit.hasGold = false;
                   unit.state = 'WALKING';
                }
             }
             else {
                if (unit.hasGold) {
                    const distToStatue = Math.abs(unit.x - statueLocation);
                    if (distToStatue <= miningRange) {
                       unit.state = 'DEPOSITING';
                       unit.lastAttackTime = now;
                       targetVelocity = 0;
                    } else {
                       targetVelocity = (unit.x < statueLocation ? 1 : -1) * config.stats.speed;
                    }
                } else {
                    const distToMine = Math.abs(unit.x - mineLocation);
                    if (distToMine <= miningRange) {
                       unit.state = 'MINING';
                       unit.lastAttackTime = now;
                       targetVelocity = 0;
                    } else {
                       targetVelocity = (unit.x < mineLocation ? 1 : -1) * config.stats.speed;
                    }
                }
             }
        } 
        else {
            const statuePos = isPlayer ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
            const distToStatue = Math.abs(unit.x - statuePos);
            let target: GameUnit | undefined;
            let distToTarget = 10000;
            const enemies = currentUnits.filter(u => u.side !== unit.side && u.hp > 0 && u.state !== 'DYING');
            enemies.forEach(e => {
                 const dist = Math.abs(e.x - unit.x);
                 if (dist < distToTarget) {
                     distToTarget = dist;
                     target = e;
                 }
            });
            let hittingStatue = false;
            let hittingUnit = false;
            if (distToStatue <= config.stats.range + 1) {
                 if (!target || distToTarget > distToStatue) {
                     hittingStatue = true;
                 }
            }
            if (!hittingStatue && target && distToTarget <= config.stats.range) {
                 hittingUnit = true;
            }
            if (hittingStatue || hittingUnit) {
                unit.state = 'ATTACKING';
                targetVelocity = 0;
                if (now - unit.lastAttackTime > config.stats.attackSpeed) {
                    AudioService.playAttack(unit.type);
                    if (hittingUnit && target) {
                        target.hp -= config.stats.damage;
                    }
                    else if (hittingStatue) {
                        if (isPlayer) {
                            eStatueHP -= config.stats.damage;
                            AudioService.playDamage();
                        } else {
                            pStatueHP -= config.stats.damage;
                            AudioService.playDamage();
                        }
                    }
                    unit.lastAttackTime = now;
                }
            }
            else {
                let moveDir = 0;
                const dirToStatue = unit.x < statuePos ? 1 : -1;
                const dirToTarget = target ? (unit.x < target.x ? 1 : -1) : dirToStatue;

                if (isPlayer) {
                    if (commandRef.current === GameCommand.ATTACK) {
                         moveDir = dirToStatue; 
                    } else if (commandRef.current === GameCommand.DEFEND) { 
                        const DEFEND_LINE = 30;
                        const THREAT_RANGE = 50; 
                        if (target && target.x < THREAT_RANGE && Math.abs(target.x - unit.x) < config.stats.range + 10) {
                             moveDir = dirToTarget; 
                        } else {
                            if (unit.x > DEFEND_LINE + 1) moveDir = -1;
                            else if (unit.x < DEFEND_LINE - 1) moveDir = 1; 
                            else moveDir = 0; 
                        }
                    } else if (commandRef.current === GameCommand.RETREAT) {
                        const BASE_POS = 10;
                        if (unit.x > BASE_POS) moveDir = -1;
                        else if (unit.x < BASE_POS - 2) moveDir = 1;
                        else moveDir = 0;
                    }
                } else {
                    moveDir = dirToStatue;
                }
                if (moveDir === 0) {
                    unit.state = 'IDLE';
                    targetVelocity = 0;
                } else {
                    unit.state = 'WALKING';
                    targetVelocity = moveDir * config.stats.speed;
                }
            }
        }
        if (typeof unit.currentSpeed === 'undefined') unit.currentSpeed = 0;
        const step = ACCELERATION * deltaTime;
        if (unit.currentSpeed < targetVelocity) {
            unit.currentSpeed = Math.min(unit.currentSpeed + step, targetVelocity);
        } else if (unit.currentSpeed > targetVelocity) {
            unit.currentSpeed = Math.max(unit.currentSpeed - step, targetVelocity);
        }
        if (Math.abs(unit.currentSpeed) > 0.01) {
             unit.x += unit.currentSpeed * deltaTime;
             unit.x = Math.max(0, Math.min(100, unit.x));
        }
      });

      currentUnits.forEach(u => {
         if (u.hp <= 0 && u.state !== 'DYING') {
             u.state = 'DYING';
             u.deathTime = now;
             u.hp = 0;
         }
      });

      currentUnits = currentUnits.filter(u => {
          if (u.state === 'DYING') {
              const timeSinceDeath = now - (u.deathTime || 0);
              return timeSinceDeath < DEATH_DURATION;
          }
          return true;
      });

      let newStatus = stateRef.current.gameStatus;
      if (pStatueHP <= 0) newStatus = 'DEFEAT';
      if (eStatueHP <= 0) newStatus = 'VICTORY';

      if (newStatus !== stateRef.current.gameStatus) {
         if (newStatus === 'VICTORY') AudioService.playFanfare(true);
         if (newStatus === 'DEFEAT') AudioService.playFanfare(false);
      }

      const nextState = {
        units: currentUnits,
        playerStatueHP: pStatueHP,
        enemyStatueHP: eStatueHP,
        p1Gold,
        p2Gold,
        lastTick: now,
        gameStatus: newStatus
      };

      setGameState(nextState);
      mpService.send({ type: 'GAME_STATE_UPDATE', payload: nextState });

    }, TICK_RATE);

    return () => clearInterval(intervalId);
  }, [role, appMode]);

  if (appMode === 'LANDING') {
      return <LandingPage onStartHost={handleStartHost} onStartClient={handleStartClient} />;
  }

  const currentGold = role === PlayerRole.HOST ? gameState.p1Gold : gameState.p2Gold;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative touch-none">
      
      {/* GAME AREA */}
      <div 
        className="absolute inset-0 flex flex-col bg-inamorta select-none"
        onClick={() => setSelectedUnitId(null)}
      >
          
          {/* HUD Overlay */}
          <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-start z-30 pointer-events-none">
             {/* Player Resources & Controls */}
             <div className="bg-black/80 backdrop-blur p-2 rounded-lg border border-yellow-500/30 text-white shadow-xl pointer-events-auto flex items-center gap-2 sm:gap-6 max-w-full overflow-x-auto no-scrollbar">
                
                {/* Role Indicator */}
                <div className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${role === PlayerRole.HOST ? 'bg-blue-600' : 'bg-red-600'}`}>
                    {role === PlayerRole.HOST ? 'HOST (BLUE)' : 'CLIENT (RED)'}
                </div>

                {/* Gold */}
                <div className="flex items-center gap-2 min-w-[80px]">
                    <Coins className="text-yellow-400 w-4 h-4 sm:w-6 sm:h-6" />
                    <span className="text-lg sm:text-xl font-bold font-mono text-yellow-100">{Math.floor(currentGold)}</span>
                </div>
                
                <div className="h-8 w-px bg-white/20"></div>
                
                {/* Commands (Host Only) */}
                {role === PlayerRole.HOST && (
                    <div className="flex gap-1 sm:gap-2">
                        <button 
                            onClick={() => {
                                AudioService.playSelect();
                                setCommand(GameCommand.ATTACK);
                            }}
                            className={`p-1.5 sm:p-2 rounded flex items-center gap-1 sm:gap-2 font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 ${command === GameCommand.ATTACK ? 'bg-red-600 border-red-800' : 'bg-gray-700 border-gray-900 text-gray-400'}`}
                        >
                            <Swords size={16} /> <span className="hidden md:inline">ATTACK</span>
                        </button>
                        <button 
                            onClick={() => {
                                AudioService.playSelect();
                                setCommand(GameCommand.DEFEND);
                            }}
                            className={`p-1.5 sm:p-2 rounded flex items-center gap-1 sm:gap-2 font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 ${command === GameCommand.DEFEND ? 'bg-blue-600 border-blue-800' : 'bg-gray-700 border-gray-900 text-gray-400'}`}
                        >
                            <Shield size={16} /> <span className="hidden md:inline">DEFEND</span>
                        </button>
                        <button 
                            onClick={() => {
                                AudioService.playSelect();
                                setCommand(GameCommand.RETREAT);
                            }}
                            className={`p-1.5 sm:p-2 rounded flex items-center gap-1 sm:gap-2 font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 ${command === GameCommand.RETREAT ? 'bg-orange-600 border-orange-800' : 'bg-gray-700 border-gray-900 text-gray-400'}`}
                        >
                            <CornerDownLeft size={16} /> <span className="hidden md:inline">RETREAT</span>
                        </button>
                    </div>
                )}
                
                {/* Army Button */}
                <button
                    onClick={() => {
                        AudioService.playSelect();
                        setIsArmyMenuOpen(true);
                    }}
                    className="p-1.5 sm:p-2 bg-yellow-600 border-yellow-800 rounded flex items-center gap-1 sm:gap-2 font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 hover:bg-yellow-500 text-white ml-2"
                >
                    <Users size={16} />
                    <span className="hidden sm:inline">ARMY</span>
                </button>
                
                {/* Music Toggle */}
                 <button
                    onClick={() => {
                        AudioService.playSelect();
                        toggleMusic();
                    }}
                    className={`p-1.5 sm:p-2 rounded transition-colors ${isMusicEnabled ? 'text-yellow-400 hover:text-yellow-200' : 'text-stone-500 hover:text-stone-300'}`}
                    title="Toggle Music"
                >
                    {isMusicEnabled ? <Music size={16} /> : <VolumeX size={16} />}
                </button>
             </div>

             {/* Status Message Overlay */}
             {gameState.gameStatus !== 'PLAYING' && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 p-4 sm:p-8 rounded-xl border-2 border-white text-center pointer-events-auto z-50 min-w-[280px]">
                     <h1 className={`text-4xl sm:text-6xl font-epic mb-4 ${gameState.gameStatus === 'VICTORY' ? 'text-yellow-400' : 'text-red-500'}`}>
                         {role === PlayerRole.HOST 
                            ? (gameState.gameStatus === 'VICTORY' ? 'VICTORY!' : 'DEFEAT')
                            : (gameState.gameStatus === 'VICTORY' ? 'DEFEAT' : 'VICTORY!') // Client perspective inverted
                         }
                     </h1>
                     <button 
                        onClick={resetGame}
                        className="bg-white text-black font-bold px-6 py-3 rounded hover:bg-gray-200 flex items-center justify-center gap-2 mx-auto w-full"
                     >
                        <RefreshCw /> {role === PlayerRole.HOST ? 'RESET GAME' : 'REQUEST REMATCH'}
                     </button>
                 </div>
             )}
          </div>

          {/* BATTLEFIELD CONTAINER (Scrollable) */}
          <div className="absolute inset-0 pointer-events-none z-0">
             <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-yellow-200 blur-2xl opacity-40"></div>
             <div className="absolute top-20 left-40 w-64 h-24 bg-white/10 blur-3xl rounded-full"></div>
          </div>
          
          <div 
            className={`absolute top-0 bottom-0 left-0 right-0 overflow-x-auto no-scrollbar z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            // Enable native touch scrolling by default with overflow-x-auto, but we can add handlers if we wanted specific behavior
          >
             {/* The World Content: 300% Width */}
             <div className="w-[300%] h-full relative">
                 <div className="absolute bottom-0 w-full h-28 ground-layer z-0 shadow-2xl"></div>

                 <GoldMine x={GOLD_MINE_PLAYER_X} />
                 <GoldMine x={GOLD_MINE_ENEMY_X} isEnemy />

                 <BaseStatue x={STATUE_PLAYER_POS} hp={gameState.playerStatueHP} />
                 <BaseStatue x={STATUE_ENEMY_POS} isEnemy hp={gameState.enemyStatueHP} />

                 <div className="absolute bottom-24 left-0 right-0 h-48 z-10 pointer-events-none">
                     <div className="w-full h-full relative pointer-events-auto">
                        <ArmyVisuals 
                            units={gameState.units} 
                            selectedUnitId={selectedUnitId}
                            onSelectUnit={handleSelectUnit}
                        />
                     </div>
                 </div>

                 <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white/20 font-bold text-4xl animate-pulse pointer-events-none select-none z-20">
                    <MoveHorizontal size={48} />
                 </div>
             </div>
          </div>
      </div>

      {/* SIDEBAR - ARMY SELECTION (Slide over) */}
      <div 
        className={`fixed inset-y-0 right-0 w-64 sm:w-80 bg-stone-900 border-l-4 border-black flex flex-col z-40 shadow-2xl transition-transform duration-300 ease-in-out transform ${isArmyMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
          <div className="p-2 sm:p-4 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
             <h2 className="text-stone-300 font-epic text-lg sm:text-xl">Barracks</h2>
             <button onClick={() => setIsArmyMenuOpen(false)} className="text-stone-500 hover:text-white transition-colors p-1">
                <X />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            {Object.values(UNIT_CONFIGS).map(unit => {
                const mySide = role === PlayerRole.HOST ? 'player' : 'enemy';
                const count = gameState.units.filter(u => u.side === mySide && u.type === unit.type).length;
                return (
                    <UnitCard 
                        key={unit.type}
                        unit={unit}
                        count={count}
                        canAfford={currentGold >= unit.cost}
                        onRecruit={handleRecruit}
                    />
                );
            })}
          </div>
          
          <div className="h-24 sm:h-32 bg-black border-t border-stone-700 p-2 overflow-y-auto text-xs font-mono text-stone-400">
             {logs.map(log => (
                 <div key={log.id} className="mb-1">
                    <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span> {log.message}
                 </div>
             ))}
          </div>
      </div>
    </div>
  );
};

export default App;