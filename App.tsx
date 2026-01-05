
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
  FORMATION_OFFSETS,
  MAP_CONFIGS
} from './constants';
import { StickmanRender } from './components/StickmanRender';
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
                    
                    <path d="M50 320 L 60 120 L 110 50 L 160 120 L 170 320 Z" fill={`url(#tower-body-${variant})`} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                    <ellipse cx="110" cy="180" rx="25" ry="40" fill="url(#portal-glow)" className="animate-pulse" />
                </svg>
            </div>
        </div>
    );
};

export const App: React.FC = () => {
    const [view, setView] = useState<'LOADING' | 'INTRO' | 'MAP_SELECT' | 'GAME' | 'END'>('LOADING');
    const [gameState, setGameState] = useState<GameState>({
        units: [],
        projectiles: [],
        playerStatueHP: STATUE_HP,
        enemyStatueHP: STATUE_HP,
        p1Gold: INITIAL_GOLD,
        p2Gold: INITIAL_GOLD,
        p1Command: GameCommand.ATTACK,
        p2Command: GameCommand.ATTACK,
        lastTick: Date.now(),
        gameStatus: 'PLAYING',
        mapId: MapId.FOREST
    });

    const [mapId, setMapId] = useState<MapId>(MapId.FOREST);
    const [showSettings, setShowSettings] = useState(false);
    const [surgeMode, setSurgeMode] = useState(false);
    const [playerRole, setPlayerRole] = useState<PlayerRole>(PlayerRole.OFFLINE);
    const [playerId, setPlayerId] = useState<string>('player');
    
    // Game Loop Refs
    const requestRef = useRef<number>();
    const lastTickRef = useRef<number>(Date.now());

    // Game Loop
    const gameLoop = useCallback(() => {
        const now = Date.now();
        const dt = now - lastTickRef.current;
        
        // Skip excessively long frames (tab backgrounding)
        if (dt > 1000) {
            lastTickRef.current = now;
            requestRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        // --- UPDATE LOGIC SIMPLIFIED ---
        setGameState(prev => {
            if (prev.gameStatus !== 'PLAYING') return prev;

            const nextUnits = prev.units.map(u => {
                // Simplified Movement Logic
                let speed = u.state === 'WALKING' || u.state === 'ATTACKING' ? 0.05 : 0; // Approx speed factor
                if (u.type === UnitType.WORKER) speed *= 0.8;
                
                // Direction
                const dir = u.side === 'player' ? 1 : -1;
                let nextX = u.x + (speed * dir);
                
                // Collision with Statue/End
                if (u.side === 'player' && nextX > STATUE_ENEMY_POS - 5) nextX = STATUE_ENEMY_POS - 5;
                if (u.side === 'enemy' && nextX < STATUE_PLAYER_POS + 5) nextX = STATUE_PLAYER_POS + 5;
                
                return { ...u, x: nextX };
            });

            // Gold accumulation
            const goldInc = dt * 0.005; 

            return {
                ...prev,
                units: nextUnits,
                p1Gold: Math.min(9999, prev.p1Gold + goldInc),
                p2Gold: Math.min(9999, prev.p2Gold + goldInc),
                lastTick: now
            };
        });

        lastTickRef.current = now;
        requestRef.current = requestAnimationFrame(gameLoop);
    }, []);

    useEffect(() => {
        if (view === 'GAME') {
            lastTickRef.current = Date.now();
            requestRef.current = requestAnimationFrame(gameLoop);
            AudioService.startMusic(mapId);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            AudioService.stopMusic();
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [view, mapId, gameLoop]);

    const handleStartHost = (surge: boolean) => {
        setSurgeMode(surge);
        setPlayerRole(PlayerRole.HOST);
        setView('MAP_SELECT');
    };

    const handleStartClient = (hostId: string) => {
        setPlayerRole(PlayerRole.CLIENT);
        setPlayerId('enemy'); // Client plays as 'enemy' (red) logically for mirroring? Or we invert view.
        // For simplicity, let's say client always sees themselves as blue (left) but sends commands for 'enemy' side
        setView('GAME');
    };

    const handleStartOffline = (surge: boolean) => {
        setSurgeMode(surge);
        setPlayerRole(PlayerRole.OFFLINE);
        setView('MAP_SELECT');
    };

    const handleMapSelect = (id: MapId) => {
        setMapId(id);
        const startGold = surgeMode ? INITIAL_GOLD_SURGE : INITIAL_GOLD;
        setGameState(prev => ({
            ...prev,
            mapId: id,
            p1Gold: startGold,
            p2Gold: startGold,
            units: [],
            playerStatueHP: STATUE_HP,
            enemyStatueHP: STATUE_HP,
            gameStatus: 'PLAYING'
        }));
        setView('GAME');
    };

    const handleRecruit = (type: UnitType) => {
        const cost = UNIT_CONFIGS[type].cost;
        if (gameState.p1Gold >= cost) {
            AudioService.playRecruit();
            setGameState(prev => ({
                ...prev,
                p1Gold: prev.p1Gold - cost,
                units: [
                    ...prev.units,
                    {
                        id: `p1-${Date.now()}-${Math.random()}`,
                        type,
                        side: 'player',
                        x: SPAWN_X_PLAYER,
                        hp: UNIT_CONFIGS[type].stats.maxHp,
                        maxHp: UNIT_CONFIGS[type].stats.maxHp,
                        state: 'WALKING',
                        lastAttackTime: 0,
                        currentSpeed: UNIT_CONFIGS[type].stats.speed
                    }
                ]
            }));
            // If multiplayer, send recruit msg
        }
    };

    const handleCommand = (cmd: GameCommand) => {
        AudioService.playSelect();
        setGameState(prev => ({ ...prev, p1Command: cmd }));
    };

    return (
        <div className="w-full h-[100dvh] overflow-hidden bg-black font-sans select-none relative">
             {view === 'LOADING' && <LandingPage onStartHost={handleStartHost} onStartClient={handleStartClient} onStartOffline={handleStartOffline} />}
             {view === 'INTRO' && <IntroSequence onComplete={() => setView('LOADING')} />}
             {view === 'MAP_SELECT' && <MapSelection onSelectMap={handleMapSelect} onBack={() => setView('LOADING')} />}
             
             {view === 'GAME' && (
                 <>
                    <BattlefieldBackground mapId={mapId} />
                    
                    {/* Statues & Crystals */}
                    <BaseStatue x={STATUE_PLAYER_POS} hp={gameState.playerStatueHP} variant="BLUE" />
                    <BaseStatue x={STATUE_ENEMY_POS} hp={gameState.enemyStatueHP} variant="RED" isFlipped />
                    <CrystalRock x={GOLD_MINE_PLAYER_X} />
                    <CrystalRock x={GOLD_MINE_ENEMY_X} isFlipped />

                    <ArmyVisuals 
                        units={gameState.units} 
                        projectiles={gameState.projectiles}
                        p1Command={gameState.p1Command}
                        p2Command={gameState.p2Command}
                    />

                    {/* HUD */}
                    <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start pointer-events-none">
                        <div className="flex gap-4 pointer-events-auto">
                            <div className="bg-stone-900/80 p-2 rounded border border-yellow-500/50 flex items-center gap-2">
                                <Gem className="text-yellow-400" size={20} />
                                <span className="text-yellow-100 font-bold text-lg">{Math.floor(gameState.p1Gold)}</span>
                            </div>
                        </div>
                        <button onClick={() => setShowSettings(true)} className="pointer-events-auto p-2 bg-stone-900/50 rounded-full border border-white/10 text-white">
                            <Settings size={24} />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black via-stone-900/90 to-transparent pt-12 pb-safe">
                        <div className="flex justify-center gap-2 mb-2">
                             {[GameCommand.ATTACK, GameCommand.DEFEND, GameCommand.RETREAT].map(cmd => (
                                 <button 
                                    key={cmd}
                                    onClick={() => handleCommand(cmd)}
                                    className={`px-4 py-2 rounded font-bold text-xs sm:text-sm flex items-center gap-2 border-b-4 active:border-b-0 active:translate-y-1 transition-all ${gameState.p1Command === cmd ? 'bg-yellow-600 border-yellow-800 text-white' : 'bg-stone-700 border-stone-900 text-stone-400'}`}
                                 >
                                     {cmd === 'ATTACK' && <Swords size={16}/>}
                                     {cmd === 'DEFEND' && <Shield size={16}/>}
                                     {cmd === 'RETREAT' && <CornerDownLeft size={16}/>}
                                     {cmd}
                                 </button>
                             ))}
                        </div>
                        
                        <div className="flex overflow-x-auto gap-2 pb-2 px-2 no-scrollbar justify-start sm:justify-center">
                            {Object.values(UNIT_CONFIGS).filter(u => u.type !== UnitType.SMALL && u.type !== UnitType.BOSS).map(u => (
                                <UnitCard 
                                    key={u.type}
                                    unit={u}
                                    count={gameState.units.filter(unit => unit.side === 'player' && unit.type === u.type).length}
                                    canAfford={gameState.p1Gold >= u.cost}
                                    onRecruit={handleRecruit}
                                />
                            ))}
                        </div>
                    </div>

                    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onLeaveGame={() => setView('LOADING')} />}
                 </>
             )}
        </div>
    );
};
