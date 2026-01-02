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
  MAX_UNITS,
  FORMATION_OFFSETS
} from './constants';
import { StickmanRender } from './components/StickmanRender'; // Directly use renderer for buttons
import { ArmyVisuals } from './components/ArmyVisuals';
import { LandingPage } from './components/LandingPage';
import { IntroSequence } from './components/IntroSequence';
import { MapSelection } from './components/MapSelection';
import { BattlefieldBackground } from './components/BattlefieldBackground';
import { AudioService } from './services/audioService';
import { mpService } from './services/multiplayerService';
import { Coins, Shield, Swords, Music, VolumeX, CornerDownLeft, Flag, AlertTriangle, Users } from 'lucide-react';

// --- SUB-COMPONENTS ---

const GoldMine: React.FC<{ x: number; isFlipped?: boolean }> = ({ x, isFlipped }) => (
  <div 
    className="absolute bottom-20 w-32 h-32 z-0 pointer-events-none"
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

    // Slime Tower Colors
    const primaryColor = isRed ? '#ef4444' : '#3b82f6'; // Red-500 : Blue-500
    const darkColor = isRed ? '#7f1d1d' : '#1e3a8a';    // Red-900 : Blue-900
    const lightColor = isRed ? '#fca5a5' : '#93c5fd';   // Red-300 : Blue-300
    const glowColor = isRed ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)';

    return (
        <div 
            className="absolute bottom-16 z-10 pointer-events-none origin-bottom transition-all duration-300"
            style={{ 
                left: `${x}%`, 
                transform: 'translateX(-50%)',
                // Responsive Scaling:
                // Height is based on viewport height (vh) to fit mobile screens, capped at max pixel values.
                // Aspect ratio ensures width adjusts automatically.
                height: 'min(340px, 55vh)', 
                width: 'auto', 
                aspectRatio: '200 / 350'
            }}
        >
            {/* HP Bar - Scaled relative to tower width, ensuring readability */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[140%] h-3 sm:h-4 bg-black/70 rounded-full border border-white/30 backdrop-blur-md overflow-hidden z-20 shadow-lg">
                <div 
                    className={`h-full transition-all duration-300 ${isRed ? 'bg-gradient-to-r from-red-600 to-rose-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} 
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
                        <radialGradient id={`slime-core-${variant}`} cx="0.5" cy="0.4" r="0.5">
                            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                            <stop offset="40%" stopColor={lightColor} stopOpacity="0.6" />
                            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Base Puddle */}
                    <path d="M20 340 Q 0 340 10 320 Q 50 300 100 310 Q 150 300 190 320 Q 200 340 180 340 Q 140 355 100 350 Q 60 355 20 340" 
                          fill={darkColor} opacity="0.8" />

                    {/* Main Tower Spire */}
                    <path 
                        d="M50 320 
                           C 20 250, 40 150, 70 80 
                           Q 100 50, 130 80 
                           C 160 150, 180 250, 150 320 
                           Q 100 340, 50 320 Z" 
                        fill={`url(#slime-body-${variant})`} 
                        stroke={lightColor} 
                        strokeWidth="2" 
                        strokeOpacity="0.5"
                    />

                    {/* Animated Bubbles inside */}
                    <g opacity="0.7">
                        <circle cx="100" cy="300" r="6" fill="white" opacity="0.5">
                            <animate attributeName="cy" values="300;80" dur="4s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.5;0" dur="4s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="80" cy="250" r="4" fill="white" opacity="0.4">
                            <animate attributeName="cy" values="250;70" dur="3s" repeatCount="indefinite" delay="1s" />
                            <animate attributeName="opacity" values="0.4;0" dur="3s" repeatCount="indefinite" delay="1s" />
                        </circle>
                        <circle cx="120" cy="200" r="5" fill="white" opacity="0.4">
                            <animate attributeName="cy" values="200;60" dur="5s" repeatCount="indefinite" delay="0.5s" />
                            <animate attributeName="opacity" values="0.4;0" dur="5s" repeatCount="indefinite" delay="0.5s" />
                        </circle>
                    </g>

                    {/* Glowing Core / Heart */}
                    <circle cx="100" cy="70" r="25" fill={`url(#slime-core-${variant})`} className="animate-pulse" />
                    
                    {/* Floating Ring/Crown */}
                    <ellipse cx="100" cy="70" rx="40" ry="12" fill="none" stroke={lightColor} strokeWidth="3" opacity="0.8">
                         <animateTransform attributeName="transform" type="rotate" from="0 100 70" to="360 100 70" dur="8s" repeatCount="indefinite" />
                    </ellipse>
                </svg>

                {/* Outer Glow Div */}
                <div 
                    className="absolute top-[10%] left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl -z-10 opacity-50"
                    style={{ backgroundColor: isRed ? '#f87171' : '#60a5fa' }} 
                ></div>
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
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);
  const [isSurrenderConfirming, setIsSurrenderConfirming] = useState(false);
  const [goldPopups, setGoldPopups] = useState<{id: number, amount: number}[]>([]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragStatusRef = useRef({ hasMoved: false });
  const prevGoldRef = useRef(INITIAL_GOLD);

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

  // Derived Values needed for Hooks
  const isMirrored = role === PlayerRole.CLIENT;
  const currentGold = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Gold : gameState.p2Gold;

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
    prevGoldRef.current = INITIAL_GOLD;
    
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

  // Track gold changes for visual effect (Moved up before conditional returns)
  useEffect(() => {
    const diff = Math.floor(currentGold) - Math.floor(prevGoldRef.current);
    if (diff > 0) {
        const id = Date.now() + Math.random();
        setGoldPopups(prev => [...prev, { id, amount: diff }]);
        setTimeout(() => {
            setGoldPopups(prev => prev.filter(p => p.id !== id));
        }, 1000);
    }
    prevGoldRef.current = currentGold;
  }, [currentGold]);


  // --- ACTIONS (UI) ---
  const handleRecruit = (type: UnitType) => {
    const config = UNIT_CONFIGS[type];
    const mySide = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? 'player' : 'enemy';
    const currentCount = gameState.units.filter(u => u.side === mySide && u.state !== 'DYING').length;

    if (currentCount >= MAX_UNITS) {
        return; 
    }
    
    // Check affordability instantly for UI/Audio feedback, 
    // though actual deduction happens in game loop for synchronization.
    const myGold = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Gold : gameState.p2Gold;
    
    if (myGold >= config.cost) {
        AudioService.playRecruit();
        if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
             actionQueueRef.current.push({ type: 'RECRUIT', unitType: type, side: 'player' });
        } else {
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
      // 1. Snapshot current state
      const startTickUnits = stateRef.current.units;
      
      // 2. Create working copy for next state
      let nextUnits = startTickUnits.map(u => ({ ...u }));
      
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

      // PROCESS ACTION QUEUE
      while (actionQueueRef.current.length > 0) {
          const action = actionQueueRef.current.shift();
          if (!action) break;
          
          if (action.type === 'RECRUIT') {
              const config = UNIT_CONFIGS[action.unitType];
              const cost = config.cost;
              const isP1 = action.side === 'player';
              
              const currentSideUnits = nextUnits.filter(u => u.side === action.side && u.state !== 'DYING').length;
              
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
                          state: 'WALKING', // Start walking immediately for instant feedback
                          lastAttackTime: 0,
                          targetId: null,
                          currentSpeed: 0,
                          hasGold: false
                      };
                      nextUnits.push(newUnit);
                  }
              }
          }
          else if (action.type === 'CHANGE_COMMAND') {
              if (action.side === 'player') p1Cmd = action.command;
              else p2Cmd = action.command;
          }
      }

      // AI LOGIC (Offline)
      if (role === PlayerRole.OFFLINE && now - aiStateRef.current.lastDecisionTime > 1000) {
          aiStateRef.current.lastDecisionTime = now;
          const enemyUnits = nextUnits.filter(u => u.side === 'enemy' && u.state !== 'DYING');
          const enemyMiners = enemyUnits.filter(u => u.type === UnitType.WORKER).length;
          
          if (enemyMiners < 4 && p2Gold >= UNIT_CONFIGS[UnitType.WORKER].cost) {
              // Priority: Eco
              if (enemyUnits.length < MAX_UNITS) {
                  p2Gold -= UNIT_CONFIGS[UnitType.WORKER].cost;
                  const config = UNIT_CONFIGS[UnitType.WORKER];
                  nextUnits.push({
                      id: Math.random().toString(36).substr(2, 9),
                      type: UnitType.WORKER,
                      side: 'enemy',
                      x: SPAWN_X_ENEMY,
                      hp: config.stats.hp,
                      maxHp: config.stats.hp,
                      state: 'WALKING',
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
                  if (enemyUnits.length < MAX_UNITS) {
                      const typeToBuy = affordableTypes[Math.floor(Math.random() * affordableTypes.length)];
                      p2Gold -= UNIT_CONFIGS[typeToBuy].cost;
                      const config = UNIT_CONFIGS[typeToBuy];
                      nextUnits.push({
                          id: Math.random().toString(36).substr(2, 9),
                          type: typeToBuy,
                          side: 'enemy',
                          x: SPAWN_X_ENEMY,
                          hp: config.stats.hp,
                          maxHp: config.stats.hp,
                          state: 'WALKING',
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

      // --- FORMATION & PHYSICS LOOP ---
      
      const getFormationAnchor = (side: 'player' | 'enemy') => {
          const units = nextUnits.filter(u => u.side === side && u.type !== UnitType.WORKER && u.state !== 'DYING');
          if (units.length === 0) return side === 'player' ? SPAWN_X_PLAYER : SPAWN_X_ENEMY;
          if (side === 'player') {
              return Math.max(...units.map(u => u.x));
          } else {
              return Math.min(...units.map(u => u.x));
          }
      };

      const p1Anchor = getFormationAnchor('player');
      const p2Anchor = getFormationAnchor('enemy');

      nextUnits.forEach(unit => {
        if (unit.state === 'DYING') return;
        
        const config = UNIT_CONFIGS[unit.type];
        const isPlayer = unit.side === 'player';
        let targetVelocity = 0;
        let speedMultiplier = 1.0;

        if (currentMap === MapId.FOREST && unit.x > 45 && unit.x < 55) speedMultiplier *= 0.5;
        if (currentMap === MapId.MINE && (unit.type === UnitType.ARCHER || unit.type === UnitType.MAGE)) speedMultiplier *= 1.2;
        if (currentMap === MapId.SWAMP && [UnitType.TOXIC, UnitType.PALADIN, UnitType.BOSS, UnitType.WORKER].includes(unit.type)) speedMultiplier *= 0.7;

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
                      p1Gold += 20;
                      if (Math.random() > 0.8) AudioService.playRecruit();
                   } else {
                      p2Gold += 20;
                   }
                   unit.hasGold = false;
                   unit.state = 'WALKING';
                }
             }
             else {
                if (unit.hasGold) {
                    if (Math.abs(unit.x - statueLocation) <= miningRange) {
                       unit.state = 'DEPOSITING';
                       unit.lastAttackTime = now;
                       targetVelocity = 0;
                    } else {
                       targetVelocity = (unit.x < statueLocation ? 1 : -1) * config.stats.speed;
                    }
                } else {
                    if (Math.abs(unit.x - mineLocation) <= miningRange) {
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
            
            let target: GameUnit | undefined;
            let distToTarget = 10000;
            
            nextUnits.forEach(other => {
                if (other.side !== unit.side && other.hp > 0 && other.state !== 'DYING') {
                     const dist = Math.abs(other.x - unit.x);
                     if (dist < distToTarget) {
                         distToTarget = dist;
                         target = other;
                     }
                }
            });
            
            const distToStatue = Math.abs(unit.x - statuePos);
            let hittingStatue = (!target || distToTarget > distToStatue) && distToStatue <= config.stats.range + 1;
            let hittingUnit = target && distToTarget <= config.stats.range;
            
            if (hittingStatue || hittingUnit) {
                unit.state = 'ATTACKING';
                targetVelocity = 0;
                
                if (now - unit.lastAttackTime > config.stats.attackSpeed) {
                    AudioService.playAttack(unit.type);
                    
                    if (hittingUnit && target) {
                         let damage = config.stats.damage;
                         if (target.type === UnitType.PALADIN) damage = Math.floor(damage * 0.7);
                         
                         const targetCmd = target.side === 'player' ? p1Cmd : p2Cmd;
                         if (targetCmd === GameCommand.DEFEND) {
                             damage = Math.floor(damage * 0.7); 
                         }

                         target.hp -= damage; 
                         target.lastDamageTime = now;
                         target.lastDamageAmount = damage;
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
                    if (unit.type === UnitType.BOSS) setShakeTrigger(Date.now());
                }
            }
            else {
                const cmd = isPlayer ? p1Cmd : (role === PlayerRole.OFFLINE ? p2Cmd : p2Cmd);
                const formationAnchor = isPlayer ? p1Anchor : p2Anchor;
                
                let strategicX = unit.x;
                
                if (cmd === GameCommand.ATTACK) {
                    strategicX = isPlayer ? STATUE_ENEMY_POS : STATUE_PLAYER_POS;
                } else if (cmd === GameCommand.DEFEND) {
                    strategicX = isPlayer ? 30 : 70;
                } else if (cmd === GameCommand.RETREAT) {
                    strategicX = isPlayer ? 10 : 90;
                }

                const myOffset = FORMATION_OFFSETS[unit.type];
                let formationTargetX = strategicX;
                
                if (cmd === GameCommand.ATTACK) {
                    const idealFormationX = isPlayer 
                        ? formationAnchor - myOffset 
                        : formationAnchor + myOffset;
                        
                    const isAhead = isPlayer ? unit.x >= idealFormationX - 0.5 : unit.x <= idealFormationX + 0.5;
                    
                    if (isAhead) {
                         formationTargetX = strategicX;
                    } else {
                         formationTargetX = idealFormationX;
                    }
                } 
                else {
                    formationTargetX = isPlayer 
                        ? strategicX - myOffset 
                        : strategicX + myOffset;
                }

                const dir = formationTargetX > unit.x ? 1 : -1;
                const dist = Math.abs(formationTargetX - unit.x);
                
                if (dist < 0.5) {
                    unit.state = 'IDLE';
                    targetVelocity = 0;
                } else {
                    unit.state = 'WALKING';
                    targetVelocity = dir * config.stats.speed;
                }
            }
        }
        
        if (targetVelocity !== 0) targetVelocity *= speedMultiplier;

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
      });

      nextUnits = nextUnits.map(u => {
         if (u.hp <= 0 && u.state !== 'DYING') {
             return { ...u, state: 'DYING', deathTime: now, hp: 0 };
         }
         return u;
      });

      nextUnits = nextUnits.filter(u => {
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
        units: nextUnits,
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

  const currentCommand = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Command : gameState.p2Command;
  const roleLabel = role === PlayerRole.HOST ? 'HOST' : (role === PlayerRole.OFFLINE ? 'SINGLE PLAYER' : 'CLIENT');
  
  const isShaking = (Date.now() - shakeTrigger) < 400;

  const mySide = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? 'player' : 'enemy';
  const currentPop = gameState.units.filter(u => u.side === mySide && u.state !== 'DYING').length;
  const allConfigs = Object.values(UNIT_CONFIGS);

  return (
    <div className="h-[100dvh] w-screen bg-black overflow-hidden relative">
      
      {/* GAME AREA - SCROLLABLE WORLD CONTAINER */}
      <div 
        ref={scrollContainerRef}
        className={`absolute inset-0 flex flex-col bg-inamorta select-none overflow-x-auto overflow-y-hidden touch-pan-x ${isShaking ? 'animate-shake' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleBackgroundClick}
      >
          {/* Extended World Width for Scrolling */}
          <div className="relative h-full min-w-[250vw] sm:min-w-[200vw]">
            <BattlefieldBackground mapId={gameState.mapId} />
            <div className="absolute top-10 left-20 opacity-20 pointer-events-none">
                <div className="w-32 h-32 bg-white rounded-full blur-3xl"></div>
            </div>
            <BaseStatue x={getVisualX(STATUE_PLAYER_POS)} hp={gameState.playerStatueHP} variant="BLUE" isFlipped={isMirrored} />
            <GoldMine x={getVisualX(GOLD_MINE_PLAYER_X)} isFlipped={isMirrored} />
            <GoldMine x={getVisualX(GOLD_MINE_ENEMY_X)} isFlipped={!isMirrored} />
            <BaseStatue x={getVisualX(STATUE_ENEMY_POS)} hp={gameState.enemyStatueHP} variant="RED" isFlipped={!isMirrored} />
            <ArmyVisuals 
                units={gameState.units} 
                selectedUnitId={selectedUnitId}
                onSelectUnit={handleSelectUnit}
                isMirrored={isMirrored}
            />
          </div>
      </div>
      
      {/* --- TOP HUD (System, Army Bar, Resources) --- */}
      <div 
        className="fixed top-0 left-0 right-0 z-30 pointer-events-none flex flex-col w-full"
        style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
            paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(0.5rem, env(safe-area-inset-right))'
        }}
      >
         {/* Header Row: Flex for side elements to avoid overlap, but Army bar is centered absolutely to be true center */}
         <div className="flex justify-between items-start w-full pointer-events-none relative z-50">
             
             {/* Left: System Controls */}
             <div className="flex gap-2 pointer-events-auto ml-2">
                 <div className={`px-2 py-1 rounded text-[10px] font-bold h-8 flex items-center shadow-md ${role === PlayerRole.CLIENT ? 'bg-red-600' : 'bg-blue-600'} text-white`}>
                    {roleLabel}
                 </div>
                 
                 <button
                    onClick={() => { AudioService.playSelect(); toggleMusic(); }}
                    className={`w-8 h-8 flex items-center justify-center rounded bg-black/60 backdrop-blur border border-white/20 transition-colors ${isMusicEnabled ? 'text-yellow-400' : 'text-stone-400'}`}
                 >
                    {isMusicEnabled ? <Music size={14} /> : <VolumeX size={14} />}
                 </button>
             </div>

             {/* Right: Resources & Surrender */}
             <div className="flex flex-col items-end gap-1 pointer-events-auto mr-2">
                 <div className="flex gap-3 bg-black/70 px-3 py-1.5 rounded-full border border-stone-600 backdrop-blur-md shadow-xl">
                     <div className="flex items-center gap-2 relative">
                         <Coins className="text-yellow-400 w-4 h-4" />
                         <span className="text-lg font-bold font-mono text-yellow-100">{Math.floor(currentGold)}</span>
                         
                         {/* Gold Popups */}
                         {goldPopups.map(popup => (
                             <div 
                                key={popup.id}
                                className="absolute top-0 left-full ml-2 text-yellow-300 font-bold text-sm animate-gold-float pointer-events-none whitespace-nowrap"
                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                             >
                                +{popup.amount}
                             </div>
                         ))}
                     </div>
                     <div className="w-px bg-white/20 h-5 self-center"></div>
                     <div className="flex items-center gap-2">
                         <Users className="text-stone-400 w-4 h-4" />
                         <span className={`text-lg font-bold font-mono ${currentPop >= MAX_UNITS ? 'text-red-500' : 'text-stone-200'}`}>
                            {currentPop}/{MAX_UNITS}
                         </span>
                     </div>
                 </div>

                 {/* Surrender Button - Moved here */}
                 <button
                    onClick={handleSurrender}
                    className={`h-6 px-2 flex items-center justify-center rounded bg-black/40 backdrop-blur border border-white/10 hover:bg-black/60 transition-all ${isSurrenderConfirming ? 'bg-red-600/80 text-white animate-pulse border-red-500' : 'text-stone-500 hover:text-red-400'}`}
                    title="Surrender"
                 >
                    {isSurrenderConfirming ? (
                         <span className="text-[10px] font-bold uppercase tracking-wider mr-1">Confirm</span>
                    ) : null}
                    {isSurrenderConfirming ? <AlertTriangle size={12} /> : <Flag size={12} />}
                 </button>
             </div>
         </div>

         {/* Army Bar Layer - Positioned Absolutely to be true center, but limited width to prevent overlap */}
         <div className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-40">
               <div className="pointer-events-auto mt-0 max-w-[45vw] sm:max-w-md lg:max-w-xl">
                   <div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 px-3 bg-black/90 backdrop-blur-md rounded-b-2xl border border-t-0 border-stone-600 shadow-2xl">
                       {allConfigs.map((unit) => {
                           const canAfford = currentGold >= unit.cost && currentPop < MAX_UNITS;
                           const isRed = role === PlayerRole.CLIENT; 
                           
                           return (
                               <button
                                   key={unit.type}
                                   disabled={!canAfford}
                                   onClick={() => handleRecruit(unit.type)}
                                   className={`
                                      group relative w-10 h-10 sm:w-14 sm:h-14 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all active:scale-95 touch-manipulation
                                      ${canAfford 
                                         ? 'bg-stone-800 border-stone-600 hover:border-yellow-500 hover:bg-stone-700' 
                                         : 'bg-stone-900 border-stone-800 opacity-40 cursor-not-allowed grayscale'}
                                   `}
                               >
                                   {/* Unit Icon - Scaled Down */}
                                   <div className="scale-[0.5] sm:scale-[0.7]">
                                       <StickmanRender type={unit.type} isPlayer={!isRed} />
                                   </div>

                                   {/* Cost Label */}
                                   <div className={`
                                       absolute -bottom-1.5 right-1/2 translate-x-1/2 px-1 rounded-full text-[8px] sm:text-[10px] font-bold border shadow-sm leading-none
                                       ${canAfford ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-stone-700 text-stone-400 border-stone-600'}
                                   `}>
                                       {unit.cost}
                                   </div>
                               </button>
                           );
                       })}
                   </div>
               </div>
         </div>
      </div>

      {/* --- BOTTOM HUD (Commands Only) --- */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex flex-col justify-end items-center"
        style={{
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(0.5rem, env(safe-area-inset-right))'
        }}
      >
          {/* Bottom Right: Commands */}
          <div className="absolute bottom-4 right-4 pointer-events-auto flex flex-col gap-2 scale-90 sm:scale-100 origin-bottom-right">
             <button 
                onClick={() => handleCommandChange(GameCommand.ATTACK)}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg transition-all active:scale-95 ${currentCommand === GameCommand.ATTACK ? 'bg-red-600 border-red-300 ring-4 ring-red-900/50' : 'bg-stone-800 border-stone-600 text-stone-400'}`}
             >
                 <Swords size={20} fill="currentColor" />
             </button>
             <button 
                onClick={() => handleCommandChange(GameCommand.DEFEND)}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg transition-all active:scale-95 ${currentCommand === GameCommand.DEFEND ? 'bg-blue-600 border-blue-300 ring-4 ring-blue-900/50' : 'bg-stone-800 border-stone-600 text-stone-400'}`}
             >
                 <Shield size={20} fill="currentColor" />
             </button>
             <button 
                onClick={() => handleCommandChange(GameCommand.RETREAT)}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg transition-all active:scale-95 ${currentCommand === GameCommand.RETREAT ? 'bg-orange-600 border-orange-300 ring-4 ring-orange-900/50' : 'bg-stone-800 border-stone-600 text-stone-400'}`}
             >
                 <CornerDownLeft size={20} />
             </button>
          </div>
      </div>
      
      {/* Game Over Overlay */}
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