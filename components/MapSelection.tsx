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
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40"></div>
       
       <h2 className="relative z-10 text-3xl sm:text-5xl font-epic text-white mb-6 sm:mb-10 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
           SELECT BATTLEFIELD
       </h2>

       <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-5xl h-[60vh] sm:h-auto overflow-y-auto sm:overflow-visible no-scrollbar">
           {maps.map((map) => (
               <div 
                  key={map.id}
                  onClick={() => { AudioService.playSelect(); setSelected(map.id); }}
                  className={`
                     relative p-4 sm:p-6 rounded-xl border-4 cursor-pointer transition-all duration-300 group flex flex-col
                     ${selected === map.id 
                        ? 'border-yellow-500 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.4)]' 
                        : 'border-stone-700 opacity-60 hover:opacity-100 hover:border-stone-500'}
                     ${getBgClass(map.id)}
                  `}
               >
                   <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-black/40 rounded-lg backdrop-blur-sm">
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

                   <h3 className="text-xl font-bold font-epic text-white mb-2">{map.name}</h3>
                   <p className="text-sm text-stone-300 mb-4 h-10">{map.description}</p>
                   
                   <div className="mt-auto bg-black/30 p-3 rounded border border-white/5">
                       <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider mb-1">Special Feature</p>
                       <p className="text-xs text-stone-300 leading-relaxed">{map.specialFeature}</p>
                   </div>

                   {/* Selection Ring */}
                   {selected === map.id && (
                       <div className="absolute -inset-1 border-2 border-yellow-500 rounded-xl animate-pulse pointer-events-none"></div>
                   )}
               </div>
           ))}
       </div>

       <div className="relative z-10 mt-8 flex gap-4 w-full max-w-md">
           <button 
              onClick={onBack}
              className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 rounded-lg border-b-4 border-stone-950 active:border-b-0 active:translate-y-1 transition-all"
           >
              BACK
           </button>
           <button 
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]"
           >
              START BATTLE
           </button>
       </div>
    </div>
  );
};