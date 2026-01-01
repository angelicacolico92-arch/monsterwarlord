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
  color = "#000000", 
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
  
  // -- ANIMATION CLASS SELECTOR --
  let animClass = "";
  if (isDying) {
    switch (type) {
        case UnitType.SLIME: animClass = "animate-death-puddle"; break;
        case UnitType.WORKER: animClass = "animate-death-slump"; break;
        case UnitType.ARCHER: animClass = "animate-death-crumble"; break;
        case UnitType.GARGOYLE: animClass = "animate-death-shatter"; break;
        case UnitType.MAGE: animClass = "animate-death-vanish"; break;
        case UnitType.TITAN: animClass = "animate-death-crash"; break;
        default: animClass = "animate-death-fall-back"; break; // Warrior and others
    }
  } else if (isDepositing) {
    animClass = "animate-worker-deposit";
  } else if (isAttacking || isMining) {
    if (type === UnitType.GARGOYLE) animClass = "animate-gargoyle-attack"; // Specific swooping attack
    else if (type === UnitType.SLIME) animClass = "animate-slime-attack"; // New specific animation
    else if ([UnitType.WARRIOR, UnitType.TITAN].includes(type)) animClass = "animate-attack";
    else if (type === UnitType.WORKER) animClass = "animate-worker-mine";
  } else if (isMoving) {
    if (type === UnitType.SLIME) animClass = "animate-slime-bounce";
    else if (type === UnitType.GARGOYLE) animClass = "animate-gargoyle-fly";
    else animClass = "animate-walk";
  } else {
    // Idle
    if (type === UnitType.SLIME) animClass = "animate-idle-breathe";
    else if (type === UnitType.GARGOYLE || type === UnitType.MAGE) animClass = "animate-idle-float";
    else animClass = "animate-idle-breathe";
  }

  const style = { animationDelay: isDying ? '0s' : `${animationDelay}s` };
  
  // -- COLORS --
  // Player: Green/Nature/Bright
  // Enemy: Red/Dark/Burnt
  let skinColor = isPlayer ? "#4ade80" : "#b91c1c";
  
  // Override for specific types
  if (isPlayer) {
      if (type === UnitType.ARCHER) skinColor = "#e5e5e5";
      if (type === UnitType.MAGE) skinColor = "#a855f7";
      if (type === UnitType.TITAN) skinColor = "#78716c";
      if (type === UnitType.SLIME) skinColor = "#84cc16"; // Lime
      if (type === UnitType.GARGOYLE) skinColor = "#94a3b8"; // Stone
  } else {
      if (type === UnitType.ARCHER) skinColor = "#78716c";
      if (type === UnitType.MAGE) skinColor = "#991b1b";
      if (type === UnitType.TITAN) skinColor = "#57534e";
      if (type === UnitType.SLIME) skinColor = "#4d7c0f"; // Dark Swamp
      if (type === UnitType.GARGOYLE) skinColor = "#44403c"; // Dark Stone
  }

  const secondaryColor = isPlayer ? "#166534" : "#7f1d1d"; // Darker shade
  const metalColor = "#94a3b8";
  
  // -- COMPONENTS --

  const MonsterLegs = () => {
    // Slimes have no legs
    if (type === UnitType.SLIME) return null;
    if (type === UnitType.MAGE) return null; // Robe covers legs
    
    // Gargoyles have clawed feet hanging down
    if (type === UnitType.GARGOYLE) {
        return (
            <g fill={skinColor} stroke={secondaryColor} strokeWidth="1">
               <path d="M40 70 L35 85 L45 80 L50 75 Z" />
               <path d="M60 70 L65 85 L55 80 L50 75 Z" />
            </g>
        );
    }

    if (type === UnitType.ARCHER) {
       // Skeleton Legs
       return (
         <g stroke={skinColor} strokeWidth="4" strokeLinecap="round">
            <line x1="50" y1="65" x2="40" y2="90" />
            <line x1="50" y1="65" x2="60" y2="90" />
         </g>
       );
    }
    // Thick Monster Legs
    return (
       <g fill={skinColor} stroke={secondaryColor} strokeWidth="1">
           <path d="M40 60 L35 90 L45 90 L50 70 Z" />
           <path d="M60 60 L65 90 L55 90 L50 70 Z" />
       </g>
    );
  };

  const MonsterBody = () => {
      if (type === UnitType.SLIME) {
          // Slime: Blob shape
          return (
             <path d="M30 90 Q 20 80 30 60 Q 50 30 70 60 Q 80 80 70 90 Z" fill={skinColor} stroke={secondaryColor} strokeWidth="2" opacity="0.9" />
          );
      }
      if (type === UnitType.GARGOYLE) {
          // Gargoyle: Stone chest, angled
          return <path d="M35 45 L 65 45 L 55 80 L 45 80 Z" fill={skinColor} stroke={secondaryColor} strokeWidth="2" />;
      }
      if (type === UnitType.WORKER) {
          // Goblin: Small, hunchbacked
          return <ellipse cx="50" cy="55" rx="12" ry="15" fill={skinColor} stroke={secondaryColor} strokeWidth="2" />;
      }
      if (type === UnitType.WARRIOR) {
          // Orc: Broad chest
          return <path d="M35 40 Q 50 30 65 40 L 60 70 Q 50 75 40 70 Z" fill={skinColor} stroke={secondaryColor} strokeWidth="2" />;
      }
      if (type === UnitType.ARCHER) {
          // Skeleton: Ribs
          return (
            <g stroke={skinColor} strokeWidth="3" strokeLinecap="round">
                <line x1="50" y1="35" x2="50" y2="65" /> {/* Spine */}
                <line x1="40" y1="42" x2="60" y2="42" />
                <line x1="42" y1="50" x2="58" y2="50" />
                <line x1="45" y1="58" x2="55" y2="58" />
            </g>
          );
      }
      if (type === UnitType.MAGE) {
          // Robe
          return <path d="M40 35 L 60 35 L 70 90 L 30 90 Z" fill={isPlayer ? "#7e22ce" : "#450a0a"} stroke={secondaryColor} strokeWidth="2" />;
      }
      if (type === UnitType.TITAN) {
          // Ogre: Huge belly
          return <circle cx="50" cy="50" r="25" fill={skinColor} stroke={secondaryColor} strokeWidth="3" />;
      }
      return null;
  };

  const MonsterHead = () => {
      // Common Ears for Goblin/Orc
      const Ears = () => (
          <g fill={skinColor}>
             <path d="M35 25 L 25 20 L 35 30 Z" />
             <path d="M65 25 L 75 20 L 65 30 Z" />
          </g>
      );

      if (type === UnitType.SLIME) {
          // Eyes embedded in body
          return (
             <g>
                <circle cx="40" cy="55" r="5" fill="white" />
                <circle cx="40" cy="55" r="2" fill="black" />
                <circle cx="60" cy="55" r="7" fill="white" />
                <circle cx="60" cy="55" r="3" fill="black" />
             </g>
          );
      }
      if (type === UnitType.GARGOYLE) {
          return (
             <g>
                <path d="M30 15 L 40 25 L 35 35 Z" fill={skinColor} /> {/* Ear L */}
                <path d="M70 15 L 60 25 L 65 35 Z" fill={skinColor} /> {/* Ear R */}
                <rect x="40" y="20" width="20" height="20" rx="4" fill={skinColor} stroke={secondaryColor} strokeWidth="2" />
                <path d="M42 22 L 48 30" stroke="black" strokeWidth="1" /> {/* Brow */}
                <path d="M58 22 L 52 30" stroke="black" strokeWidth="1" /> {/* Brow */}
                <circle cx="45" cy="30" r="1.5" fill={isPlayer ? "#3b82f6" : "#ef4444"} className="animate-pulse" />
                <circle cx="55" cy="30" r="1.5" fill={isPlayer ? "#3b82f6" : "#ef4444"} className="animate-pulse" />
             </g>
          );
      }
      if (type === UnitType.WORKER) {
          // Goblin Head
          return (
              <g>
                  <Ears />
                  <circle cx="50" cy="25" r="10" fill={skinColor} stroke={secondaryColor} strokeWidth="2" />
                  <circle cx="47" cy="23" r="1" fill="black" />
                  <circle cx="53" cy="23" r="1" fill="black" />
                  <path d="M48 29 Q 50 31 52 29" stroke="black" strokeWidth="1" fill="none" /> {/* Smile */}
              </g>
          );
      }
      if (type === UnitType.WARRIOR) {
          // Orc Head - Lower Jaw
          return (
            <g>
                <Ears />
                <circle cx="50" cy="22" r="12" fill={skinColor} stroke={secondaryColor} strokeWidth="2" />
                {/* Tusk Jaw */}
                <path d="M42 28 L 44 22 L 46 28 L 54 28 L 56 22 L 58 28 Z" fill="#fefce8" />
                <rect x="42" y="18" width="16" height="4" fill="#333" opacity="0.3" rx="2" /> {/* Brow */}
                <circle cx="46" cy="20" r="1.5" fill="red" />
                <circle cx="54" cy="20" r="1.5" fill="red" />
            </g>
          );
      }
      if (type === UnitType.ARCHER) {
          // Skull
          return (
            <g>
               <circle cx="50" cy="22" r="9" fill={skinColor} stroke="#a3a3a3" strokeWidth="1" />
               <rect x="46" y="28" width="8" height="5" rx="2" fill={skinColor} stroke="#a3a3a3" strokeWidth="1" />
               <circle cx="46" cy="22" r="2.5" fill="#1a1a1a" />
               <circle cx="54" cy="22" r="2.5" fill="#1a1a1a" />
               <path d="M49 26 L 51 26 L 50 24 Z" fill="#1a1a1a" />
            </g>
          );
      }
      if (type === UnitType.MAGE) {
          // Hood
          const hoodColor = isPlayer ? "#581c87" : "#000";
          return (
              <g>
                 <path d="M35 35 L 50 10 L 65 35 Z" fill={hoodColor} stroke={secondaryColor} strokeWidth="2" />
                 <ellipse cx="50" cy="30" rx="8" ry="10" fill="black" />
                 <circle cx="46" cy="30" r="2" fill={isPlayer ? "#60a5fa" : "#ef4444"} className="animate-pulse" />
                 <circle cx="54" cy="30" r="2" fill={isPlayer ? "#60a5fa" : "#ef4444"} className="animate-pulse" />
              </g>
          );
      }
      if (type === UnitType.TITAN) {
           // Small head on big body
           return (
            <g>
                <circle cx="50" cy="20" r="8" fill={skinColor} stroke={secondaryColor} strokeWidth="2" />
                <path d="M46 18 L 54 18" stroke="black" strokeWidth="2" /> {/* Unibrow */}
                <circle cx="48" cy="22" r="1" fill="black" />
                <circle cx="52" cy="22" r="1" fill="black" />
                {/* Horn */}
                <path d="M50 12 L 52 5 L 54 14" fill="#d6d3d1" />
            </g>
           );
      }
      return null;
  };

  const MonsterArms = () => {
      // Similar to Stickman, but styled. Returns grouping for weapon attachment.
      
      const ArmShape = ({x1, y1, x2, y2, width=4}: any) => (
         <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={skinColor} strokeWidth={width} strokeLinecap="round" />
      );

      if (isDepositing && type === UnitType.WORKER) {
          return (
            <>
               <ArmShape x1="50" y1="45" x2="70" y2="55" />
               <ArmShape x1="50" y1="45" x2="65" y2="60" />
            </>
          );
      }
      
      if (type === UnitType.SLIME) return null;

      switch(type) {
        case UnitType.GARGOYLE:
             // Claws
             return (
               <>
                  <ArmShape x1="40" y1="50" x2="25" y2="65" width={5} />
                  <ArmShape x1="60" y1="50" x2="75" y2="65" width={5} />
               </>
             );
        case UnitType.MAGE:
            // Sleeves
            return (
              <>
                 <path d="M40 40 L 20 45 L 25 35 Z" fill={isPlayer ? "#581c87" : "#450a0a"} />
                 <path d="M60 40 L 80 45 L 75 35 Z" fill={isPlayer ? "#581c87" : "#450a0a"} />
              </>
            );
        case UnitType.ARCHER:
            return (
              <>
                 <ArmShape x1="50" y1="40" x2="75" y2="42" width={3} />
                 <ArmShape x1="50" y1="40" x2="35" y2="42" width={3} />
              </>
            );
        case UnitType.WORKER:
            return (
              <>
                 <ArmShape x1="45" y1="45" x2="30" y2="60" />
                 <ArmShape x1="55" y1="45" x2="40" y2="60" />
              </>
            );
        case UnitType.TITAN:
             // Big Arms
             return (
               <>
                  <ArmShape x1="30" y1="45" x2="10" y2="60" width={10} />
                  <ArmShape x1="70" y1="45" x2="90" y2="60" width={10} />
               </>
             );
        default: // Warrior
            return (
              <>
                 <ArmShape x1="40" y1="45" x2="25" y2="55" width={6} />
                 <ArmShape x1="60" y1="45" x2="75" y2="55" width={6} />
              </>
            );
      }
  };

  const Weapon = () => {
    if (isDepositing) return null;
    if (type === UnitType.SLIME || type === UnitType.GARGOYLE) return null;

    switch (type) {
      case UnitType.WORKER: // Pickaxe
        return (
            <g transform="translate(30, 60) rotate(-15)">
                <path d="M0 0 L10 20" stroke="#854d0e" strokeWidth="4" strokeLinecap="round" /> 
                <path d="M-10 5 Q 5 -5 20 5" stroke={metalColor} strokeWidth="4" fill="none" /> 
            </g>
        );
      case UnitType.WARRIOR: // Axe & Shield
        return (
          <>
            {/* Axe */}
            <g transform="translate(80, 50) rotate(15)">
                 <rect x="-2" y="-5" width="4" height="25" fill="#522a07" /> 
                 <path d="M0 5 L 10 0 L 10 15 L 0 10" fill={metalColor} stroke="black" strokeWidth="1" />
                 <path d="M0 5 L -10 0 L -10 15 L 0 10" fill={metalColor} stroke="black" strokeWidth="1" />
            </g>
            {/* Crude Shield */}
            <path d="M20 45 L 40 45 L 35 70 L 25 70 Z" fill="#78350f" stroke="black" strokeWidth="2" />
            <circle cx="30" cy="55" r="3" fill="#fbbf24" />
          </>
        );
      case UnitType.ARCHER: // Bone Bow
        return (
            <g transform="translate(60, 40)">
                 <path d="M0 -25 Q 15 0 0 25" stroke="#fcd34d" strokeWidth="3" fill="none" />
                 <line x1="0" y1="-25" x2="0" y2="25" stroke="#e5e5e5" strokeWidth="1" opacity="0.5" />
            </g>
        );
      case UnitType.MAGE: // Shaman Staff
        return (
           <>
             <line x1="25" y1="35" x2="15" y2="10" stroke="#78350f" strokeWidth="3" />
             {/* Skull on staff */}
             <circle cx="15" cy="10" r="4" fill="#e5e5e5" />
             <circle cx="15" cy="10" r="2" fill={isPlayer ? "#60a5fa" : "#ef4444"} className="animate-pulse" />
           </>
        );
      case UnitType.TITAN: // Log Club
        return (
          <>
             <path d="M85 55 L110 20" stroke="#522a07" strokeWidth="12" strokeLinecap="round" />
             <path d="M100 30 L 105 35" stroke="#3f2e05" strokeWidth="2" />
             <path d="M95 40 L 90 45" stroke="#3f2e05" strokeWidth="2" />
          </>
        );
      default:
        return null;
    }
  };

  const Accessories = () => {
    if (type === UnitType.WORKER) {
        // Sack
        const sackFill = (hasGold || isDepositing) ? "#fbbf24" : "#854d0e";
        return (
            <g>
                 <circle cx="35" cy="45" r="8" fill={sackFill} stroke="black" strokeWidth="1" />
            </g>
        );
    }
    if (type === UnitType.GARGOYLE) {
        // Wings
        const wingColor = isPlayer ? "#cbd5e1" : "#57534e";
        return (
           <g className={isMoving ? "animate-gargoyle-wing-flap" : ""} style={{ transformOrigin: "50px 45px" }}>
              <path d="M35 45 Q 10 20 5 40 L 25 55 Z" fill={wingColor} stroke={secondaryColor} />
              <path d="M65 45 Q 90 20 95 40 L 75 55 Z" fill={wingColor} stroke={secondaryColor} />
           </g>
        );
    }
    return null;
  };

  const ActionGroup: React.FC<{children: React.ReactNode}> = ({ children }) => {
    if (isDying || isDepositing) return <g className={animClass} style={style}>{children}</g>; 

    if (!isAttacking && !isMining) return <>{children}</>;

    let actionAnimClass = "";
    if (type === UnitType.ARCHER) actionAnimClass = "animate-bow-action";
    else if (type === UnitType.MAGE) actionAnimClass = ""; 
    else if (type === UnitType.WORKER) actionAnimClass = "animate-pick-swing";
    // Exclude GARGOYLE from arm swings as its body does the attacking
    else if ([UnitType.WARRIOR, UnitType.TITAN].includes(type)) actionAnimClass = "animate-melee-swing";

    return (
      <g className={actionAnimClass} style={{ transformOrigin: "50px 40px", animationDelay: `${animationDelay}s` }}>
        {children}
      </g>
    );
  };

  // Impact Visuals remain mostly the same but maybe tweaked colors
  const ImpactVisuals = () => {
     if (isDying || (!isAttacking && !isMining)) return null;
     
     if ([UnitType.WARRIOR, UnitType.TITAN, UnitType.GARGOYLE].includes(type)) {
        return (
          <path 
            d="M85 30 L95 45 L110 35 L100 50 L115 60 L95 60 L90 75 L85 55 Z" 
            fill="#fff" 
            fillOpacity="0.8"
            className="animate-impact-pop"
            style={{ animationDelay: `${animationDelay}s` }}
          />
        );
     }
     
     if (type === UnitType.SLIME) {
        return (
          <circle cx="85" cy="55" r="10" fill={skinColor} opacity="0.6" className="animate-impact-pop" />
        );
     }
     
     if (type === UnitType.ARCHER) {
         return (
           <g className="animate-impact-pop" style={{ animationDelay: `${animationDelay}s` }}>
              <line x1="80" y1="40" x2="100" y2="40" stroke="#fefce8" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="105" cy="40" r="3" fill="#fefce8" opacity="0.8" />
           </g>
         );
     }

     if (type === UnitType.MAGE) {
         return (
            <g className="animate-impact-magic-burst" style={{ animationDelay: `${animationDelay}s` }}>
               <circle cx="100" cy="40" r="10" stroke={isPlayer ? "#60a5fa" : "#ef4444"} strokeWidth="2" fill="none" />
               <circle cx="100" cy="40" r="5" fill={isPlayer ? "#60a5fa" : "#ef4444"} opacity="0.5" />
            </g>
         );
     }
     
     if (type === UnitType.WORKER && isMining) {
         return (
            <g className="animate-worker-impact" style={{ animationDelay: `${animationDelay}s`, transformOrigin: "80px 80px" }}>
               <circle cx="75" cy="90" r="2" fill="#fbbf24" /> 
               <circle cx="85" cy="85" r="2.5" fill="#f59e0b" />
               <circle cx="90" cy="92" r="1.5" fill="#fbbf24" />
            </g>
         );
     }

     return null;
  };
  
  // -- RENDER --
  // Use getStanceClass logic inside the main render if possible or keep simple
  const stanceClass = ""; // Monster animations are baked into ActionGroup mostly or Body movement

  return (
    <svg 
      width={100 * scale} 
      height={100 * scale} 
      viewBox="0 0 100 100" 
      className={`overflow-visible ${animClass}`}
      style={style}
    >
      <filter id="dropshadow" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1"/> 
        <feOffset dx="0" dy="1" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>

      {/* Selected Indicator */}
      {isSelected && !isDying && (
          <ellipse cx="50" cy="95" rx="20" ry="5" fill="none" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />
      )}

      {/* Main Monster Group */}
      <g className={stanceClass} style={{ animationDelay: `${animationDelay}s` }} filter="url(#dropshadow)">
        <MonsterLegs />
        <MonsterBody />
        <Accessories />
        <MonsterHead />
        <ActionGroup>
          <MonsterArms />
          <Weapon />
        </ActionGroup>
      </g>
      
      {isAttacking && !isDying && type === UnitType.MAGE && (
         <circle cx="20" cy="10" r="1" fill={isPlayer ? "#60a5fa" : "#ef4444"} stroke="white" strokeWidth="1" className="animate-magic-pulse" style={{ animationDelay: `${animationDelay}s` }} />
      )}
      
      <ImpactVisuals />
    </svg>
  );
};