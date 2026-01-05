
import React, { useMemo } from 'react';
import { UnitType, StuckArrow } from '../types';

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
  isSummoning?: boolean;
  isFirebursting?: boolean;
  isRooted?: boolean;
  isBossAbility?: boolean;
  lastAttackTime?: number; 
  stuckArrows?: StuckArrow[];
  style?: React.CSSProperties;
}

export const StickmanRender: React.FC<StickmanProps> = ({ 
  type, 
  color: propColor,
  scale = 1, 
  isPlayer = true,
  isAttacking = false, 
  isMoving = false, 
  isDying = false,
  isSelected = false,
  isMining = false,
  isDepositing = false,
  hasGold = false,
  isSummoning = false,
  isFirebursting = false,
  isRooted = false,
  isBossAbility = false,
  lastAttackTime,
  stuckArrows = [],
  style = {}
}) => {
  const animationDelay = useMemo(() => Math.random() * 1, []);
  
  // -- ANIMATION CLASS SELECTOR --
  let animClass = "";
  if (isDying) {
      // Special death animation for Imperial Knights (Ascension)
      if (type === UnitType.TOXIC) animClass = "animate-knight-death";
      else animClass = "animate-death-puddle";
  } else if (isRooted) {
      animClass = "animate-idle-breathe"; 
  } else if (isSummoning && type === UnitType.MAGE) {
      animClass = "animate-mage-float"; 
  } else if (isAttacking || isMining) {
      if (type === UnitType.TOXIC) animClass = ""; // Knight uses custom SVG transform for attack, no css body wobble
      else if (type === UnitType.ARCHER) animClass = "animate-archer-body"; 
      else if (type === UnitType.BOSS) animClass = "animate-boss-stomp";
      else if (type === UnitType.WORKER && isMining) animClass = ""; // Miner uses custom SVG transform for pickaxe
      else if (type === UnitType.PALADIN) animClass = "animate-paladin-attack"; 
      else animClass = "animate-slime-attack";
  } else if (isMoving || isDepositing) {
      if (type === UnitType.MAGE || type === UnitType.SMALL) animClass = "animate-mage-float";
      else if (type === UnitType.TOXIC) animClass = "animate-idle-breathe"; // Noble march, less bounce
      else if (type === UnitType.ARCHER) animClass = "animate-slime-bounce"; 
      else animClass = "animate-slime-bounce";
  } else {
      if (type === UnitType.MAGE || type === UnitType.SMALL) animClass = "animate-mage-float";
      else animClass = "animate-idle-breathe";
  }

  // Animation overrides for Archer sync
  const animStyle = type === UnitType.ARCHER && isAttacking 
      ? { animationDuration: '2.5s', animationDelay: '0s' } 
      : { animationDelay: isDying ? '0s' : `${animationDelay}s` };
  
  // -- COLORS --
  let baseColor = isPlayer ? "#3b82f6" : "#ef4444"; 
  let secondaryColor = isPlayer ? "#1e40af" : "#991b1b"; 
  let armorColor = "#e2e8f0";
  let armorTrim = "#facc15"; // Gold trim for Imperial

  switch(type) {
      case UnitType.WORKER: // Imperial Miner
          baseColor = isPlayer ? "#3b82f6" : "#ef4444"; // Consistent with Knight but maybe slightly darker or same? Standard team color
          secondaryColor = isPlayer ? "#1e40af" : "#991b1b";
          break;
      case UnitType.TOXIC: // Imperial Knight
          baseColor = isPlayer ? "#2563eb" : "#9f1239"; 
          secondaryColor = isPlayer ? "#1e3a8a" : "#881337"; 
          break;
      case UnitType.ARCHER: // Imperial Archer
          baseColor = isPlayer ? "#047857" : "#7f1d1d"; 
          secondaryColor = isPlayer ? "#064e3b" : "#450a0a"; 
          break;
      case UnitType.PALADIN:
          baseColor = isPlayer ? "#f8fafc" : "#475569"; 
          secondaryColor = isPlayer ? "#94a3b8" : "#1e293b"; 
          break;
      case UnitType.MAGE:
          baseColor = isPlayer ? "#7e22ce" : "#831843"; 
          secondaryColor = isPlayer ? "#581c87" : "#881337";
          break;
      case UnitType.SMALL:
          baseColor = isPlayer ? "#8b5cf6" : "#7c3aed"; 
          secondaryColor = isPlayer ? "#6d28d9" : "#5b21b6";
          break;
      case UnitType.BOSS:
          baseColor = isPlayer ? "#f43f5e" : "#881337"; 
          secondaryColor = isPlayer ? "#9f1239" : "#4c0519";
          break;
  }

  const renderStuckArrows = () => {
      if (!stuckArrows || stuckArrows.length === 0) return null;
      return (
          <g className="pointer-events-none">
              {stuckArrows.map(arrow => (
                  <g key={arrow.id} transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.angle})`}>
                      <line x1="0" y1="0" x2="-18" y2="0" stroke="white" strokeWidth="1.5" strokeLinecap="butt" />
                      <path d="M-18 0 L -22 -3 L -22 3 Z" fill="#facc15" stroke="#a16207" strokeWidth="0.5" />
                      <circle cx="0" cy="0" r="1.5" fill="#333" opacity="0.6" />
                  </g>
              ))}
          </g>
      );
  };

  const renderAccessories = () => {
      // IMPERIAL KNIGHT SLIME (Elite Frontliner)
      if (type === UnitType.TOXIC) {
          return (
              <g>
                  {/* Imperial Silver/Gold Chest Armor */}
                  
                  {/* Rounded Pauldrons (Shoulders) - Fitted to corners of body curve */}
                  <circle cx="22" cy="60" r="7" fill={armorColor} stroke={armorTrim} strokeWidth="1.5" />
                  <circle cx="78" cy="60" r="7" fill={armorColor} stroke={armorTrim} strokeWidth="1.5" />
                  
                  {/* Chest Plate - Fitted wider to cover slime chest */}
                  <path 
                      d="M26 68 Q 50 62 74 68 L 70 88 Q 50 100 30 88 Z" 
                      fill={armorColor} 
                      stroke={armorTrim} 
                      strokeWidth="1.5" 
                  />
                  
                  {/* Imperial Emblem (Diamond) */}
                  <path d="M50 72 L 54 78 L 50 84 L 46 78 Z" fill={armorTrim} />

                  {/* Waist Guard - Fitted to bottom of chest plate */}
                  <path d="M38 90 L 62 90 L 58 96 L 42 96 Z" fill={armorColor} stroke={armorTrim} strokeWidth="1" />

                  {/* Noble Sword - Held Upright or Slashing */}
                  <g 
                    transform={isAttacking ? "rotate(70 85 60)" : "rotate(0 85 60)"} 
                    className={isAttacking ? "animate-sword-slash-fast" : "transition-transform duration-500"}
                    style={{ transformOrigin: "85px 60px" }}
                  >
                      {/* Blade */}
                      <path d="M85 60 L 85 20 L 88 15 L 91 20 L 91 60 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                      {/* Hilt */}
                      <line x1="80" y1="60" x2="96" y2="60" stroke={armorTrim} strokeWidth="3" />
                      <line x1="88" y1="60" x2="88" y2="70" stroke="#78350f" strokeWidth="2" />
                  </g>
                  
                  <style>{`
                    @keyframes swordSlash {
                        0% { transform: rotate(0deg) translate(0,0); }
                        20% { transform: rotate(-20deg) translate(-2px, 2px); }
                        40% { transform: rotate(100deg) translate(5px, -5px); }
                        100% { transform: rotate(0deg) translate(0,0); }
                    }
                    .animate-sword-slash-fast { animation: swordSlash 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28) infinite; }
                  `}</style>
              </g>
          );
      }

      // IMPERIAL MINER KNIGHT (Worker)
      if (type === UnitType.WORKER) {
        return (
             <g>
                 {/* Light Imperial Armor (Worker Class) */}
                 
                 {/* Small Pauldrons */}
                 <circle cx="25" cy="65" r="5" fill={armorColor} stroke={armorTrim} strokeWidth="1" />
                 <circle cx="75" cy="65" r="5" fill={armorColor} stroke={armorTrim} strokeWidth="1" />

                 {/* Small Chest Plate */}
                 <path 
                    d="M35 70 Q 50 68 65 70 L 62 80 Q 50 85 38 80 Z" 
                    fill={armorColor} 
                    stroke={armorTrim} 
                    strokeWidth="1"
                 />
                 
                 {/* Utility Belt (Bronze/Leather) */}
                 <rect x="30" y="82" width="40" height="6" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                 <circle cx="50" cy="85" r="2" fill="#facc15" /> {/* Belt Buckle */}

                 {/* Imperial Pickaxe */}
                 <g 
                    className={isMining ? "animate-pickaxe-swing" : ""}
                    style={{ transformOrigin: "80px 65px" }}
                 >
                     {/* Handle (Bronze/Wood) */}
                     <path d="M75 70 L 90 40" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
                     
                     {/* Head (Silver with Gold Tip) */}
                     {/* Main Pick Head */}
                     <path d="M82 44 L 98 36" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                     {/* Sharp Point (Gold) */}
                     <path d="M78 46 L 82 44" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
                     {/* Back Hammer */}
                     <path d="M98 36 L 102 34" stroke="#94a3b8" strokeWidth="4" strokeLinecap="square" />
                 </g>
                 
                 <style>{`
                    @keyframes pickaxeSwing {
                        0% { transform: rotate(0deg); }
                        25% { transform: rotate(-30deg); } /* Wind up */
                        50% { transform: rotate(45deg); }  /* Strike */
                        75% { transform: rotate(45deg); }  /* Hold strike/Impact */
                        100% { transform: rotate(0deg); }
                    }
                    .animate-pickaxe-swing { animation: pickaxeSwing 1.0s ease-in-out infinite; }
                 `}</style>
             </g>
        );
      }

      // IMPERIAL ARCHER Bow & Quiver
      if (type === UnitType.ARCHER) {
          return (
              <g>
                  {/* Quiver on Back */}
                  <rect x="25" y="55" width="10" height="20" rx="2" transform="rotate(-15 30 65)" fill="#78350f" stroke="#451a03" />
                  <path d="M28 52 L 28 45 M 32 54 L 32 42" stroke="white" strokeWidth="1" />
                  
                  {/* Attached Bow - Side of body */}
                  <g className={isAttacking ? "animate-archer-bow" : ""} transformOrigin="50px 70px" transform="translate(10, 0)">
                      <path d="M65 40 Q 95 70 65 100" fill="none" stroke="#78350f" strokeWidth="3" />
                      <line x1="65" y1="40" x2="65" y2="100" stroke="#fefce8" strokeWidth="0.5" opacity="0.8" />
                      {isAttacking && (
                          <g className="animate-archer-reload">
                              <line x1="35" y1="70" x2="75" y2="70" stroke="white" strokeWidth="2" />
                              <path d="M70 70 L 65 67 L 65 73 Z" fill="#34d399" />
                          </g>
                      )}
                  </g>
              </g>
          );
      }

      // IMPERIAL MAGE - Crystal Core
      if (type === UnitType.MAGE) {
           return (
              <g>
                  {/* Floating Crystal Core instead of generic circle */}
                  <g className="animate-float-damage">
                      <path d="M50 30 L 65 50 L 50 70 L 35 50 Z" fill="#a855f7" stroke="#e9d5ff" strokeWidth="2" opacity="0.9">
                          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                      </path>
                      {/* Aura */}
                      <circle cx="50" cy="50" r="30" fill="url(#mageGlow)" opacity="0.4" className="animate-pulse" />
                  </g>
              </g>
           );
      }

      return null;
  };

  const renderSlimeBody = () => {
    // Standard Slime Shape for most
    if (type === UnitType.BOSS) {
         return <path d="M10 100 C 10 100 10 30 50 30 C 90 30 90 100 90 100 Z" fill={baseColor} stroke={secondaryColor} strokeWidth="4" />;
    }
    // Imperial Knight - Firmer, taller, noble posture
    if (type === UnitType.TOXIC) {
        return (
             <path 
                d="M20 100 L 20 60 Q 20 35 50 35 Q 80 35 80 60 L 80 100 Z" 
                fill={baseColor} 
                stroke={secondaryColor} 
                strokeWidth="3"
                filter="drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.2))" // Subtle aura
            />
        );
    }
    // Imperial Miner - Sturdier, wider base, slightly shorter than Knight
    if (type === UnitType.WORKER) {
        return (
            <path 
                d="M15 100 L 15 65 Q 15 40 50 40 Q 85 40 85 65 L 85 100 Z" 
                fill={baseColor} 
                stroke={secondaryColor} 
                strokeWidth="3"
            />
        );
    }
    return (
      <path 
        d="M15 100 C 15 100 15 40 50 40 C 85 40 85 100 85 100 Z" 
        fill={baseColor} 
        stroke={secondaryColor} 
        strokeWidth="3"
        fillOpacity="0.95"
      />
    );
  };
  
  const renderEyes = () => {
    // Imperial Knight (Frontliner) & Imperial Miner (Worker): Soft Anime Eyes ( ◕ ◕ )
    if (type === UnitType.TOXIC || type === UnitType.WORKER) {
        // Adjust eye position slightly lower for the sturdier miner if needed, 
        // but standard position works well for consistency.
        const yOffset = type === UnitType.WORKER ? 0 : -5;
        
        return (
            <g transform={`translate(0, ${yOffset})`}>
                {/* Left Eye */}
                <ellipse cx="38" cy="55" rx="5" ry="7" fill="black" />
                <circle cx="40" cy="52" r="2.5" fill="white" /> {/* Shine */}
                
                {/* Right Eye */}
                <ellipse cx="62" cy="55" rx="5" ry="7" fill="black" />
                <circle cx="64" cy="52" r="2.5" fill="white" /> {/* Shine */}
            </g>
        );
    }
    // Imperial Archer: Sharp Oval Eyes (● ●)
    if (type === UnitType.ARCHER) {
        return (
            <g transform="translate(0, -5)">
                 <ellipse cx="38" cy="60" rx="4" ry="7" fill="black" stroke="white" strokeWidth="1" />
                 <ellipse cx="62" cy="60" rx="4" ry="7" fill="black" stroke="white" strokeWidth="1" />
            </g>
        )
    }
    // Mage: Glowing round eyes
    if (type === UnitType.MAGE) {
        return (
            <g transform="translate(0, -5)">
                <circle cx="35" cy="60" r="5" fill="#f0abfc" className="animate-pulse" />
                <circle cx="65" cy="60" r="5" fill="#f0abfc" className="animate-pulse" />
            </g>
        )
    }
    // Default Cute Eyes
    return (
        <g className={isAttacking ? "animate-angry-eyes" : ""}>
            <circle cx="35" cy="65" r="6" fill="white" />
            <circle cx="37" cy="65" r="2.5" fill="black" />
            <circle cx="65" cy="65" r="6" fill="white" />
            <circle cx="67" cy="65" r="2.5" fill="black" />
        </g>
    );
  };

  const renderBossEffect = () => {
      if (!isBossAbility) return null;
      return (
         <g>
            <circle cx="50" cy="90" r="10" fill="none" stroke="#f43f5e" strokeWidth="4" className="animate-boss-shockwave" />
            <path d="M50 90 L 50 20" stroke="#f43f5e" strokeWidth="4" className="animate-energy-rise" />
         </g>
      );
  }

  return (
    <svg 
      width={100 * scale} 
      height={100 * scale} 
      viewBox="0 0 100 100" 
      className="overflow-visible"
    >
      <defs>
          <radialGradient id="mageGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
      </defs>

      {!isDying && <ellipse cx="50" cy="100" rx="30" ry="8" fill="rgba(0,0,0,0.3)" />}
      {isSelected && !isDying && <ellipse cx="50" cy="95" rx="35" ry="10" fill="none" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />}
      
      <g className={animClass} style={Object.assign({}, style, animStyle)}>
        {renderSlimeBody()}
        {renderStuckArrows()} 
        {renderEyes()}
        {renderAccessories()}
      </g>
      
      {/* Static/Ground Effects */}
      {isBossAbility && renderBossEffect()}
      {type === UnitType.SMALL && isSummoning && <circle cx="50" cy="100" r="20" stroke="#a855f7" strokeWidth="2" fill="none" className="animate-summon-circle" />}
    </svg>
  );
};
