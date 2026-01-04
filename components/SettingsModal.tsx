import React, { useState, useEffect } from 'react';
import { X, Volume2, Music, Speaker } from 'lucide-react';
import { AudioService } from '../services/audioService';

interface SettingsModalProps {
  onClose: () => void;
  onLeaveGame?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onLeaveGame }) => {
  const [volumes, setVolumes] = useState(AudioService.getVolumes());

  const handleVolumeChange = (type: 'master' | 'music' | 'sfx', val: number) => {
      if (type === 'master') AudioService.setMasterVolume(val);
      if (type === 'music') AudioService.setMusicVolume(val);
      if (type === 'sfx') AudioService.setSfxVolume(val);
      setVolumes(prev => ({ ...prev, [type]: val }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-stone-900 w-full max-w-md mx-4 rounded-xl border border-stone-700 shadow-2xl p-6 relative">
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-epic text-white">SETTINGS</h2>
                <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Master Volume */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-stone-300">
                        <div className="flex items-center gap-2"><Speaker size={16} /> Master Volume</div>
                        <span>{Math.round(volumes.master * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={volumes.master}
                        onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>

                {/* Music Volume */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-stone-300">
                        <div className="flex items-center gap-2"><Music size={16} /> Music</div>
                        <span>{Math.round(volumes.music * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={volumes.music}
                        onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
                        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* SFX Volume */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-stone-300">
                        <div className="flex items-center gap-2"><Volume2 size={16} /> Sound Effects</div>
                        <span>{Math.round(volumes.sfx * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={volumes.sfx}
                        onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                </div>
            </div>

            {onLeaveGame && (
                <div className="mt-8 pt-6 border-t border-stone-800">
                    <button 
                        onClick={onLeaveGame}
                        className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-900 hover:border-red-500 py-3 rounded-lg font-bold transition-all text-sm"
                    >
                        LEAVE BATTLE
                    </button>
                </div>
            )}
            
             <div className="mt-4 pt-2 text-center">
                 <p className="text-[10px] text-stone-600 font-mono">Slime Wars: Saga v1.0.0</p>
             </div>

        </div>
    </div>
  );
};
