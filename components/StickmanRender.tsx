import React, { useMemo } from 'react';
import { UnitType } from '../types';

interface StickmanProps {
  type: UnitType;
  color?: string; 
  scale?: number;
  isPlayer?: boolean;
  isAttacking?: boolean;
  isMoving?: boolean;
  isDying?: boolean;
  isSelected?: boolean;
  isMining?: boolean;
  isDepositing?: boolean;
  hasGold?: boolean;
}

export const StickmanRender: React.FC<StickmanProps> = ({ 
  type, 
  color: propColor, // Unused, we determine color by type
  scale = 1, 
  isPlayer = true,
  isAttacking = false, 
  isMoving = false,
  isDying = false,
  isSelected = false,
  isMining = false,
  isDepositing = false,
  hasGold = false
}) => {
  const animationDelay = useMemo(() => Math.random() * 1, []);
  
  // Memoize random delays for the bubbles so they don't look uniform across all units
  const bubbleDelays = useMemo(() => [Math.random() * 2, Math.random() * 2, Math.random() * 2], []);
  
  // -- ANIMATION CLASS SELECTOR --
  let animClass = "";
  if (isDying) {
      animClass = "animate-death-puddle";
  } else if (isAttacking || isMining) {
      if (type === UnitType.TOXIC) animClass = "animate-toxic-spit"; 
      else if (type === UnitType.ARCHER) animClass = "animate-idle-breathe"; 
      else if (type === UnitType.BOSS) animClass = "animate-boss-stomp"; // New stomp
      else if (type === UnitType.WORKER && isMining) animClass = "animate-mining"; // New mining bounce
      else animClass = "animate-slime-attack"; // Generic lunge
  } else if (isMoving || isDepositing) {
      if (type === UnitType.MAGE) animClass = "animate-mage-float"; // Mage floats
      else animClass = "animate-slime-bounce";
  } else {
      if (type === UnitType.MAGE) animClass = "animate-mage-float";
      else animClass = "animate-idle-breathe";
  }

  const style = { animationDelay: isDying ? '0s' : `${animationDelay}s` };
  
  // -- COLORS --
  // Player: Blue/Teal themes
  // Enemy: Red/Purple themes
  let baseColor = isPlayer ? "#3b82f6" : "#ef4444"; // Default Blue / Red
  let secondaryColor = isPlayer ? "#1e40af" : "#991b1b"; // Darker rim

  switch(type) {
      case UnitType.WORKER:
          baseColor = isPlayer ? "#fbbf24" : "#b45309"; // Yellow / Brownish
          secondaryColor = isPlayer ? "#d97706" : "#78350f";
          break;
      case UnitType.TOXIC:
          baseColor = isPlayer ? "#84cc16" : "#65a30d"; // Lime Green / Swamp Green
          secondaryColor = isPlayer ? "#3f6212" : "#365314";
          break;
      case UnitType.ARCHER:
          baseColor = isPlayer ? "#22d3ee" : "#0891b2"; // Cyan / Dark Cyan
          secondaryColor = isPlayer ? "#0e7490" : "#164e63";
          break;
      case UnitType.PALADIN:
          baseColor = isPlayer ? "#e2e8f0" : "#9ca3af"; // White/Silver / Grey
          secondaryColor = isPlayer ? "#94a3b8" : "#4b5563";
          break;
      case UnitType.MAGE:
          baseColor = isPlayer ? "#a855f7" : "#7e22ce"; // Purple / Dark Purple
          secondaryColor = isPlayer ? "#6b21a8" : "#581c87";
          break;
      case UnitType.BOSS:
          baseColor = isPlayer ? "#f43f5e" : "#881337"; // Pink/Red / Dark Red
          secondaryColor = isPlayer ? "#9f1239" : "#4c0519";
          break;
  }

  // --- COMPONENT PARTS ---

  const SlimeBody = () => (
      <path 
        d="M15 100 C 15 100 15 40 50 40 C 85 40 85 100 85 100 Z" 
        fill={baseColor} 
        stroke={secondaryColor} 
        strokeWidth="3"
        fillOpacity="0.95"
      />
  );
  
  // New Component: Internal Bubbles
  const SlimeBubbles = () => (
      <g opacity="0.4" className="pointer-events-none">
          {/* Bubbles positioned carefully within the body path safe zone */}
          <circle cx="40" cy="90" r="3" fill="white" className="animate-bubble-rise" style={{ animationDelay: `${bubbleDelays[0]}s` }} />
          <circle cx="60" cy="85" r="2" fill="white" className="animate-bubble-rise" style={{ animationDelay: `${bubbleDelays[1]}s`, animationDuration: '2.5s' }} />
          <circle cx="50" cy="80" r="2.5" fill="white" className="animate-bubble-rise" style={{ animationDelay: `${bubbleDelays[2]}s`, animationDuration: '3s' }} />
      </g>
  );

  const Eyes = () => {
     if (type === UnitType.BOSS) {
         // Angry Eyes
         return (
             <g>
                 <path d="M35 55 L 45 60" stroke="white" strokeWidth="3" />
                 <path d="M65 55 L 55 60" stroke="white" strokeWidth="3" />
                 <circle cx="40" cy="65" r="3" fill="white" />
                 <circle cx="60" cy="65" r="3" fill="white" />
             </g>
         );
     }
     if (type === UnitType.PALADIN) {
         // Serious lines / Narrow eyes
         return (
             <g>
                 <rect x="35" y="60" width="10" height="4" fill="black" opacity="0.6"/>
                 <rect x="55" y="60" width="10" height="4" fill="black" opacity="0.6"/>
             </g>
         );
     }
     // Standard Cute Eyes
     return (
         <g>
             <circle cx="35" cy="60" r="4" fill="white" />
             <circle cx="35" cy="60" r="2" fill="black" />
             <circle cx="65" cy="60" r="4" fill="white" />
             <circle cx="65" cy="60" r="2" fill="black" />
         </g>
     );
  };

  const Accessories = () => {
      // Miner Hat
      if (type === UnitType.WORKER) {
          return (
              <g transform="translate(0, -5)">
                  <path d="M30 45 Q 50 35 70 45" stroke="#fbbf24" strokeWidth="4" fill="none" /> 
                  <path d="M35 45 L 35 35 Q 50 25 65 35 L 65 45 Z" fill="#4b5563" stroke="black" strokeWidth="1" />
                  <rect x="45" y="30" width="10" height="8" fill="#fef08a" /> {/* Light */}
                  
                  {/* Pickaxe if mining */}
                  {(isMining || isAttacking) && (
                      <g transform="translate(75, 60) rotate(45)">
                          <path d="M0 0 L 0 20" stroke="#78350f" strokeWidth="3" />
                          <path d="M-5 5 Q 0 -5 5 5" stroke="#94a3b8" strokeWidth="3" fill="none" />
                      </g>
                  )}
                  {/* Gold Sack */}
                  {(hasGold || isDepositing) && (
                      <circle cx="20" cy="80" r="8" fill="#fbbf24" stroke="#b45309" />
                  )}
                  {/* Sparkles */}
                  {(hasGold || isMining) && (
                     <g>
                       <path d="M10 20 L 15 10 L 20 20 L 30 25 L 20 30 L 15 40 L 10 30 L 0 25 Z" fill="#fef08a" className="animate-sparkle" />
                       <path d="M70 10 L 73 0 L 76 10 L 86 13 L 76 16 L 73 26 L 70 16 L 60 13 Z" fill="#fef08a" className="animate-sparkle" style={{animationDelay: '0.7s'}} />
                     </g>
                  )}
              </g>
          );
      }

      // Toxic Bubbles & Drip
      if (type === UnitType.TOXIC) {
          return (
              <g>
                  <circle cx="20" cy="90" r="3" fill="#bef264" className="animate-pulse" />
                  <circle cx="80" cy="85" r="2" fill="#bef264" className="animate-pulse" style={{animationDelay: '0.5s'}} />
                  {/* Slime Drip from Mouth */}
                  <circle cx="45" cy="70" r="2" fill="#bef264" className="animate-toxic-drip" />
                  
                  {isAttacking && (
                      <g className="animate-toxic-projectile">
                          {/* Viscous Blob shape */}
                          <path d="M0 0 C 5 -5, 10 -2, 12 5 C 10 10, 5 12, 0 10 C -5 8, -2 3, 0 0 Z" fill="#a3e635" stroke="#365314" strokeWidth="1" />
                          <circle cx="3" cy="3" r="1.5" fill="#f7fee7" opacity="0.6" />
                          <circle cx="8" cy="7" r="1" fill="#f7fee7" opacity="0.4" />
                      </g>
                  )}
              </g>
          );
      }

      // Archer Bow (Enhanced Animation)
      if (type === UnitType.ARCHER) {
          return (
              <g transform="translate(55, 60)">
                  {/* Bow Body - Animates recoil when attacking */}
                  <g className={isAttacking ? "animate-bow-recoil" : ""}>
                      <path d="M15 -20 Q -5 0 15 20" stroke="#fcd34d" strokeWidth="3" fill="none" />
                      <line x1="15" y1="-20" x2="15" y2="20" stroke="white" strokeWidth="1" opacity="0.6" />
                  </g>
                  
                  {/* Arrow - Animates flight when attacking */}
                  {isAttacking ? (
                      <g className="animate-arrow-fly">
                          <line x1="-5" y1="0" x2="15" y2="0" stroke="white" strokeWidth="2" />
                          <path d="M15 0 L 10 -3 L 10 3 Z" fill="white" />
                          <path d="M-5 0 L -8 -2 M-5 0 L -8 2" stroke="white" strokeWidth="1" />
                      </g>
                  ) : (
                      <g>
                          <line x1="0" y1="0" x2="15" y2="0" stroke="white" strokeWidth="2" />
                          <path d="M15 0 L 10 -3 L 10 3 Z" fill="white" />
                      </g>
                  )}
              </g>
          );
      }

      // Paladin Shield & Helm
      if (type === UnitType.PALADIN) {
          const isIdle = !isAttacking && !isMoving && !isDying;
          const shieldAnim = isIdle ? "animate-paladin-shield" : "";

          return (
              <g>
                  {/* Helm Visor */}
                  <path d="M30 45 L 70 45 L 60 70 L 40 70 Z" fill="none" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="50" y1="45" x2="50" y2="70" stroke="#94a3b8" strokeWidth="1" />
                  
                  {/* Shield */}
                  <g className={shieldAnim} style={{ transformOrigin: '70px 80px' }}>
                    <path d="M60 70 Q 60 90 70 95 Q 80 90 80 70 L 60 70" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
                    <path d="M65 75 L 75 85" stroke="#ef4444" strokeWidth="2" />
                    <path d="M75 75 L 65 85" stroke="#ef4444" strokeWidth="2" />
                    {/* Glint */}
                    <circle cx="65" cy="75" r="1" fill="white" className="animate-pulse" />
                  </g>
              </g>
          );
      }

      // Mage Hat & Staff
      if (type === UnitType.MAGE) {
          return (
              <g>
                  {/* Hat */}
                  <path d="M25 40 L 75 40 L 50 10 Z" fill={baseColor} stroke={secondaryColor} strokeWidth="2" />
                  <ellipse cx="50" cy="40" rx="25" ry="5" fill={secondaryColor} />
                  
                  {/* Staff */}
                  <line x1="80" y1="50" x2="80" y2="90" stroke="#78350f" strokeWidth="2" />
                  <circle cx="80" cy="50" r="4" fill="#a855f7" className="animate-pulse" />
                  
                  {/* Floating particles orbit */}
                  <g transform="translate(50, 50)" className="animate-magic-orbit">
                      <circle cx="20" cy="0" r="2" fill={secondaryColor} />
                  </g>
              </g>
          );
      }

      // Boss Crown
      if (type === UnitType.BOSS) {
          return (
              <g transform="translate(0, -10)">
                  <path d="M30 45 L 30 25 L 40 35 L 50 20 L 60 35 L 70 25 L 70 45 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                  <circle cx="50" cy="50" r="6" fill="#ef4444" opacity="0.5" /> {/* Gem? */}
              </g>
          );
      }

      return null;
  };

  const ImpactVisuals = () => {
     if (isDying || !isAttacking) return null;

     // Generic impact pop
     return (
          <path 
            d="M85 30 L95 45 L110 35 L100 50 L115 60 L95 60 L90 75 L85 55 Z" 
            fill="white" 
            fillOpacity="0.8"
            className="animate-impact-pop"
            style={{ animationDelay: `${animationDelay}s` }}
          />
     );
  };
  
  return (
    <svg 
      width={100 * scale} 
      height={100 * scale} 
      viewBox="0 0 100 100" 
      className={`overflow-visible ${animClass}`}
      style={style}
    >
      {/* Selected Indicator */}
      {isSelected && !isDying && (
          <ellipse cx="50" cy="95" rx="25" ry="8" fill="none" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />
      )}

      {/* Main Slime Group - REMOVED FILTER FOR MOBILE PERFORMANCE */}
      <g>
        <SlimeBody />
        {/* Bubbles Rendered Inside Body */}
        <SlimeBubbles />
        <Eyes />
        <Accessories />
      </g>
      
      {/* Boss Shockwave Effect */}
      {isAttacking && !isDying && type === UnitType.BOSS && (
         <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="2" className="animate-shockwave" />
      )}
      
      {/* Magic Effects */}
      {isAttacking && !isDying && type === UnitType.MAGE && (
         <circle cx="80" cy="50" r="8" fill="none" stroke={secondaryColor} strokeWidth="2" className="animate-magic-pulse" />
      )}
      
      <ImpactVisuals />
    </svg>
  );
};