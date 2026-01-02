import React, { useMemo } from 'react';
import { MapId } from '../types';

interface BattlefieldBackgroundProps {
  mapId: MapId;
}

export const BattlefieldBackground: React.FC<BattlefieldBackgroundProps> = ({ mapId }) => {
  
  // Memoize randomized elements to ensure they stay static during game ticks
  const forestVisuals = useMemo(() => {
      const trees = [...Array(12)].map((_, i) => ({
          id: i,
          left: (i * 8) + (Math.random() * 4), // Distributed across width
          scale: 0.7 + Math.random() * 0.6,
          color: Math.random() > 0.5 ? 'border-b-green-800' : 'border-b-green-900',
          zIndex: Math.floor(Math.random() * 5) // Slight layering
      }));
      
      const grass = [...Array(20)].map((_, i) => ({
          id: i,
          left: (i * 5) + Math.random() * 5,
          height: 10 + Math.random() * 10
      }));

      return { trees, grass };
  }, []);

  const renderForest = () => (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-green-200"></div>
      
      {/* Static Trees Layer */}
      <div className="absolute bottom-24 w-full h-48 pointer-events-none">
         {forestVisuals.trees.map((tree) => (
            <div key={`tree-${tree.id}`} 
                 className="absolute bottom-0 flex flex-col items-center"
                 style={{ 
                     left: `${tree.left}%`, 
                     transform: `scale(${tree.scale})`,
                     transformOrigin: 'bottom center',
                     zIndex: tree.zIndex
                 }} 
            >
                {/* Tree Trunk */}
                <div className="w-3 h-6 bg-stone-800/80 mb-[-5px]"></div>
                {/* Tree Top */}
                <div className={`w-0 h-0 border-l-[20px] border-r-[20px] border-b-[80px] border-l-transparent border-r-transparent ${tree.color}`}></div>
            </div>
         ))}
      </div>
      
      {/* Poison Swamp Center */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[20%] h-16 bg-purple-900/40 blur-xl rounded-full z-10 animate-pulse"></div>
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-purple-800 font-bold opacity-50 text-xs tracking-widest z-0">POISON SWAMP</div>

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-b from-green-700 via-green-800 to-green-950 border-t-4 border-green-600 shadow-[inset_0_10px_20px_-5px_rgba(0,0,0,0.4)] z-0">
          {/* Static Grass details */}
          {forestVisuals.grass.map((g) => (
              <div 
                key={`grass-${g.id}`} 
                className="absolute bottom-full w-1 bg-green-600 rounded-t-full opacity-80" 
                style={{ left: `${g.left}%`, height: `${g.height}px` }}
              ></div>
          ))}
      </div>
    </>
  );

  const renderMine = () => (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-800 via-stone-700 to-stone-600"></div>
      
      {/* Cave Background Features */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-stone.png')]"></div>
      
      {/* Stalagmites / Rocks */}
      <div className="absolute bottom-24 w-full h-full pointer-events-none">
          <div className="absolute bottom-0 left-[20%] w-0 h-0 border-l-[30px] border-r-[10px] border-b-[60px] border-l-transparent border-r-transparent border-b-stone-900 opacity-80"></div>
          <div className="absolute bottom-0 right-[25%] w-0 h-0 border-l-[15px] border-r-[35px] border-b-[50px] border-l-transparent border-r-transparent border-b-stone-800 opacity-80"></div>
          
          {/* Tunnel Hints */}
          <div className="absolute bottom-10 left-[30%] w-[10%] h-12 bg-black/40 rounded-t-full blur-sm"></div>
          <div className="absolute bottom-10 right-[30%] w-[10%] h-12 bg-black/40 rounded-t-full blur-sm"></div>
      </div>

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-b from-stone-800 via-stone-900 to-black border-t-4 border-stone-600 shadow-[inset_0_10px_20px_-5px_rgba(0,0,0,0.5)] z-0">
           {/* Rails or rocks */}
           <div className="absolute top-2 w-full h-2 bg-black/20 border-t border-b border-stone-500/20"></div>
           <div className="absolute top-8 w-full h-2 bg-black/20 border-t border-b border-stone-500/20"></div>
      </div>
    </>
  );

  const renderSwamp = () => (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-emerald-950 to-purple-950"></div>
      
      {/* Fog */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/30 to-transparent pointer-events-none"></div>
      
      {/* Trees / Logs */}
      <div className="absolute bottom-20 w-full opacity-60 pointer-events-none">
           <div className="absolute left-[10%] bottom-0 w-4 h-40 bg-stone-900 -rotate-2"></div>
           <div className="absolute right-[15%] bottom-0 w-6 h-32 bg-stone-900 rotate-3"></div>
           {/* Fallen Log */}
           <div className="absolute left-[40%] bottom-0 w-24 h-6 bg-stone-800 rounded -rotate-1"></div>
      </div>

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-b from-emerald-900 via-stone-900 to-black border-t-4 border-emerald-800/50 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] z-0">
          <div className="w-full h-full opacity-30 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.5)_100%)]"></div>
          {/* Bubbles */}
          <div className="absolute top-4 left-[20%] w-2 h-2 bg-emerald-400/50 rounded-full animate-pulse"></div>
          <div className="absolute top-10 right-[35%] w-3 h-3 bg-purple-400/30 rounded-full animate-bounce"></div>
      </div>
    </>
  );

  switch (mapId) {
    case MapId.FOREST: return renderForest();
    case MapId.MINE: return renderMine();
    case MapId.SWAMP: return renderSwamp();
    default: return renderForest();
  }
};