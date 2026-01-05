
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
      animClass = "animate-death-puddle";
  } else if (isRooted) {
      animClass = "animate-idle-breathe"; 
  } else if (isSummoning && type === UnitType.MAGE) {
      animClass = "animate-mage-float"; 
  } else if (isAttacking || isMining) {
      if (type === UnitType.TOXIC) animClass = "animate-slime-attack"; 
      else if (type === UnitType.ARCHER) animClass = "animate-archer-body"; 
      else if (type === UnitType.BOSS) animClass = "animate-boss-stomp";
      else if (type === UnitType.WORKER && isMining) animClass = "animate-miner-work";
      else if (type === UnitType.PALADIN) animClass = "animate-paladin-attack"; 
      else animClass = "animate-slime-attack";
  } else if (isMoving || isDepositing) {
      if (type === UnitType.MAGE || type === UnitType.SMALL) animClass = "animate-mage-float";
      else if (type === UnitType.ARCHER) animClass = "animate-slime-bounce"; 
      else animClass = "animate-slime-bounce";
  } else {
      if (type === UnitType.MAGE || type === UnitType.SMALL) animClass = "animate-mage-float";
      else if (type === UnitType.ARCHER) animClass = "animate-idle-breathe";
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
      case UnitType.WORKER:
          baseColor = isPlayer ? "#a16207" : "#7f1d1d"; 
          secondaryColor = isPlayer ? "#713f12" : "#450a0a";
          break;
      case UnitType.TOXIC: // Imperial Slime (Frontliner)
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
      // IMPERIAL SLIME (Frontliner) Armor & Sword
      if (type === UnitType.TOXIC) {
          return (
              <g>
                  {/* Imperial Chest Armor with Gold Trim - NOT covering face */}
                  <path 
                      d="M25 75 Q 50 95 75 75 L 75 85 Q 50 105 25 85 Z" 
                      fill={armorColor} 
                      stroke={armorTrim} 
                      strokeWidth="2" 
                  />
                  {/* Attached Sword - Synced with attack */}
                  <g className={isAttacking ? "animate-sword-swing" : ""} transform="translate(10, 10)">
                      <path d="M75 60 L 95 40" stroke="#eab308" strokeWidth="4" />
                      <path d="M88 53 L 98 43 L 102 47" fill="#cbd5e1" stroke="#475569" strokeWidth="1" /> 
                  </g>
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

      // MINER - Pickaxe
      if (type === UnitType.WORKER) {
        return (
             <g className={isMining ? "animate-mining-swing" : ""}>
                 <path d="M65 60 L 85 40" stroke="#78350f" strokeWidth="3" />
                 <path d="M85 40 L 90 35" stroke="#94a3b8" strokeWidth="4" />
                 <path d="M80 35 Q 85 40 95 35" stroke="#94a3b8" strokeWidth="3" fill="none" />
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
    // Imperial Slime (Frontliner): Dash Eyes (— —)
    if (type === UnitType.TOXIC) {
        return (
            <g transform="translate(0, -5)">
                <line x1="30" y1="60" x2="42" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round" />
                <line x1="58" y1="60" x2="70" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round" />
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
