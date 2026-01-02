import React, { useState } from 'react';
import { MAP_CONFIGS } from '../constants';
import { MapId } from '../types';
import { AudioService } from '../services/audioService';
import { Map, Mountain, Trees } from 'lucide-react';

interface MapSelectionProps {
  onSelectMap: (mapId: MapId) => void;
  onBack: () => void;
}

export const MapSelection: React.FC<MapSelectionProps> = ({ onSelectMap, onBack }) => {
  const [selected, setSelected] = useState<MapId>(MapId.FOREST);

  const handleConfirm = () => {
    AudioService.playSelect();
    onSelectMap(selected);
  };

  const maps = Object.values(MAP_CONFIGS);

  const getIcon = (id: MapId) => {
      switch(id) {
          case MapId.FOREST: return <Trees size={32} className="text-green-400" />;
          case MapId.MINE: return <Mountain size={32} className="text-stone-400" />;
          case MapId.SWAMP: return <Map size={32} className="text-purple-400" />;
      }
  };

  const getBgClass = (id: MapId) => {
      switch(id) {
          case MapId.FOREST: return "bg-gradient-to-b from-sky-800 to-green-900";
          case MapId.MINE: return "bg-gradient-to-b from-stone-800 to-stone-950";
          case MapId.SWAMP: return "bg-gradient-to-b from-emerald-900 to-purple-950";
      }
  };

  return (
    <div 
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4 h-[100dvh]"
        style={{
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}
    >
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40"></div>
       
       <div className="relative z-10 w-full max-w-5xl h-full flex flex-col">
           <h2 className="text-2xl sm:text-4xl font-epic text-white mb-4 sm:mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] shrink-0">
               SELECT BATTLEFIELD
           </h2>

           <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4 touch-pan-y">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   {maps.map((map) => (
                       <div 
                          key={map.id}
                          onClick={() => { AudioService.playSelect(); setSelected(map.id); }}
                          className={`
                             relative p-4 rounded-xl border-4 cursor-pointer transition-all duration-300 group flex flex-col min-h-[250px]
                             ${selected === map.id 
                                ? 'border-yellow-500 scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.4)]' 
                                : 'border-stone-700 opacity-70 hover:opacity-100 hover:border-stone-500'}
                             ${getBgClass(map.id)}
                          `}
                       >
                           <div className="flex items-center justify-between mb-2">
                               <div className="p-2 bg-black/40 rounded-lg backdrop-blur-sm">
                                   {getIcon(map.id)}
                               </div>
                               <span className={`
                                  text-xs font-bold px-2 py-1 rounded
                                  ${map.difficulty === 'Easy' ? 'bg-green-600 text-green-100' : 
                                    map.difficulty === 'Medium' ? 'bg-yellow-600 text-yellow-100' : 
                                    'bg-red-600 text-red-100'}
                               `}>
                                  {map.difficulty}
                               </span>
                           </div>

                           <h3 className="text-lg font-bold font-epic text-white mb-1">{map.name}</h3>
                           <p className="text-xs text-stone-300 mb-2">{map.description}</p>
                           
                           <div className="mt-auto bg-black/30 p-2 rounded border border-white/5">
                               <p className="text-[10px] text-yellow-200 font-bold uppercase tracking-wider mb-0.5">Special Feature</p>
                               <p className="text-[10px] text-stone-300 leading-relaxed">{map.specialFeature}</p>
                           </div>

                           {/* Selection Ring */}
                           {selected === map.id && (
                               <div className="absolute -inset-1 border-2 border-yellow-500 rounded-xl animate-pulse pointer-events-none"></div>
                           )}
                       </div>
                   ))}
               </div>
           </div>

           <div className="mt-4 flex gap-4 w-full max-w-md mx-auto shrink-0 pb-[env(safe-area-inset-bottom)]">
               <button 
                  onClick={onBack}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 rounded-lg border-b-4 border-stone-950 active:border-b-0 active:translate-y-1 transition-all text-sm sm:text-base"
               >
                  BACK
               </button>
               <button 
                  onClick={handleConfirm}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] text-sm sm:text-base"
               >
                  START BATTLE
               </button>
           </div>
       </div>
    </div>
  );
};