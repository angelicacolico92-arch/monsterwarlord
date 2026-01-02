import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnitType, GameUnit, GameState, GameCommand, BattleLogEntry, PlayerRole, NetworkMessage, MapId } from './types';
import { 
  UNIT_CONFIGS, 
  SPAWN_X_PLAYER, 
  SPAWN_X_ENEMY, 
  STATUE_HP, 
  GOLD_MINE_PLAYER_X, 
  GOLD_MINE_ENEMY_X, 
  STATUE_PLAYER_POS, 
  STATUE_ENEMY_POS,
  MAX_UNITS
} from './constants';
import { UnitCard } from './components/UnitCard';
import { ArmyVisuals } from './components/ArmyVisuals';
import { LandingPage } from './components/LandingPage';
import { IntroSequence } from './components/IntroSequence';
import { MapSelection } from './components/MapSelection';
import { BattlefieldBackground } from './components/BattlefieldBackground';
import { AudioService } from './services/audioService';
import { mpService } from './services/multiplayerService';
import { Coins, Shield, Swords, RefreshCw, Users, X, Music, VolumeX, CornerDownLeft, Flag, AlertTriangle } from 'lucide-react';

// --- SUB-COMPONENTS ---

const GoldMine: React.FC<{ x: number; isFlipped?: boolean }> = ({ x, isFlipped }) => (
  <div 
    className="absolute bottom-28 w-24 h-24 z-0 pointer-events-none"
    style={{ left: `${x}%`, transform: 'translateX(-50%)' }}
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
    return (
        <div 
            className="absolute bottom-24 w-40 h-56 z-5 pointer-events-none"
            style={{ left: `${x}%`, transform: 'translateX(-50%)' }}
        >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/70 rounded border border-white/20 p-1 mb-2">
                <div 
                    className={`h-full rounded-sm transition-all duration-300 ${isRed ? 'bg-red-600' : 'bg-blue-500'}`} 
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            
            <div className={`w-full h-full ${isFlipped ? 'scale-x-[-1]' : ''}`}>
                <svg viewBox="0 0 100 140" className="drop-shadow-2xl overflow-visible">
                    <path d="M10 140 L 20 120 L 80 120 L 90 140 Z" fill="#57534e" stroke="black" strokeWidth="2" />
                    {isRed ? (
                        <g>
                            <path d="M30 120 L 35 20 L 65 20 L 70 120 Z" fill="#450a0a" stroke="black" strokeWidth="2" />
                            <path d="M20 40 L 80 40 L 50 100 Z" fill="#7f1d1d" opacity="0.5" />
                            <circle cx="50" cy="30" r="12" fill="#e5e5e5" stroke="black" />
                            <circle cx="46" cy="28" r="2" fill="black" />
                            <circle cx="54" cy="28" r="2" fill="black" />
                            <path d="M38 20 L 20 5 L 40 25" fill="#fefce8" stroke="black" />
                            <path d="M62 20 L 80 5 L 60 25" fill="#fefce8" stroke="black" />
                            <circle cx="50" cy="60" r="15" fill="red" filter="blur(10px)" opacity="0.5" className="animate-pulse" />
                        </g>
                    ) : (
                        <g>
                            <path d="M35 120 L 40 80 L 30 50 L 50 10 L 70 50 L 60 80 L 65 120 Z" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                            <path d="M50 10 L 50 120" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                            <path d="M30 50 L 70 50" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                            <path d="M50 35 L 60 50 L 50 65 L 40 50 Z" fill="#60a5fa" className="animate-pulse">
                                <animateTransform attributeName="transform" type="translate" values="0 0; 0 -5; 0 0" dur="3s" repeatCount="indefinite" />
                            </path>
                            <circle cx="50" cy="50" r="20" fill="#3b82f6" filter="blur(15px)" opacity="0.4" />
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
};

const TICK_RATE = 50; 
const DEATH_DURATION = 1500;
const INITIAL_GOLD = 50;

const UNIT_AGILITY: Record<string, number> = {
  [UnitType.WORKER]: 8.0,
  [UnitType.TOXIC]: 6.0,
  [UnitType.ARCHER]: 5.0,
  [UnitType.MAGE]: 3.0,
  [UnitType.PALADIN]: 1.5,
  [UnitType.BOSS]: 0.8
};

// Types for Action Queue
type GameAction = 
  | { type: 'RECRUIT'; unitType: UnitType; side: 'player' | 'enemy' }
  | { type: 'CHANGE_COMMAND'; side: 'player' | 'enemy'; command: GameCommand }
  | { type: 'SYNC_ENEMY_GOLD'; gold: number };

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'INTRO' | 'LANDING' | 'MAP_SELECT' | 'GAME'>('INTRO');
  const [role, setRole] = useState<PlayerRole>(PlayerRole.HOST);

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isArmyMenuOpen, setIsArmyMenuOpen] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);
  const [isSurrenderConfirming, setIsSurrenderConfirming] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragStatusRef = useRef({ hasMoved: false });

  // Game State
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

  const [logs, setLogs] = useState<BattleLogEntry[]>([]);
  
  // Refs
  const stateRef = useRef(gameState);
  const aiStateRef = useRef({ lastDecisionTime: 0 });
  // Action Queue to prevent race conditions between UI and Game Loop
  const actionQueueRef = useRef<GameAction[]>([]);
  
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  const isMirrored = role === PlayerRole.CLIENT;
  const getVisualX = useCallback((x: number) => {
      return isMirrored ? 100 - x : x;
  }, [isMirrored]);
  
  const addLog = useCallback((message: string, type: BattleLogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-4), { 
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: Date.now()
    }]);
  }, []);

  const resetGame = useCallback(() => {
    AudioService.playSelect();
    const newState: GameState = {
        units: [],
        playerStatueHP: STATUE_HP,
        enemyStatueHP: STATUE_HP,
        p1Gold: INITIAL_GOLD,
        p2Gold: INITIAL_GOLD,
        p1Command: GameCommand.DEFEND,
        p2Command: GameCommand.DEFEND,
        lastTick: Date.now(),
        gameStatus: 'PLAYING',
        mapId: stateRef.current.mapId // Keep current map
    };
    
    // Clear queue
    actionQueueRef.current = [];
    
    if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
        setGameState(newState);
        setLogs([]);
        setSelectedUnitId(null);
        addLog("Battle Reset!", "info");
        if (role === PlayerRole.HOST) {
            mpService.send({ type: 'GAME_STATE_UPDATE', payload: newState });
        }
        aiStateRef.current.lastDecisionTime = Date.now();
    } else {
        mpService.send({ type: 'GAME_RESET', payload: {} });
    }
    
    setIsSurrenderConfirming(false);
    
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
    }
  }, [role, addLog]);

  const handleReturnToMenu = useCallback(() => {
    // AudioService.playSelect(); // Optional, avoiding double sound on auto-nav
    const resetState: GameState = {
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
    };
    setGameState(resetState);
    setLogs([]);
    setSelectedUnitId(null);
    setIsSurrenderConfirming(false);
    mpService.destroy();
    setAppMode('LANDING');
  }, []);

  // --- NAVIGATION ---
  const handleStartHost = () => {
      setRole(PlayerRole.HOST);
      setAppMode('MAP_SELECT');
      if (!isMusicEnabled) toggleMusic();
  };

  const handleStartClient = () => {
      setRole(PlayerRole.CLIENT);
      setAppMode('GAME');
      addLog("Connected to Server. Waiting for Host...", "info");
      if (!isMusicEnabled) toggleMusic();
  };

  const handleStartOffline = () => {
      setRole(PlayerRole.OFFLINE);
      setAppMode('MAP_SELECT');
      if (!isMusicEnabled) toggleMusic();
  };

  const handleMapSelected = (mapId: MapId) => {
      // Initialize state with selected map
      const initialState: GameState = {
        units: [],
        playerStatueHP: STATUE_HP,
        enemyStatueHP: STATUE_HP,
        p1Gold: INITIAL_GOLD,
        p2Gold: INITIAL_GOLD,
        p1Command: GameCommand.DEFEND,
        p2Command: GameCommand.DEFEND,
        lastTick: Date.now(),
        gameStatus: 'PLAYING',
        mapId: mapId
      };
      
      setGameState(initialState);
      
      if (role === PlayerRole.HOST) {
          mpService.send({ type: 'GAME_STATE_UPDATE', payload: initialState });
          addLog("Multiplayer Session Started. You are the Host (Blue).", "info");
      } else {
          addLog("Single Player Mode Started. Good luck!", "info");
      }
      
      setAppMode('GAME');
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
  
  // Auto-navigate to menu on game end
  useEffect(() => {
    if (gameState.gameStatus !== 'PLAYING') {
       const timer = setTimeout(() => {
           handleReturnToMenu();
       }, 5000); // 5 seconds delay to show victory screen
       return () => clearTimeout(timer);
    }
  }, [gameState.gameStatus, handleReturnToMenu]);

  // --- NETWORK ---
  useEffect(() => {
    if (appMode !== 'GAME') return;

    mpService.onMessage((msg: NetworkMessage) => {
        if (role === PlayerRole.CLIENT) {
            if (msg.type === 'GAME_STATE_UPDATE') {
                setGameState(msg.payload);
            }
        } else if (role === PlayerRole.HOST) {
            if (msg.type === 'RECRUIT_REQUEST') {
                actionQueueRef.current.push({ 
                    type: 'RECRUIT', 
                    unitType: msg.payload.unitType, 
                    side: 'enemy' 
                });
            }
            if (msg.type === 'CLIENT_COMMAND_REQUEST') {
                actionQueueRef.current.push({
                    type: 'CHANGE_COMMAND',
                    side: 'enemy',
                    command: msg.payload.command
                });
            }
            if (msg.type === 'GAME_RESET') {
                resetGame();
            }
            if (msg.type === 'SURRENDER') {
                setGameState(prev => {
                     if (prev.gameStatus !== 'PLAYING') return prev;
                     const nextState: GameState = { ...prev, gameStatus: 'VICTORY' };
                     mpService.send({ type: 'GAME_STATE_UPDATE', payload: nextState });
                     return nextState;
                });
                AudioService.playFanfare(true);
                addLog("Opponent Surrendered!", "victory");
            }
        }
    });

    return () => {
        mpService.onMessage(() => {}); 
    };
  }, [appMode, role, resetGame, addLog]);


  // --- ACTIONS (UI) ---
  const handleRecruit = (type: UnitType) => {
    const config = UNIT_CONFIGS[type];
    const mySide = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? 'player' : 'enemy';
    const currentCount = gameState.units.filter(u => u.side === mySide && u.state !== 'DYING').length;

    if (currentCount >= MAX_UNITS) {
        return; 
    }
    
    if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
        if (gameState.p1Gold >= config.cost) {
            AudioService.playRecruit();
            actionQueueRef.current.push({ type: 'RECRUIT', unitType: type, side: 'player' });
        }
    } else {
        if (gameState.p2Gold >= config.cost) {
            AudioService.playRecruit();
            mpService.send({ type: 'RECRUIT_REQUEST', payload: { unitType: type } });
        }
    }
  };
  
  const handleCommandChange = (newCommand: GameCommand) => {
      AudioService.playSelect();
      if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
          actionQueueRef.current.push({ type: 'CHANGE_COMMAND', side: 'player', command: newCommand });
      } else {
          mpService.send({ type: 'CLIENT_COMMAND_REQUEST', payload: { command: newCommand } });
      }
  };

  const handleSelectUnit = (id: string) => {
    AudioService.playSelect();
    setSelectedUnitId(id);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (dragStatusRef.current.hasMoved) return;
    setSelectedUnitId(null);
  };

  const handleSurrender = () => {
    if (gameState.gameStatus !== 'PLAYING') return;

    if (!isSurrenderConfirming) {
        AudioService.playSelect();
        setIsSurrenderConfirming(true);
        // Reset confirmation after 3 seconds
        setTimeout(() => setIsSurrenderConfirming(false), 3000);
        return;
    }

    AudioService.playSelect();
    setIsSurrenderConfirming(false);
    
    if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
        setGameState(prev => {
            const next = { ...prev, gameStatus: 'DEFEAT' as const };
            if (role === PlayerRole.HOST) {
                mpService.send({ type: 'GAME_STATE_UPDATE', payload: next });
            }
            return next;
        });
        AudioService.playFanfare(false);
    } else {
        mpService.send({ type: 'SURRENDER', payload: {} });
        addLog("Surrendering...", "info");
    }
  };

  // --- SCROLL HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    dragStatusRef.current.hasMoved = false;
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    dragStatusRef.current.hasMoved = true;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    dragStatusRef.current.hasMoved = false;
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    dragStatusRef.current.hasMoved = true;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };
  const handleTouchEnd = () => setIsDragging(false);

  // --- GAME LOOP ---
  useEffect(() => {
    if ((role !== PlayerRole.HOST && role !== PlayerRole.OFFLINE) || appMode !== 'GAME') return;

    const intervalId = setInterval(() => {
      // Create a shallow copy of units for processing.
      let currentUnits = [...stateRef.current.units];
      
      let pStatueHP = stateRef.current.playerStatueHP;
      let eStatueHP = stateRef.current.enemyStatueHP;
      let p1Gold = stateRef.current.p1Gold;
      let p2Gold = stateRef.current.p2Gold;
      let p1Cmd = stateRef.current.p1Command;
      let p2Cmd = stateRef.current.p2Command;
      const gameStatus = stateRef.current.gameStatus;
      const currentMap = stateRef.current.mapId;

      if (gameStatus !== 'PLAYING') return;

      const now = Date.now();
      const deltaTime = (now - stateRef.current.lastTick) / 1000;

      // 1. PROCESS ACTION QUEUE
      while (actionQueueRef.current.length > 0) {
          const action = actionQueueRef.current.shift();
          if (!action) break;
          
          if (action.type === 'RECRUIT') {
              const config = UNIT_CONFIGS[action.unitType];
              const cost = config.cost;
              const isP1 = action.side === 'player';
              
              const currentSideUnits = currentUnits.filter(u => u.side === action.side && u.state !== 'DYING').length;
              
              if (currentSideUnits < MAX_UNITS) {
                  const canAfford = isP1 ? (p1Gold >= cost) : (p2Gold >= cost);
                  if (canAfford) {
                      if (isP1) p1Gold -= cost;
                      else p2Gold -= cost;
                      
                      const newUnit: GameUnit = {
                          id: Math.random().toString(36).substr(2, 9),
                          type: action.unitType,
                          side: action.side,
                          x: action.side === 'player' ? SPAWN_X_PLAYER : SPAWN_X_ENEMY,
                          hp: config.stats.hp,
                          maxHp: config.stats.hp,
                          state: 'IDLE',
                          lastAttackTime: 0,
                          targetId: null,
                          currentSpeed: 0,
                          hasGold: false
                      };
                      currentUnits.push(newUnit);
                  }
              }
          }
          else if (action.type === 'CHANGE_COMMAND') {
              if (action.side === 'player') p1Cmd = action.command;
              else p2Cmd = action.command;
          }
      }

      // 2. AI LOGIC (Offline only)
      if (role === PlayerRole.OFFLINE && now - aiStateRef.current.lastDecisionTime > 1000) {
          aiStateRef.current.lastDecisionTime = now;
          const enemyUnits = currentUnits.filter(u => u.side === 'enemy' && u.state !== 'DYING');
          const enemyMiners = enemyUnits.filter(u => u.type === UnitType.WORKER).length;
          
          if (enemyMiners < 4 && p2Gold >= UNIT_CONFIGS[UnitType.WORKER].cost) {
              const currentCount = enemyUnits.length;
              if (currentCount < MAX_UNITS) {
                  p2Gold -= UNIT_CONFIGS[UnitType.WORKER].cost;
                  const config = UNIT_CONFIGS[UnitType.WORKER];
                  currentUnits.push({
                      id: Math.random().toString(36).substr(2, 9),
                      type: UnitType.WORKER,
                      side: 'enemy',
                      x: SPAWN_X_ENEMY,
                      hp: config.stats.hp,
                      maxHp: config.stats.hp,
                      state: 'IDLE',
                      lastAttackTime: 0,
                      targetId: null,
                      currentSpeed: 0,
                      hasGold: false
                  });
              }
          }
          else if (p2Gold > 200) {
              const types = [UnitType.TOXIC, UnitType.ARCHER, UnitType.PALADIN, UnitType.MAGE];
              const affordableTypes = types.filter(t => UNIT_CONFIGS[t].cost <= p2Gold);
              if (affordableTypes.length > 0) {
                  const currentCount = enemyUnits.length;
                  if (currentCount < MAX_UNITS) {
                      const typeToBuy = affordableTypes[Math.floor(Math.random() * affordableTypes.length)];
                      p2Gold -= UNIT_CONFIGS[typeToBuy].cost;
                      const config = UNIT_CONFIGS[typeToBuy];
                      currentUnits.push({
                          id: Math.random().toString(36).substr(2, 9),
                          type: typeToBuy,
                          side: 'enemy',
                          x: SPAWN_X_ENEMY,
                          hp: config.stats.hp,
                          maxHp: config.stats.hp,
                          state: 'IDLE',
                          lastAttackTime: 0,
                          targetId: null,
                          currentSpeed: 0,
                          hasGold: false
                      });
                  }
              }
          }
          
          const combatUnits = enemyUnits.filter(u => u.type !== UnitType.WORKER).length;
          if (combatUnits > 6) p2Cmd = GameCommand.ATTACK;
          else if (eStatueHP < 1000) p2Cmd = GameCommand.DEFEND;
          else if (combatUnits < 2) p2Cmd = GameCommand.RETREAT;
          else p2Cmd = GameCommand.DEFEND;
      }

      // 3. PHYSICS & LOGIC LOOP
      currentUnits = currentUnits.map(u => {
        if (u.state === 'DYING') return u;
        
        const unit = { ...u };
        
        const config = UNIT_CONFIGS[unit.type];
        const isPlayer = unit.side === 'player';
        let targetVelocity = 0;

        // Apply Map Modifiers to Speed
        let speedMultiplier = 1.0;

        if (currentMap === MapId.FOREST) {
            // Poison Swamp in center (45-55) slows by 50%
            if (unit.x > 45 && unit.x < 55) {
                speedMultiplier *= 0.5;
            }
        } else if (currentMap === MapId.MINE) {
            // Tunnels: Ranged units faster
            if (unit.type === UnitType.ARCHER || unit.type === UnitType.MAGE) {
                speedMultiplier *= 1.2;
            }
        } else if (currentMap === MapId.SWAMP) {
            // Deep Mud: Frontline units slower globally
            if ([UnitType.TOXIC, UnitType.PALADIN, UnitType.BOSS, UnitType.WORKER].includes(unit.type)) {
                speedMultiplier *= 0.7;
            }
        }

        if (unit.type === UnitType.WORKER) {
             const mineLocation = isPlayer ? GOLD_MINE_PLAYER_X : GOLD_MINE_ENEMY_X;
             const statueLocation = isPlayer ? STATUE_PLAYER_POS : STATUE_ENEMY_POS;
             const MINING_DURATION = 10000;
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
                      p1Gold += 10;
                      if (Math.random() > 0.8) AudioService.playRecruit();
                   } else {
                      p2Gold += 10;
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
            const enemies = currentUnits.filter(other => other.side !== unit.side && other.hp > 0 && other.state !== 'DYING');
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
                         let damage = config.stats.damage;
                         if (target.type === UnitType.PALADIN) {
                            damage = Math.floor(damage * 0.7);
                         }
                         target.hp -= damage; 
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
                    
                    if (unit.type === UnitType.BOSS) {
                        setShakeTrigger(Date.now());
                    }
                }
            }
            else {
                let moveDir = 0;
                const dirToStatue = unit.x < statuePos ? 1 : -1;
                const dirToTarget = target ? (unit.x < target.x ? 1 : -1) : dirToStatue;

                const cmd = isPlayer ? p1Cmd : (role === PlayerRole.OFFLINE ? p2Cmd : p2Cmd);
                
                if (cmd === GameCommand.ATTACK) {
                     moveDir = dirToStatue; 
                } else if (cmd === GameCommand.DEFEND) { 
                    const DEFEND_LINE = isPlayer ? 30 : 70;
                    const THREAT_RANGE = 50; 
                    const isThreatened = isPlayer 
                        ? (target && target.x < THREAT_RANGE && Math.abs(target.x - unit.x) < config.stats.range + 10)
                        : (target && target.x > THREAT_RANGE && Math.abs(target.x - unit.x) < config.stats.range + 10);

                    if (isThreatened) {
                         moveDir = dirToTarget; 
                    } else {
                        if (unit.x > DEFEND_LINE + 1) moveDir = -1;
                        else if (unit.x < DEFEND_LINE - 1) moveDir = 1; 
                        else moveDir = 0; 
                    }
                } else if (cmd === GameCommand.RETREAT) {
                    const BASE_POS = isPlayer ? 10 : 90;
                    if (unit.x > BASE_POS + 1) moveDir = -1;
                    else if (unit.x < BASE_POS - 1) moveDir = 1;
                    else moveDir = 0;
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
        
        if (targetVelocity !== 0) {
            targetVelocity *= speedMultiplier;
        }

        if (typeof unit.currentSpeed === 'undefined') unit.currentSpeed = 0;
        const agility = UNIT_AGILITY[unit.type] || 5.0;
        const smoothingFactor = 1 - Math.exp(-agility * deltaTime);
        unit.currentSpeed += (targetVelocity - unit.currentSpeed) * smoothingFactor;
        
        if (Math.abs(targetVelocity - unit.currentSpeed) < 0.05) {
             if (targetVelocity === 0) unit.currentSpeed = 0;
        }

        if (Math.abs(unit.currentSpeed) > 0.01) {
             unit.x += unit.currentSpeed * deltaTime;
             unit.x = Math.max(0, Math.min(100, unit.x));
        }
        
        return unit;
      });

      // Cleanup Dead Units
      currentUnits = currentUnits.map(u => {
         if (u.hp <= 0 && u.state !== 'DYING') {
             return { ...u, state: 'DYING', deathTime: now, hp: 0 };
         }
         return u;
      });

      currentUnits = currentUnits.filter(u => {
          if (u.state === 'DYING') {
              const timeSinceDeath = now - (u.deathTime || 0);
              return timeSinceDeath < DEATH_DURATION;
          }
          return true;
      });

      let newStatus = gameStatus;
      if (pStatueHP <= 0) newStatus = 'DEFEAT';
      if (eStatueHP <= 0) newStatus = 'VICTORY';

      if (newStatus !== gameStatus) {
         if (newStatus === 'VICTORY') AudioService.playFanfare(true);
         if (newStatus === 'DEFEAT') AudioService.playFanfare(false);
      }

      const nextState: GameState = {
        units: currentUnits,
        playerStatueHP: pStatueHP,
        enemyStatueHP: eStatueHP,
        p1Gold,
        p2Gold,
        p1Command: p1Cmd,
        p2Command: p2Cmd,
        lastTick: now,
        gameStatus: newStatus,
        mapId: currentMap
      };

      setGameState(nextState);
      if (role === PlayerRole.HOST) {
        mpService.send({ type: 'GAME_STATE_UPDATE', payload: nextState });
      }

    }, TICK_RATE);

    return () => clearInterval(intervalId);
  }, [role, appMode]);

  if (appMode === 'INTRO') {
      return <IntroSequence onComplete={() => setAppMode('LANDING')} />;
  }

  if (appMode === 'LANDING') {
      return <LandingPage onStartHost={handleStartHost} onStartClient={handleStartClient} onStartOffline={handleStartOffline} />;
  }

  if (appMode === 'MAP_SELECT') {
      return <MapSelection onSelectMap={handleMapSelected} onBack={() => setAppMode('LANDING')} />;
  }

  const currentGold = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Gold : gameState.p2Gold;
  const currentCommand = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Command : gameState.p2Command;
  const roleLabel = role === PlayerRole.HOST ? 'HOST (BLUE)' : (role === PlayerRole.OFFLINE ? 'SINGLE PLAYER' : 'CLIENT (RED)');
  
  const isShaking = (Date.now() - shakeTrigger) < 400;

  const mySide = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? 'player' : 'enemy';
  const currentPop = gameState.units.filter(u => u.side === mySide && u.state !== 'DYING').length;

  return (
    <div className="h-[100dvh] w-screen bg-black overflow-hidden relative touch-none">
      
      {/* GAME AREA */}
      <div 
        ref={scrollContainerRef}
        className={`absolute inset-0 flex flex-col bg-inamorta select-none overflow-x-hidden ${isShaking ? 'animate-shake' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleBackgroundClick}
      >
          {/* Dynamic Background */}
          <BattlefieldBackground mapId={gameState.mapId} />

          <div className="absolute top-10 left-20 opacity-20 pointer-events-none">
              <div className="w-32 h-32 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <BaseStatue x={getVisualX(STATUE_PLAYER_POS)} hp={gameState.playerStatueHP} variant="BLUE" isFlipped={isMirrored} />
          <GoldMine x={getVisualX(GOLD_MINE_PLAYER_X)} isFlipped={isMirrored} />

          <BaseStatue x={getVisualX(STATUE_ENEMY_POS)} hp={gameState.enemyStatueHP} variant="RED" isFlipped={!isMirrored} />
          <GoldMine x={getVisualX(GOLD_MINE_ENEMY_X)} isFlipped={!isMirrored} />

          <ArmyVisuals 
            units={gameState.units} 
            selectedUnitId={selectedUnitId}
            onSelectUnit={handleSelectUnit}
            isMirrored={isMirrored}
          />
          
          <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-start z-30 pointer-events-none">
             <div className="bg-black/80 backdrop-blur p-2 rounded-lg border border-yellow-500/30 text-white shadow-xl pointer-events-auto flex items-center gap-2 sm:gap-6 max-w-full overflow-x-auto no-scrollbar">
                
                <div className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${role === PlayerRole.CLIENT ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {roleLabel}
                </div>

                <div className="flex items-center gap-2 min-w-[80px]">
                    <Coins className="text-yellow-400 w-4 h-4 sm:w-6 sm:h-6" />
                    <span className="text-lg sm:text-xl font-bold font-mono text-yellow-100">{Math.floor(currentGold)}</span>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-stone-400 font-bold">POP</span>
                    <span className={`text-lg sm:text-xl font-bold font-mono ${currentPop >= MAX_UNITS ? 'text-red-500' : 'text-stone-200'}`}>
                        {currentPop}/{MAX_UNITS}
                    </span>
                </div>
                
                <div className="h-8 w-px bg-white/20 ml-2"></div>
                
                <div className="flex gap-1 sm:gap-2">
                    <button 
                        onClick={() => handleCommandChange(GameCommand.ATTACK)}
                        className={`p-1.5 sm:p-2 rounded flex items-center gap-1 sm:gap-2 font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 ${currentCommand === GameCommand.ATTACK ? 'bg-red-600 border-red-800' : 'bg-gray-700 border-gray-900 text-gray-400'}`}
                    >
                        <Swords size={16} /> <span className="hidden md:inline">ATTACK</span>
                    </button>
                    <button 
                        onClick={() => handleCommandChange(GameCommand.DEFEND)}
                        className={`p-1.5 sm:p-2 rounded flex items-center gap-1 sm:gap-2 font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 ${currentCommand === GameCommand.DEFEND ? 'bg-blue-600 border-blue-800' : 'bg-gray-700 border-gray-900 text-gray-400'}`}
                    >
                        <Shield size={16} /> <span className="hidden md:inline">DEFEND</span>
                    </button>
                    <button 
                        onClick={() => handleCommandChange(GameCommand.RETREAT)}
                        className={`p-1.5 sm:p-2 rounded flex items-center gap-1 sm:gap-2 font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 ${currentCommand === GameCommand.RETREAT ? 'bg-orange-600 border-orange-800' : 'bg-gray-700 border-gray-900 text-gray-400'}`}
                    >
                        <CornerDownLeft size={16} /> <span className="hidden md:inline">RETREAT</span>
                    </button>
                </div>
                
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

                <button
                    onClick={handleSurrender}
                    className={`p-1.5 sm:p-2 rounded transition-all ${isSurrenderConfirming ? 'bg-red-600 text-white animate-pulse' : 'text-stone-500 hover:text-red-500'}`}
                    title={isSurrenderConfirming ? "Confirm Surrender?" : "Surrender"}
                >
                    {isSurrenderConfirming ? <AlertTriangle size={16} /> : <Flag size={16} />}
                </button>
             </div>
          </div>

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
                    const mySide = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? 'player' : 'enemy';
                    const count = gameState.units.filter(u => u.side === mySide && u.type === unit.type).length;
                    const totalCount = gameState.units.filter(u => u.side === mySide && u.state !== 'DYING').length;

                    return (
                        <UnitCard 
                            key={unit.type}
                            unit={unit}
                            count={count}
                            canAfford={currentGold >= unit.cost && totalCount < MAX_UNITS}
                            onRecruit={handleRecruit}
                            variant={role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? 'BLUE' : 'RED'}
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
      
      {/* Game Over Overlay - moved outside scroll container for proper z-index and positioning */}
      {gameState.gameStatus !== 'PLAYING' && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-intro-fade">
             <div className="bg-stone-900 p-8 rounded-xl border-4 border-stone-600 text-center shadow-2xl max-w-md w-full relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
                 
                 <div className="relative z-10">
                     <h1 className={`text-5xl sm:text-7xl font-epic mb-2 drop-shadow-lg ${gameState.gameStatus === 'VICTORY' ? 'text-yellow-400' : 'text-red-600'}`}>
                         {role === PlayerRole.HOST || role === PlayerRole.OFFLINE
                            ? (gameState.gameStatus === 'VICTORY' ? 'VICTORY!' : 'DEFEAT')
                            : (gameState.gameStatus === 'VICTORY' ? 'DEFEAT' : 'VICTORY!')
                         }
                     </h1>
                     
                     <p className="text-stone-400 font-mono mb-8 text-sm">
                        {gameState.gameStatus === 'VICTORY' 
                            ? (role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? "The Slime Legion has conquered!" : "The Rebellion is crushed.")
                            : (role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? "Your statue has crumbled..." : "Your rebellion has succeeded!")
                        }
                     </p>
                     
                     <div className="mt-8 animate-pulse text-stone-500 font-mono text-sm">
                        Returning to base...
                     </div>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};