import React, { useState } from 'react';
import { mpService } from '../services/multiplayerService';
import { Users, Copy, Play, Sword } from 'lucide-react';
import { AudioService } from '../services/audioService';

interface LandingPageProps {
  onStartHost: () => void;
  onStartClient: (hostId: string) => void;
  onStartOffline: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartHost, onStartClient, onStartOffline }) => {
  const [view, setView] = useState<'HOME' | 'LOBBY_HOST' | 'LOBBY_JOIN'>('HOME');
  const [myId, setMyId] = useState<string>('Generating...');
  const [hostIdInput, setHostIdInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [status, setStatus] = useState('');

  const handleCreateLobby = () => {
    AudioService.playSelect();
    setStatus('Initializing Server...');
    setView('LOBBY_HOST');
    mpService.initialize((id) => {
      setMyId(id);
      setStatus('Waiting for opponent...');
    });
    
    // Auto-start when opponent connects
    mpService.onConnect(() => {
        setStatus('Opponent Connected! Starting...');
        setTimeout(() => {
            onStartHost();
        }, 1000);
    });
  };

  const handleJoinLobby = () => {
     AudioService.playSelect();
     setView('LOBBY_JOIN');
     // Initialize peer just to get an ID (required to connect)
     mpService.initialize(() => {});
  };

  const handleConnect = () => {
      if(!hostIdInput) return;
      AudioService.playSelect();
      setStatus('Connecting to Host...');
      mpService.connectToPeer(hostIdInput);
      
      mpService.onConnect(() => {
          setStatus('Connected! Entering game...');
          setTimeout(() => {
              onStartClient(hostIdInput);
          }, 1000);
      });
  };
  
  const handleOffline = () => {
      AudioService.playSelect();
      onStartOffline();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(myId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] w-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/40 to-red-900/40 pointer-events-none"></div>

        <div className="z-10 bg-stone-900/90 border-2 border-stone-600 p-6 sm:p-8 rounded-xl max-w-md w-full backdrop-blur-md shadow-2xl flex flex-col justify-center max-h-full overflow-y-auto">
            
            {view === 'HOME' && (
                <div className="text-center space-y-6 sm:space-y-8">
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-epic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-lime-600 mb-2 drop-shadow-sm leading-tight">
                            SLIME WARS: SAGA
                        </h1>
                        <p className="text-stone-400 font-mono text-xs sm:text-sm tracking-widest">MULTIPLAYER LEGIONS</p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <button 
                            onClick={handleOffline}
                            className="w-full bg-yellow-700 hover:bg-yellow-600 border-b-4 border-yellow-900 text-white font-bold py-3 sm:py-4 rounded-lg flex items-center justify-center gap-3 transition-all active:border-b-0 active:translate-y-1 text-sm sm:text-base"
                        >
                            <Sword fill="currentColor" size={20} /> SINGLE PLAYER (VS AI)
                        </button>
                        
                        <div className="h-px bg-stone-700 w-full my-2"></div>
                        
                        <button 
                            onClick={handleCreateLobby}
                            className="w-full bg-blue-700 hover:bg-blue-600 border-b-4 border-blue-900 text-white font-bold py-3 sm:py-4 rounded-lg flex items-center justify-center gap-3 transition-all active:border-b-0 active:translate-y-1 text-sm sm:text-base"
                        >
                            <Play fill="currentColor" size={20} /> HOST SERVER
                        </button>
                        <button 
                            onClick={handleJoinLobby}
                            className="w-full bg-stone-700 hover:bg-stone-600 border-b-4 border-stone-900 text-white font-bold py-3 sm:py-4 rounded-lg flex items-center justify-center gap-3 transition-all active:border-b-0 active:translate-y-1 text-sm sm:text-base"
                        >
                            <Users size={20} /> JOIN SERVER
                        </button>
                    </div>
                </div>
            )}

            {view === 'LOBBY_HOST' && (
                <div className="text-center space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-epic text-blue-400">Host Lobby</h2>
                    
                    <div className="bg-black/50 p-3 sm:p-4 rounded border border-white/10">
                        <p className="text-xs sm:text-sm text-stone-500 mb-2">Share this Server ID with your friend:</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-stone-800 p-2 rounded text-yellow-500 font-mono text-xl sm:text-2xl tracking-wider font-bold break-all">
                                {myId}
                            </code>
                            <button onClick={copyToClipboard} className="p-2 bg-stone-700 rounded hover:bg-stone-600 flex-shrink-0">
                                <Copy size={18} />
                            </button>
                        </div>
                        {isCopied && <p className="text-green-500 text-xs mt-1">Copied!</p>}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                        <span className="text-stone-300 animate-pulse text-sm">Waiting for opponent...</span>
                    </div>

                    <button 
                        onClick={() => setView('HOME')}
                        className="text-stone-500 hover:text-white underline text-sm"
                    >
                        Back
                    </button>
                </div>
            )}

            {view === 'LOBBY_JOIN' && (
                <div className="text-center space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-epic text-red-400">Join Server</h2>
                    
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="e.g. MW-X92Z"
                            className="w-full bg-stone-950 border border-stone-700 p-3 rounded text-white font-mono focus:outline-none focus:border-yellow-500 text-sm sm:text-base uppercase"
                            value={hostIdInput}
                            onChange={(e) => setHostIdInput(e.target.value.toUpperCase())}
                        />
                    </div>

                    <button 
                        onClick={handleConnect}
                        disabled={!hostIdInput}
                        className={`w-full font-bold py-3 rounded-lg transition-all text-sm sm:text-base ${hostIdInput ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}
                    >
                        CONNECT
                    </button>

                    <div className="text-stone-400 text-sm h-6">{status}</div>

                    <button 
                        onClick={() => setView('HOME')}
                        className="text-stone-500 hover:text-white underline text-sm"
                    >
                        Back
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};