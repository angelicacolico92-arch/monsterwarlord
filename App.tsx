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
import { IntroSequence } from './components/IntroSequence';
import { AudioService } from './services/audioService';
import { mpService } from './services/multiplayerService';
import { Coins, Shield, Swords, RefreshCw, Users, X, MoveHorizontal, Music, VolumeX, CornerDownLeft, Flag } from 'lucide-react';

// --- SUB-COMPONENTS ---

const GoldMine: React.FC<{ x: number; isFlipped?: boolean }> = ({ x, isFlipped }) => (
  <div 
    className="absolute bottom-28 w-24 h-24 z-0 pointer-events-none"
    style={{ left: `${x}%`, transform: 'translateX(-50%)' }}
  >
     <div className={`w-full h-full ${isFlipped ? 'scale-x-[-1]' : ''}`}>
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

const BaseStatue: React.FC<{ x: number; hp: number; variant: 'BLUE' | 'RED'; isFlipped?: boolean }> = ({ x, hp, variant, isFlipped }) => {
    const hpPercent = Math.max(0, (hp / STATUE_HP) * 100);
    const isRed = variant === 'RED';
    return (
        <div 
            className="absolute bottom-24 w-40 h-56 z-5 pointer-events-none"
            style={{ left: `${x}%`, transform: 'translateX(-50%)' }}
        >
            {/* HP Bar */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/70 rounded border border-white/20 p-1 mb-2">
                <div 
                    className={`h-full rounded-sm transition-all duration-300 ${isRed ? 'bg-red-600' : 'bg-blue-500'}`} 
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            
            <div className={`w-full h-full ${isFlipped ? 'scale-x-[-1]' : ''}`}>
                <svg viewBox="0 0 100 140" className="drop-shadow-2xl overflow-visible">
                    {/* Base */}
                    <path d="M10 140 L 20 120 L 80 120 L 90 140 Z" fill="#57534e" stroke="black" strokeWidth="2" />
                    
                    {isRed ? (
                        <g>
                            {/* Enemy Totem (Red) */}
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
                            {/* Player Crystal (Blue) */}
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
const DEATH_DURATION = 1500; // ms to keep dying units visible
const INITIAL_GOLD = 400;

// Agility settings for physics smoothing (Higher = Faster acceleration/deceleration)
// Values act as a decay constant for exponential smoothing
const UNIT_AGILITY: Record<string, number> = {
  [UnitType.WORKER]: 8.0,
  [UnitType.TOXIC]: 6.0,
  [UnitType.ARCHER]: 5.0,
  [UnitType.MAGE]: 3.0,
  [UnitType.PALADIN]: 1.5, // Heavy tank, slow to start/stop
  [UnitType.BOSS]: 0.8     // Massive, very heavy physics
};

export const App: React.FC = () => {
  // --- APP NAVIGATION STATE ---
  const [appMode, setAppMode] = useState<'INTRO' | 'LANDING' | 'GAME'>('INTRO');
  const [role, setRole] = useState<PlayerRole>(PlayerRole.HOST);

  // --- GAME STATE ---
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isArmyMenuOpen, setIsArmyMenuOpen] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false); // Music state
  
  // Drag Scrolling State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Track if a drag occurred to prevent click events on release
  const dragStatusRef = useRef({ hasMoved: false });

  const [gameState, setGameState] = useState<GameState>({
    units: [],
    playerStatueHP: STATUE_HP,
    enemyStatueHP: STATUE_HP,
    p1Gold: INITIAL_GOLD,
    p2Gold: INITIAL_GOLD,
    p1Command: GameCommand.DEFEND,
    p2Command: GameCommand.DEFEND,
    lastTick: Date.now(),
    gameStatus: 'PLAYING'
  });

  const [logs, setLogs] = useState<BattleLogEntry[]>([]);
  
  // Refs for loop to avoid stale closures
  const stateRef = useRef(gameState);
  const aiStateRef = useRef({ lastDecisionTime: 0 }); // Track AI timing
  
  // Sync refs
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // --- VIEW TRANSFORMATION ---
  const isMirrored = role === PlayerRole.CLIENT;
  const getVisualX = useCallback((x: number) => {
      return isMirrored ? 100 - x : x;
  }, [isMirrored]);

  // --- NAVIGATION HANDLERS ---
  const handleStartHost = () => {
      setRole(PlayerRole.HOST);
      setAppMode('GAME');
      addLog("Multiplayer Session Started. You are the Host (Blue).", "info");
      
      if (!isMusicEnabled) toggleMusic();
  };

  const handleStartClient = () => {
      setRole(PlayerRole.CLIENT);
      setAppMode('GAME');
      addLog("Connected to Server. You are the Challenger (Red).", "info");

      if (!isMusicEnabled) toggleMusic();
  };

  const handleStartOffline = () => {
      setRole(PlayerRole.OFFLINE);
      setAppMode('GAME');
      addLog("Single Player Mode Started. Good luck!", "info");

      if (!isMusicEnabled) toggleMusic();
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
        } else if (role === PlayerRole.HOST) {
            // HOST LOGIC: Receive Requests (Only actual host needs to listen)
            if (msg.type === 'RECRUIT_REQUEST') {
                handleHostRecruitEnemy(msg.payload.unitType);
            }
            if (msg.type === 'CLIENT_COMMAND_REQUEST') {
                setGameState(prev => ({ ...prev, p2Command: msg.payload.command }));
            }
            if (msg.type === 'GAME_RESET') {
                resetGame();
            }
            if (msg.type === 'SURRENDER') {
                setGameState(prev => {
                     if (prev.gameStatus !== 'PLAYING') return prev;
                     return { ...prev, gameStatus: 'VICTORY' };
                });
                AudioService.playFanfare(true);
                addLog("Opponent Surrendered!", "victory");
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
    // Only Host or Offline game loop spawns units
    if (role !== PlayerRole.HOST && role !== PlayerRole.OFFLINE) return;

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
    
    if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
        // Host/Offline Player (Player 1 - Blue)
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
  
  const handleCommandChange = (newCommand: GameCommand) => {
      AudioService.playSelect();
      if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
          setGameState(prev => ({ ...prev, p1Command: newCommand }));
      } else {
          mpService.send({ type: 'CLIENT_COMMAND_REQUEST', payload: { command: newCommand } });
      }
  };

  const handleSelectUnit = (id: string) => {
    // Removed confirmation dialog
    AudioService.playSelect();
    setSelectedUnitId(id);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // If we dragged the map, do not treat it as a click
    if (dragStatusRef.current.hasMoved) return;

    // Removed confirmation dialog
    setSelectedUnitId(null);
  };

  const handleSurrender = () => {
    if (gameState.gameStatus !== 'PLAYING') return;
    
    if (!window.confirm("Are you sure you want to surrender?")) return;

    AudioService.playSelect();
    
    if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
        // Host/Offline surrenders -> Defeat
        setGameState(prev => {
            const next = { ...prev, gameStatus: 'DEFEAT' as const };
            if (role === PlayerRole.HOST) {
                setTimeout(() => mpService.send({ type: 'GAME_STATE_UPDATE', payload: next }), 0);
            }
            return next;
        });
        AudioService.playFanfare(false);
    } else {
        // Client surrenders -> Request Host to end it
        mpService.send({ type: 'SURRENDER', payload: {} });
        addLog("Surrendering...", "info");
    }
  };

  const resetGame = () => {
    if (role === PlayerRole.HOST || role === PlayerRole.OFFLINE) {
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
            gameStatus: 'PLAYING'
        };
        setGameState(newState);
        setLogs([]);
        setSelectedUnitId(null);
        addLog("Battle Reset!", "info");
        if (role === PlayerRole.HOST) {
            mpService.send({ type: 'GAME_STATE_UPDATE', payload: newState });
        }
        aiStateRef.current.lastDecisionTime = Date.now(); // Reset AI
    } else {
        // Client requests reset
        mpService.send({ type: 'GAME_RESET', payload: {} });
    }
    
    // Reset scroll
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
    }
  };

  const handleReturnToMenu = () => {
    AudioService.playSelect();
    const resetState: GameState = {
        units: [],
        playerStatueHP: STATUE_HP,
        enemyStatueHP: STATUE_HP,
        p1Gold: INITIAL_GOLD,
        p2Gold: INITIAL_GOLD,
        p1Command: GameCommand.DEFEND,
        p2Command: GameCommand.DEFEND,
        lastTick: Date.now(),
        gameStatus: 'PLAYING'
    };
    setGameState(resetState);
    setLogs([]);
    setSelectedUnitId(null);
    mpService.destroy();
    setAppMode('LANDING');
  };

  // --- SCROLL HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    dragStatusRef.current.hasMoved = false;
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Click event fires after this
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    dragStatusRef.current.hasMoved = true;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll-fast
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // --- TOUCH HANDLERS (MOBILE) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    dragStatusRef.current.hasMoved = false;
    // Use first touch point
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

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // --- GAME LOOP (HOST & OFFLINE) ---
  useEffect(() => {
    // Both HOST and OFFLINE run the simulation loop
    if ((role !== PlayerRole.HOST && role !== PlayerRole.OFFLINE) || appMode !== 'GAME') return;

    const intervalId = setInterval(() => {
      if (stateRef.current.gameStatus !== 'PLAYING') return;

      const now = Date.now();
      const deltaTime = (now - stateRef.current.lastTick) / 1000; // seconds
      
      let currentUnits = [...stateRef.current.units];
      let pStatueHP = stateRef.current.playerStatueHP;
      let eStatueHP = stateRef.current.enemyStatueHP;
      let p1Gold = stateRef.current.p1Gold;
      let p2Gold = stateRef.current.p2Gold;
      let p2Cmd = stateRef.current.p2Command;

      // --- OFFLINE AI LOGIC ---
      if (role === PlayerRole.OFFLINE && now - aiStateRef.current.lastDecisionTime > 1000) {
          aiStateRef.current.lastDecisionTime = now;
          
          const enemyUnits = currentUnits.filter(u => u.side === 'enemy' && u.state !== 'DYING');
          const enemyMiners = enemyUnits.filter(u => u.type === UnitType.WORKER).length;
          
          // AI Economy: Try to maintain 4 miners
          if (enemyMiners < 4 && p2Gold >= UNIT_CONFIGS[UnitType.WORKER].cost) {
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
          // AI Military: Buy units if rich
          else if (p2Gold > 200) {
              const types = [UnitType.TOXIC, UnitType.ARCHER, UnitType.PALADIN, UnitType.MAGE];
              // Basic logic: prioritize cheaper unless rich
              const affordableTypes = types.filter(t => UNIT_CONFIGS[t].cost <= p2Gold);
              if (affordableTypes.length > 0) {
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

          // AI Strategy
          const combatUnits = enemyUnits.filter(u => u.type !== UnitType.WORKER).length;
          if (combatUnits > 6) {
              p2Cmd = GameCommand.ATTACK;
          } else if (eStatueHP < 1000) {
              p2Cmd = GameCommand.DEFEND;
          } else {
               // Default behavior: Defend or Retreat if weak
               if (combatUnits < 2) p2Cmd = GameCommand.RETREAT;
               else p2Cmd = GameCommand.DEFEND;
          }
      }

      // UNIT UPDATE LOGIC
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
                    const cmd = stateRef.current.p1Command;
                    if (cmd === GameCommand.ATTACK) {
                         moveDir = dirToStatue; 
                    } else if (cmd === GameCommand.DEFEND) { 
                        const DEFEND_LINE = 30;
                        const THREAT_RANGE = 50; 
                        if (target && target.x < THREAT_RANGE && Math.abs(target.x - unit.x) < config.stats.range + 10) {
                             moveDir = dirToTarget; 
                        } else {
                            if (unit.x > DEFEND_LINE + 1) moveDir = -1;
                            else if (unit.x < DEFEND_LINE - 1) moveDir = 1; 
                            else moveDir = 0; 
                        }
                    } else if (cmd === GameCommand.RETREAT) {
                        const BASE_POS = 10;
                        if (unit.x > BASE_POS) moveDir = -1;
                        else if (unit.x < BASE_POS - 2) moveDir = 1;
                        else moveDir = 0;
                    }
                } else {
                    // ENEMY (RED / P2) LOGIC
                    const cmd = role === PlayerRole.OFFLINE ? p2Cmd : stateRef.current.p2Command;
                    if (cmd === GameCommand.ATTACK) {
                         moveDir = dirToStatue; // -1
                    } else if (cmd === GameCommand.DEFEND) {
                        const DEFEND_LINE = 70; // Mirror of 30
                        const THREAT_RANGE = 50; // Midfield
                        // If P1 unit crosses 50, engage
                        if (target && target.x > THREAT_RANGE && Math.abs(target.x - unit.x) < config.stats.range + 10) {
                            moveDir = dirToTarget;
                        } else {
                            // Go to 70
                            if (unit.x < DEFEND_LINE - 1) moveDir = 1;
                            else if (unit.x > DEFEND_LINE + 1) moveDir = -1;
                            else moveDir = 0;
                        }
                    } else if (cmd === GameCommand.RETREAT) {
                         const BASE_POS = 90; // Mirror of 10
                         if (unit.x < BASE_POS - 1) moveDir = 1;
                         else if (unit.x > BASE_POS + 1) moveDir = -1;
                         else moveDir = 0;
                    }
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

        // --- NEW PHYSICS LOGIC ---
        // Get agility for this unit type (default to 5.0)
        const agility = UNIT_AGILITY[unit.type] || 5.0;
        
        // Exponential smoothing factor for velocity (Lerp-like)
        // This creates a natural ease-in / ease-out effect.
        // Factor = 1 - e^(-agility * dt). High agility = closer to 1 (instant).
        const smoothingFactor = 1 - Math.exp(-agility * deltaTime);
        
        // Update velocity
        unit.currentSpeed += (targetVelocity - unit.currentSpeed) * smoothingFactor;

        // Snap to target if very close to prevent micro-jitter when stopping
        if (Math.abs(targetVelocity - unit.currentSpeed) < 0.05) {
             if (targetVelocity === 0) unit.currentSpeed = 0;
        }

        // Apply Position
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
        p1Command: stateRef.current.p1Command, // Persist
        p2Command: p2Cmd, // Persist (or update from AI)
        lastTick: now,
        gameStatus: newStatus
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

  const currentGold = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Gold : gameState.p2Gold;
  const currentCommand = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? gameState.p1Command : gameState.p2Command;
  const roleLabel = role === PlayerRole.HOST ? 'HOST (BLUE)' : (role === PlayerRole.OFFLINE ? 'SINGLE PLAYER' : 'CLIENT (RED)');

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative touch-none">
      
      {/* GAME AREA - Removed onClick here */}
      <div 
        className="absolute inset-0 flex flex-col bg-inamorta select-none"
      >
          
          {/* HUD Overlay */}
          <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-start z-30 pointer-events-none">
             {/* Player Resources & Controls */}
             <div className="bg-black/80 backdrop-blur p-2 rounded-lg border border-yellow-500/30 text-white shadow-xl pointer-events-auto flex items-center gap-2 sm:gap-6 max-w-full overflow-x-auto no-scrollbar">
                
                {/* Role Indicator */}
                <div className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${role === PlayerRole.CLIENT ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {roleLabel}
                </div>

                {/* Gold */}
                <div className="flex items-center gap-2 min-w-[80px]">
                    <Coins className="text-yellow-400 w-4 h-4 sm:w-6 sm:h-6" />
                    <span className="text-lg sm:text-xl font-bold font-mono text-yellow-100">{Math.floor(currentGold)}</span>
                </div>
                
                <div className="h-8 w-px bg-white/20"></div>
                
                {/* Commands */}
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

                {/* Surrender Button */}
                <button
                    onClick={handleSurrender}
                    className="p-1.5 sm:p-2 rounded text-stone-500 hover:text-red-500 transition-colors"
                    title="Surrender"
                >
                    <Flag size={16} />
                </button>
             </div>

             {/* Status Message Overlay (Game Over Screen) */}
             {gameState.gameStatus !== 'PLAYING' && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-intro-fade">
                     <div className="bg-stone-900 p-8 rounded-xl border-4 border-stone-600 text-center shadow-2xl max-w-md w-full relative overflow-hidden">
                         {/* Background texture or effect inside card */}
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
                             
                             <div className="space-y-3">
                                 <button 
                                    onClick={resetGame}
                                    className="w-full bg-yellow-600 hover:bg-yellow-500 border-b-4 border-yellow-800 text-white font-bold py-3 rounded text-lg flex items-center justify-center gap-2 transition-all active:border-b-0 active:translate-y-1"
                                 >
                                    <RefreshCw size={20} /> 
                                    {role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? 'PLAY AGAIN' : 'REQUEST REMATCH'}
                                 </button>
                                 
                                 <button 
                                    onClick={handleReturnToMenu}
                                    className="w-full bg-stone-700 hover:bg-stone-600 border-b-4 border-stone-900 text-stone-200 font-bold py-3 rounded text-lg flex items-center justify-center gap-2 transition-all active:border-b-0 active:translate-y-1"
                                 >
                                    <CornerDownLeft size={20} /> MAIN MENU
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
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
                    const mySide = role === PlayerRole.HOST || role === PlayerRole.OFFLINE ? 'player' : 'enemy';
                    const count = gameState.units.filter(u => u.side === mySide && u.type === unit.type).length;
                    return (
                        <UnitCard 
                            key={unit.type}
                            unit={unit}
                            count={count}
                            canAfford={currentGold >= unit.cost}
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
  );
};
