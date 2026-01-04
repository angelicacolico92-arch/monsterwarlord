
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
  isSummoning?: boolean;
  isFirebursting?: boolean;
  isRooted?: boolean;
  isBossAbility?: boolean;
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
  isBossAbility = false
}) => {
  const animationDelay = useMemo(() => Math.random() * 1, []);
  const bubbleDelays = useMemo(() => [Math.random() * 2, Math.random() * 2, Math.random() * 2], []);
  
  // -- ANIMATION CLASS SELECTOR --
  let animClass = "";
  if (isDying) {
      animClass = "animate-death-puddle";
  } else if (isRooted) {
      animClass = "animate-idle-breathe"; 
  } else if (isSummoning && type === UnitType.MAGE) {
      animClass = "animate-mage-float"; 
  } else if (isAttacking || isMining) {
      if (type === UnitType.TOXIC) animClass = "animate-slime-attack"; // Base lunge, weapon anim handles swing
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

  const style = { animationDelay: isDying ? '0s' : `${animationDelay}s` };
  
  // -- COLORS --
  let baseColor = isPlayer ? "#3b82f6" : "#ef4444"; 
  let secondaryColor = isPlayer ? "#1e40af" : "#991b1b"; 
  let hoodColor = isPlayer ? "#2563eb" : "#dc2626";

  switch(type) {
      case UnitType.WORKER:
          baseColor = isPlayer ? "#a16207" : "#7f1d1d"; 
          secondaryColor = isPlayer ? "#713f12" : "#450a0a";
          break;
      case UnitType.TOXIC:
          // Imperial Army Slime: Royal Blue / Deep Red with Gold Accents
          baseColor = isPlayer ? "#2563eb" : "#9f1239"; 
          secondaryColor = isPlayer ? "#1e3a8a" : "#881337"; 
          hoodColor = "#fbbf24"; // Gold Accents for both
          break;
      case UnitType.ARCHER:
          // Imperial Archer: Deep Emerald (Player) vs Dark Crimson (Enemy)
          // Gold Accents for both
          baseColor = isPlayer ? "#059669" : "#991b1b"; 
          secondaryColor = isPlayer ? "#065f46" : "#7f1d1d"; 
          hoodColor = "#fbbf24"; 
          break;
      case UnitType.PALADIN:
          baseColor = isPlayer ? "#f8fafc" : "#475569"; 
          secondaryColor = isPlayer ? "#94a3b8" : "#1e293b"; 
          break;
      case UnitType.MAGE:
          // Imperial Mage: Royal Purple robes, gold trim
          baseColor = isPlayer ? "#7e22ce" : "#831843"; 
          secondaryColor = isPlayer ? "#581c87" : "#881337";
          hoodColor = "#fbbf24"; // Gold Accents
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

  const renderBackAccessories = () => {
      // Cape for Imperial Slime
      if (type === UnitType.TOXIC) {
          return (
              <g transform="translate(0, 0)">
                  <path d="M25 50 Q 15 80 10 95 L 90 95 Q 85 80 75 50" fill={isPlayer ? "#1e40af" : "#7f1d1d"} />
                  <path d="M30 50 L 70 50" stroke={hoodColor} strokeWidth="2" />
              </g>
          );
      }
      // Quiver for Imperial Archer
      if (type === UnitType.ARCHER) {
          return (
              <g transform="translate(0,0)">
                  {/* Quiver body behind */}
                  <path d="M60 40 L 85 90 L 75 95 L 50 45 Z" fill="#4a2c0f" stroke="#271c19" strokeWidth="1" />
                  {/* Arrows fletching peeking out */}
                  <path d="M65 35 L 68 25 L 62 25 Z" fill={hoodColor} />
                  <path d="M72 38 L 75 28 L 69 28 Z" fill={hoodColor} />
              </g>
          );
      }
      // Imperial Mage Cape/Mantle with Enhanced Purple Aura
      if (type === UnitType.MAGE) {
          const auraPrimary = isPlayer ? "#a855f7" : "#c026d3"; // Purple vs Fuchsia
          const auraSecondary = isPlayer ? "#7e22ce" : "#be185d";

          return (
              <g>
                  {/* Arcane Aura */}
                  <defs>
                      <radialGradient id={`aura-${isPlayer ? 'p' : 'e'}`} cx="0.5" cy="0.5" r="0.65">
                          <stop offset="0%" stopColor={auraPrimary} stopOpacity="0.5" />
                          <stop offset="60%" stopColor={auraSecondary} stopOpacity="0.1" />
                          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                      </radialGradient>
                  </defs>
                  
                  {/* Rotating Rune Rings (The "Aura" effect) */}
                  <g className="animate-spin-slow" style={{ transformOrigin: '50px 65px', opacity: 0.7 }}>
                      {/* Outer Ring */}
                      <circle cx="50" cy="65" r="45" stroke={auraPrimary} strokeWidth="1" strokeDasharray="15 10" fill="none" />
                      <circle cx="50" cy="65" r="42" stroke={auraSecondary} strokeWidth="0.5" opacity="0.5" />
                  </g>
                  
                  {/* Inner Counter-Rotating Ring */}
                  <g className="animate-spin-slow" style={{ transformOrigin: '50px 65px', opacity: 0.6, animationDirection: 'reverse', animationDuration: '10s' }}>
                      <circle cx="50" cy="65" r="32" stroke={auraPrimary} strokeWidth="1.5" strokeDasharray="2 8" fill="none" />
                      <rect x="34" y="49" width="32" height="32" stroke={auraSecondary} strokeWidth="0.5" transform="rotate(45 50 65)" opacity="0.4" />
                  </g>

                  {/* Pulsing Aura Field */}
                  <circle cx="50" cy="65" r="50" fill={`url(#aura-${isPlayer ? 'p' : 'e'})`} className="animate-pulse" style={{ animationDuration: '3s' }} />
                  
                  {/* Heavy Royal Cape */}
                  <path 
                    d="M20 50 Q 10 90 15 98 L 85 98 Q 90 90 80 50" 
                    fill={secondaryColor} 
                    stroke={hoodColor}
                    strokeWidth="0.5"
                  />
                  <path d="M20 50 L 80 50" stroke={hoodColor} strokeWidth="1" />
              </g>
          );
      }
      return null;
  };

  const renderSlimeBody = () => {
    if (type === UnitType.MAGE) {
        // Imperial Mage Body (Robed)
        return (
            <g>
                <defs>
                    <radialGradient id={`mageGlow-${isPlayer ? 'p' : 'e'}-${type}`} cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor={isPlayer ? "#a855f7" : "#be123c"} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={baseColor} stopOpacity="1" />
                    </radialGradient>
                </defs>
                
                {/* Main Body */}
                <path 
                    d="M20 95 Q 15 50 30 40 Q 50 20 70 40 Q 85 50 80 95 L 20 95 Z" 
                    fill={`url(#mageGlow-${isPlayer ? 'p' : 'e'}-${type})`} 
                    stroke={secondaryColor} 
                    strokeWidth="2" 
                />

                {/* Imperial Cowl/Hood */}
                <path 
                    d="M25 55 Q 50 25 75 55 L 75 65 Q 50 45 25 65 Z" 
                    fill={baseColor} 
                    stroke={hoodColor} 
                    strokeWidth="1.5" 
                />

                {/* Ceremonial Stole (Sash down front) */}
                <path d="M42 55 L 40 90 L 45 95 L 50 90 L 48 55" fill={isPlayer ? "#4c1d95" : "#881337"} />
                <path d="M52 55 L 50 90 L 55 95 L 60 90 L 58 55" fill={isPlayer ? "#4c1d95" : "#881337"} />
                
                {/* Runes on Stole */}
                <path d="M45 65 L 45 68 M 43 66 L 47 66" stroke={hoodColor} strokeWidth="1" opacity="0.8" />
                <path d="M55 75 L 55 78 M 53 76 L 57 76" stroke={hoodColor} strokeWidth="1" opacity="0.8" />
            </g>
        );
    }

    if (type === UnitType.SMALL) {
        return (
            <g>
                <path d="M15 100 C 15 100 15 40 50 40 C 85 40 85 100 85 100 Z" fill={baseColor} stroke={secondaryColor} strokeWidth="2" opacity="0.8" />
            </g>
        );
    }

    if (type === UnitType.ARCHER) {
        // Imperial Archer Body (Redesigned - Imperial Army Style)
        return (
            <g>
                {/* Body */}
                <path 
                    d="M18 100 L 20 85 Q 15 50 35 45 Q 50 40 65 45 Q 85 50 80 85 L 82 100 Z" 
                    fill={baseColor} 
                    stroke={secondaryColor} 
                    strokeWidth="2" 
                />

                {/* Imperial Armor: Light Scale Mail */}
                <path 
                    d="M25 75 Q 25 55 35 50 Q 50 45 65 50 Q 75 55 75 75 Q 50 85 25 75 Z" 
                    fill="#e2e8f0" 
                    stroke="#475569" 
                    strokeWidth="1" 
                />

                {/* Simulated Scales */}
                <g opacity="0.3">
                    <path d="M30 55 Q 35 60 40 55 T 50 55 T 60 55 T 70 55" stroke="#475569" strokeWidth="1" fill="none" />
                    <path d="M28 65 Q 33 70 38 65 T 48 65 T 58 65 T 68 65 T 75 62" stroke="#475569" strokeWidth="1" fill="none" />
                </g>

                {/* Gold Trim */}
                <path 
                    d="M25 75 Q 25 55 35 50 Q 50 45 65 50 Q 75 55 75 75" 
                    fill="none" 
                    stroke={hoodColor} 
                    strokeWidth="2" 
                />

                {/* Imperial Sash (Matching Toxic Unit) */}
                <path d="M30 52 L 70 72" stroke={hoodColor} strokeWidth="3" opacity="0.9" />
                <rect x="45" y="72" width="10" height="6" rx="1" fill={hoodColor} stroke="#b45309" strokeWidth="1" />

                {/* Arm Bracers */}
                <rect x="75" y="60" width="4" height="12" rx="1" fill="#4b5563" transform="rotate(-5 77 66)" />
                <rect x="21" y="60" width="4" height="12" rx="1" fill="#4b5563" transform="rotate(5 23 66)" />
            </g>
        );
    }

    if (type === UnitType.WORKER) {
        return (
            <g>
                <path 
                    d="M10 100 C 10 100 10 45 50 45 C 90 45 90 100 90 100 Z" 
                    fill={baseColor} 
                    stroke={secondaryColor} 
                    strokeWidth="3"
                />
                <g opacity="0.7">
                    <path d="M30 90 Q 35 80 25 70" stroke="#06b6d4" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M65 95 Q 75 80 80 65" stroke="#06b6d4" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M45 55 L 55 60" stroke="#06b6d4" strokeWidth="2" fill="none" />
                    <circle cx="30" cy="75" r="1.5" fill="#cffafe" className="animate-pulse" />
                    <circle cx="70" cy="85" r="1.5" fill="#cffafe" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                </g>
            </g>
        );
    }

    // IMPERIAL SLIME (Warrior)
    if (type === UnitType.TOXIC) {
        return (
            <g>
                {/* Body: Sturdy, smooth curve */}
                <path 
                    d="M15 100 L 15 90 Q 15 45 50 45 Q 85 45 85 90 L 85 100 Z" 
                    fill={baseColor} 
                    stroke={secondaryColor} 
                    strokeWidth="3"
                />

                {/* Imperial Armor: Diagonal Sash (Officer/Imperial Look) */}
                <path 
                    d="M20 55 Q 35 60 45 70 L 80 95 Q 65 90 55 80 L 20 55 Z" 
                    fill="#e2e8f0" 
                    stroke="#475569" 
                    strokeWidth="1" 
                    opacity="0.9"
                />
                <path d="M30 62 L 65 87" stroke={hoodColor} strokeWidth="2" strokeDasharray="3 2" opacity="0.8" />

                {/* Shoulder Pauldrons (Rounded plates) */}
                <path d="M10 65 Q 10 50 30 55 L 30 70 Q 15 65 10 65 Z" fill={hoodColor} stroke="#b45309" strokeWidth="1" />
                <path d="M90 65 Q 90 50 70 55 L 70 70 Q 85 65 90 65 Z" fill={hoodColor} stroke="#b45309" strokeWidth="1" />
                
                {/* Central Medallion */}
                <circle cx="48" cy="72" r="4" fill={hoodColor} stroke="#b45309" strokeWidth="1" />
            </g>
        );
    }

    if (type === UnitType.PALADIN) {
        return (
            <path 
              d="M15 100 C 15 100 15 40 50 40 C 85 40 85 100 85 100 Z" 
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
  
  const renderSlimeBubbles = () => {
      if (type === UnitType.WORKER) {
          return (
              <g className="pointer-events-none">
                  <circle cx="20" cy="95" r="2" fill="#78350f" opacity="0.6" className="animate-dust" style={{ animationDelay: '0.2s', transformOrigin: '20px 95px' }} />
                  <circle cx="80" cy="95" r="3" fill="#78350f" opacity="0.5" className="animate-dust" style={{ animationDelay: '0.7s', transformOrigin: '80px 95px' }} />
                  {isMoving && <circle cx="50" cy="98" r="4" fill="#a16207" opacity="0.4" className="animate-dust" style={{ animationDelay: '0s', transformOrigin: '50px 98px' }} />}
              </g>
          );
      }
      
      if (type === UnitType.PALADIN) {
          return (
              <g className="pointer-events-none">
                  <circle cx="50" cy="90" r="1" fill="#fef08a" className="animate-sparkle" />
                  <path d="M40 80 L 42 75 L 44 80 L 42 85 Z" fill="#fef08a" opacity="0.6" className="animate-pulse" />
              </g>
          );
      }

      if (type === UnitType.TOXIC || type === UnitType.ARCHER) {
          return (
              <g className="pointer-events-none">
                  {isMoving && <circle cx="30" cy="98" r="2" fill="#9ca3af" opacity="0.4" className="animate-dust" />}
              </g>
          );
      }
      
      if (type === UnitType.MAGE) {
          return (
              <g className="pointer-events-none">
                  <circle cx="20" cy="90" r="1" fill={hoodColor} className="animate-sparkle" />
                  <circle cx="80" cy="95" r="1.5" fill={hoodColor} className="animate-sparkle" style={{ animationDelay: '0.3s' }} />
              </g>
          );
      }
      
      return (
        <g opacity="0.4" className="pointer-events-none">
            <circle cx="40" cy="90" r="3" fill="white" className="animate-bubble-rise" style={{ animationDelay: `${bubbleDelays[0]}s` }} />
            <circle cx="60" cy="85" r="2" fill="white" className="animate-bubble-rise" style={{ animationDelay: `${bubbleDelays[1]}s`, animationDuration: '2.5s' }} />
            <circle cx="50" cy="80" r="2.5" fill="white" className="animate-bubble-rise" style={{ animationDelay: `${bubbleDelays[2]}s`, animationDuration: '3s' }} />
        </g>
      );
  };

  const renderEyes = () => {
     if (type === UnitType.WORKER) {
         return (
             <g>
                 <path d="M10 60 H 90" stroke="#27272a" strokeWidth="4" opacity="0.9" />
                 <circle cx="35" cy="62" r="7" fill="#0e7490" stroke="#3f3f46" strokeWidth="2.5" />
                 <circle cx="35" cy="62" r="3" fill="#67e8f9" opacity="0.6" /> 
                 <circle cx="37" cy="60" r="1.5" fill="white" opacity="0.9" /> 
                 <circle cx="65" cy="62" r="7" fill="#0e7490" stroke="#3f3f46" strokeWidth="2.5" />
                 <circle cx="65" cy="62" r="3" fill="#67e8f9" opacity="0.6" />
                 <circle cx="67" cy="60" r="1.5" fill="white" opacity="0.9" />
                 <path d="M42 62 L 58 62" stroke="#3f3f46" strokeWidth="2" />
             </g>
         );
     }

     if (type === UnitType.BOSS) {
         return (
             <g>
                 <path d="M35 55 L 45 60" stroke="white" strokeWidth="3" />
                 <path d="M65 55 L 55 60" stroke="white" strokeWidth="3" />
                 <circle cx="40" cy="65" r="3" fill="white" />
                 <circle cx="60" cy="65" r="3" fill="white" />
             </g>
         );
     }
     
     if (type === UnitType.PALADIN) return null;

     if (type === UnitType.TOXIC) { 
         // Cute Dash Eyes (— —)
         return (
             <g>
                <path d="M36 60 H 44" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M56 60 H 64" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                {/* Minimal blush */}
                <circle cx="34" cy="66" r="2" fill={isPlayer ? "#93c5fd" : "#fca5a5"} opacity="0.6" />
                <circle cx="66" cy="66" r="2" fill={isPlayer ? "#93c5fd" : "#fca5a5"} opacity="0.6" />
             </g>
         );
     }
     
     if (type === UnitType.ARCHER) {
         // Imperial Archer: Full Imperial Galea Helm
         return (
             <g>
                 {/* Helmet Dome */}
                 <path d="M25 50 Q 50 25 75 50" fill={hoodColor} stroke="#b45309" strokeWidth="1.5" />
                 
                 {/* Cheek Guards */}
                 <path d="M25 50 L 25 68 Q 35 75 40 68" fill={hoodColor} stroke="#b45309" strokeWidth="1" />
                 <path d="M75 50 L 75 68 Q 65 75 60 68" fill={hoodColor} stroke="#b45309" strokeWidth="1" />

                 {/* Brow Guard */}
                 <path d="M22 50 Q 50 45 78 50" fill="none" stroke="#b45309" strokeWidth="2" />
                 
                 {/* Nose Guard */}
                 <path d="M50 48 L 50 60" stroke={hoodColor} strokeWidth="3" />
                 <path d="M50 48 L 50 60" stroke="#b45309" strokeWidth="1" />

                 {/* Eyes (Visible through helm) */}
                 <path d="M32 58 L 44 58 L 42 61 L 34 61 Z" fill="white" />
                 <path d="M68 58 L 56 58 L 58 61 L 66 61 Z" fill="white" />
                 
                 {/* Crest (Smaller than Toxic) */}
                 <path d="M40 30 Q 50 25 60 30 L 50 45 Z" fill={secondaryColor} />
             </g>
         );
     }

     if (type === UnitType.MAGE) {
         // Glowing Round Eyes (Wise) - Partially obscured by hood
         return (
             <g>
                 <circle cx="38" cy="62" r="3" fill="#ecfeff" />
                 <circle cx="38" cy="62" r="5" fill="#a5f3fc" opacity="0.3" filter="blur(1px)" className="animate-pulse" />
                 
                 <circle cx="62" cy="62" r="3" fill="#ecfeff" />
                 <circle cx="62" cy="62" r="5" fill="#a5f3fc" opacity="0.3" filter="blur(1px)" className="animate-pulse" />
                 
                 {/* Hood Shadow over eyes */}
                 <path d="M25 55 Q 50 65 75 55" fill="none" stroke="black" strokeWidth="2" opacity="0.2" filter="blur(2px)" />
             </g>
         );
     }

     if (type === UnitType.SMALL) {
         return (
             <g>
                 <path d="M35 58 L 35 62" stroke="white" strokeWidth="1.5" opacity="0.8" />
                 <path d="M65 58 L 65 62" stroke="white" strokeWidth="1.5" opacity="0.8" />
                 <circle cx="35" cy="60" r="3" fill="white" className="animate-pulse" />
                 <circle cx="65" cy="60" r="3" fill="white" className="animate-pulse" />
             </g>
         );
     }
     return (
         <g>
             <circle cx="35" cy="60" r="4" fill="white" />
             <circle cx="35" cy="60" r="2" fill="black" />
             <circle cx="65" cy="60" r="4" fill="white" />
             <circle cx="65" cy="60" r="2" fill="black" />
         </g>
     );
  };

  const renderAccessories = () => {
      if (type === UnitType.WORKER) {
          return (
              <g>
                  <g transform="translate(0, -2)">
                      <path d="M25 45 Q 50 25 75 45" fill="#facc15" stroke="#854d0e" strokeWidth="2" />
                      <path d="M20 45 L 80 45 L 80 50 L 20 50 Z" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />
                      <g transform="translate(42, 30)">
                          <rect x="0" y="0" width="16" height="12" rx="2" fill="#4b5563" stroke="#1f2937" strokeWidth="1" />
                          <circle cx="8" cy="6" r="4" fill="#fef08a" className="animate-pulse" />
                          {(isMining || isMoving) && (
                              <path d="M8 6 L -20 100 L 36 100 Z" fill="url(#lampBeam)" opacity="0.2" className="animate-pulse" style={{ pointerEvents: 'none' }} />
                          )}
                      </g>
                  </g>
                  
                  {/* Pickaxe: Anchored more naturally to prevent 'floating' */}
                  <g 
                    transform={isMining ? "translate(72, 70)" : "translate(72, 60)"} 
                    className={isMining ? "animate-mining-swing" : (isMoving ? "animate-slime-bounce" : "")}
                    style={{ transformOrigin: '0 0' }}
                  >
                      {/* Handle */}
                      <path d="M0 0 L 0 -30" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
                      
                      {/* Metal Head */}
                      <path d="M-12 -30 Q 0 -35 12 -30 L 14 -27 L 0 -29 L -14 -27 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                      
                      {/* Tips */}
                      <path d="M-14 -27 L -18 -23 L -12 -25 Z" fill="#cbd5e1" />
                      <path d="M14 -27 L 18 -23 L 12 -25 Z" fill="#cbd5e1" />
                  </g>

                  {(hasGold || isDepositing) && (
                      <g transform="translate(50, 25)" className="animate-bounce">
                          <path d="M0 -15 L 10 -5 L 0 5 L -10 -5 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="1.5" />
                          <path d="M0 -15 L 0 5" stroke="#ecfeff" strokeWidth="0.5" opacity="0.6" />
                          <path d="M-10 -5 L 10 -5" stroke="#ecfeff" strokeWidth="0.5" opacity="0.6" />
                          <circle cx="0" cy="-5" r="12" fill="#67e8f9" opacity="0.3" filter="blur(4px)" />
                      </g>
                  )}
                  {isMining && (
                      <g transform="translate(90, 90)">
                          <circle cx="0" cy="0" r="2" fill="#fff" className="animate-sparkle" />
                          <circle cx="5" cy="-5" r="1" fill="#cffafe" className="animate-sparkle" style={{ animationDelay: '0.1s' }} />
                          <path d="M0 0 L 10 5" stroke="#fff" strokeWidth="1" opacity="0.8" className="animate-sparkle" />
                      </g>
                  )}
              </g>
          );
      }

      if (type === UnitType.TOXIC) {
          return (
              <g>
                  {/* Imperial Galea (Crest) - Plume style */}
                  <path d="M25 40 Q 50 20 75 40" fill="none" stroke={hoodColor} strokeWidth="4" strokeLinecap="round" />
                  {/* Bristles */}
                  <g stroke={isPlayer ? "#fbbf24" : "#f87171"} strokeWidth="2">
                      <line x1="30" y1="38" x2="30" y2="25" />
                      <line x1="40" y1="34" x2="40" y2="22" />
                      <line x1="50" y1="32" x2="50" y2="20" />
                      <line x1="60" y1="34" x2="60" y2="22" />
                      <line x1="70" y1="38" x2="70" y2="25" />
                  </g>
                  
                  {/* Weapon: Imperial Short Sword */}
                  {/* Anchor moved to (68, 72) to fix floating */}
                  <g 
                    transform={isAttacking ? "translate(68, 72) rotate(60)" : "translate(68, 72) rotate(-15)"}
                    className={isAttacking ? "animate-sword-swing" : ""}
                    style={{ transformOrigin: '0 0' }}
                  >
                      {/* Clean blade */}
                      <path 
                        d="M0 0 L 0 -35 L 5 -40 L 10 -35 L 10 0 Z" 
                        fill="#cbd5e1" 
                        stroke="#475569" 
                        strokeWidth="1" 
                      />
                      {/* Crossguard */}
                      <rect x="-6" y="0" width="22" height="4" rx="1" fill={hoodColor} stroke="#b45309" strokeWidth="0.5" />
                      {/* Handle */}
                      <rect x="2" y="4" width="6" height="10" rx="2" fill="#4a2c0f" />
                      {/* Pommel */}
                      <circle cx="5" cy="14" r="2.5" fill={hoodColor} />
                  </g>
              </g>
          );
      }

      if (type === UnitType.ARCHER) {
          return (
             <g>
                  {/* Imperial Bow */}
                  <g transform="translate(60, 60)">
                      <g className={isAttacking ? "animate-archer-bow" : ""} style={{ transformOrigin: 'center' }}>
                          {/* Reinforced Riser */}
                          <path d="M0 -15 L 0 15" stroke={hoodColor} strokeWidth="3" />
                          
                          {/* Limbs */}
                          <path d="M0 -15 Q 20 -25 5 -40" stroke="#3f2e18" strokeWidth="3" fill="none" strokeLinecap="round" />
                          <path d="M0 15 Q 20 25 5 40" stroke="#3f2e18" strokeWidth="3" fill="none" strokeLinecap="round" />
                          
                          {/* Gold Accents on tips */}
                          <circle cx="5" cy="-40" r="2" fill={hoodColor} />
                          <circle cx="5" cy="40" r="2" fill={hoodColor} />

                          {/* String */}
                          <line x1="5" y1="-40" x2="5" y2="40" stroke="white" strokeWidth="0.5" opacity="0.5" />
                          
                          {isAttacking && (
                              <g className="animate-archer-reload">
                                  {/* Arrow Shaft */}
                                  <line x1="-20" y1="0" x2="15" y2="0" stroke="#dcfce7" strokeWidth="1.5" />
                                  {/* Emerald Tip */}
                                  <path d="M15 0 L 10 -3 L 10 3 Z" fill="#10b981" />
                                  {/* Fletching */}
                                  <path d="M-20 0 L -25 -3 L -25 3 Z" fill={hoodColor} />
                              </g>
                          )}
                      </g>
                  </g>
             </g>
          );
      }

      if (type === UnitType.PALADIN) {
          const accentColor = isPlayer ? "#fbbf24" : "#dc2626"; 
          const isIdle = !isAttacking && !isMoving && !isDying;
          
          return (
              <g>
                  <circle cx="50" cy="70" r="35" fill={isPlayer ? "#fef08a" : "#7f1d1d"} opacity="0.2" filter="blur(5px)" className="animate-pulse" />

                  <g 
                     transform={isAttacking ? "translate(25, 60) rotate(-45)" : "translate(20, 70) rotate(-10)"} 
                     className={isAttacking ? "animate-sword-swing" : ""} 
                     style={{ transformOrigin: '25px 80px' }}
                  >
                      <path d="M0 0 L 0 -30 L 4 -35 L 8 -30 L 8 0 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                      <line x1="4" y1="-30" x2="4" y2="0" stroke="#cbd5e1" strokeWidth="1" />
                      <rect x="-4" y="0" width="16" height="3" fill={accentColor} stroke="#000" strokeWidth="0.5" />
                      <circle cx="4" cy="5" r="2.5" fill={accentColor} stroke="#000" strokeWidth="0.5" />
                      {isAttacking && (
                          <path d="M-10 -40 Q 20 -60 50 -40" stroke="#fff" strokeWidth="2" fill="none" opacity="0.6" className="animate-sparkle" />
                      )}
                  </g>

                  <path d="M40 25 Q 50 15 60 25" stroke={accentColor} strokeWidth="4" fill="none" />

                  <g transform="translate(0, 0)">
                      <path d="M25 60 Q 50 70 75 60 L 75 85 Q 50 95 25 85 Z" fill={baseColor} stroke={secondaryColor} strokeWidth="2" />
                      <path d="M50 65 L 50 85 M 40 70 L 60 70" stroke={accentColor} strokeWidth="2" opacity="0.8" />
                  </g>

                  <g transform="translate(0, -5)">
                      <path d="M25 45 Q 50 20 75 45 L 75 60 L 25 60 Z" fill={baseColor} stroke={secondaryColor} strokeWidth="2" />
                      <rect x="25" y="45" width="50" height="6" fill="#1e293b" />
                      <circle cx="35" cy="48" r="1.5" fill={isPlayer ? "#38bdf8" : "#ef4444"} className="animate-pulse" />
                      <circle cx="65" cy="48" r="1.5" fill={isPlayer ? "#38bdf8" : "#ef4444"} className="animate-pulse" />
                  </g>

                  <g 
                    transform={isAttacking ? "translate(75, 75) rotate(10)" : "translate(75, 70)"}
                    className={isIdle ? "animate-paladin-shield" : ""}
                    style={{ transformOrigin: '75px 75px' }}
                  >
                     <path d="M-15 -15 L 15 -15 L 15 15 Q 0 35 -15 15 Z" fill={baseColor} stroke={secondaryColor} strokeWidth="2" />
                     <path d="M-12 -12 L 12 -12 L 12 12 Q 0 28 -12 12 Z" stroke={accentColor} strokeWidth="2" fill="none" />
                     <circle cx="0" cy="0" r="4" fill={accentColor} />
                     <path d="M-8 0 L 8 0 M 0 -8 L 0 8" stroke={secondaryColor} strokeWidth="1" opacity="0.5" />
                     <circle cx="0" cy="0" r="15" fill={isPlayer ? "#e0f2fe" : "#fecaca"} opacity="0.0" className="animate-pulse">
                         <animate attributeName="opacity" values="0;0.3;0" dur="2s" repeatCount="indefinite" />
                     </circle>
                  </g>
              </g>
          );
      }

      if (type === UnitType.MAGE) {
          // Imperial Mage: Imperial Staff
          const staffAngle = isAttacking ? 30 : -10;
          return (
              <g>
                  {/* Imperial Greatstaff */}
                  <g 
                    transform={isAttacking ? "translate(82, 60) rotate(20)" : "translate(82, 65) rotate(-5)"} 
                    className={isAttacking ? "" : "animate-mage-float"} 
                    style={{ transformOrigin: 'center' }}
                  >
                      {/* Shaft */}
                      <rect x="-2" y="-35" width="4" height="60" fill="#4a2c0f" rx="1" />
                      
                      {/* Head Setting */}
                      <path d="M-6 -35 L 6 -35 L 8 -45 L -8 -45 Z" fill={hoodColor} stroke="#b45309" strokeWidth="1" />
                      <path d="M-8 -45 L 0 -55 L 8 -45" fill="none" stroke={hoodColor} strokeWidth="2" />
                      
                      {/* Floating Core */}
                      <circle cx="0" cy="-48" r="5" fill="white" className="animate-pulse" filter="blur(1px)" />
                      <circle cx="0" cy="-48" r="3" fill={isPlayer ? "#a855f7" : "#f43f5e"} />
                      
                      {/* Orbiting particles */}
                      {isAttacking && (
                          <g className="animate-spin" style={{ transformOrigin: '0px -48px', animationDuration: '1s' }}>
                              <circle cx="10" cy="-48" r="2" fill={hoodColor} />
                              <circle cx="-10" cy="-48" r="2" fill={hoodColor} />
                          </g>
                      )}
                  </g>
                  
                  {isFirebursting && (
                      <g className="animate-fireburst" pointerEvents="none">
                          <circle cx="50" cy="75" r="45" fill={isPlayer ? "#9333ea" : "#9f1239"} opacity="0.3" filter="blur(5px)" className="animate-pulse" />
                          <path d="M50 75 L 60 40 L 40 40 Z" fill={hoodColor} opacity="0.5" className="animate-ping" />
                      </g>
                  )}
                  {isSummoning && (
                      // Imperial Summon Circle
                      <g className="animate-summon-circle" style={{ transformOrigin: '50px 95px' }}>
                          <ellipse cx="50" cy="95" rx="35" ry="10" fill="none" stroke={hoodColor} strokeWidth="1.5" />
                          <rect x="35" y="90" width="30" height="10" fill="none" stroke={hoodColor} strokeWidth="0.5" transform="rotate(45 50 95)" />
                          <rect x="35" y="90" width="30" height="10" fill="none" stroke={hoodColor} strokeWidth="0.5" transform="rotate(-45 50 95)" />
                      </g>
                  )}
                  {isSummoning && (
                      <g>
                          <circle cx="50" cy="95" r="2" fill="#fff" className="animate-energy-rise" />
                          <circle cx="40" cy="95" r="1.5" fill="#fff" className="animate-energy-rise" style={{ animationDelay: '0.2s' }} />
                          <circle cx="60" cy="95" r="1.5" fill="#fff" className="animate-energy-rise" style={{ animationDelay: '0.4s' }} />
                      </g>
                  )}
              </g>
          );
      }

      if (type === UnitType.BOSS) {
          return (
              <g transform="translate(0, -10)">
                  <path d="M30 45 L 30 25 L 40 35 L 50 20 L 60 35 L 70 25 L 70 45 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                  <circle cx="50" cy="50" r="6" fill="#ef4444" opacity="0.5" /> 
              </g>
          );
      }

      return null;
  };

  const renderImpactVisuals = () => {
     if (isDying || !isAttacking) return null;

     if (type === UnitType.ARCHER) {
         return (
             <g className="animate-impact-pop" style={{ animationDelay: `${animationDelay}s` }}>
                 <circle cx="100" cy="50" r="5" fill="#10b981" opacity="0.8" />
                 <path d="M100 50 L 90 40" stroke="#10b981" strokeWidth="2" />
                 <path d="M100 50 L 110 40" stroke="#10b981" strokeWidth="2" />
                 <path d="M100 50 L 100 35" stroke="#10b981" strokeWidth="2" />
                 <circle cx="90" cy="40" r="2" fill="#34d399" />
                 <circle cx="110" cy="40" r="2" fill="#34d399" />
             </g>
         );
     }

     if (type === UnitType.TOXIC || type === UnitType.PALADIN) {
         const isPaladin = type === UnitType.PALADIN;
         return (
             <g className="animate-impact-pop" style={{ animationDelay: `${animationDelay}s` }}>
                 <path d="M85 30 Q 110 50 85 70" stroke="white" strokeWidth="3" fill="none" opacity="0.8">
                     <animate attributeName="opacity" values="1;0" dur="0.3s" fill="freeze" />
                     <animate attributeName="stroke-width" values="4;0" dur="0.3s" fill="freeze" />
                 </path>
                 <path d="M90 35 Q 115 55 90 75" stroke={isPaladin ? "#fef08a" : "#cbd5e1"} strokeWidth="2" fill="none" opacity="0.6">
                     <animate attributeName="opacity" values="0.6;0" dur="0.3s" fill="freeze" />
                 </path>
                 <circle cx="100" cy="50" r="4" fill={isPaladin ? "#facc15" : "#ef4444"} opacity="0.6" />
                 <path d="M100 50 L 110 40" stroke={isPaladin ? "#facc15" : "#ef4444"} strokeWidth="2" />
             </g>
         );
     }

     if (type === UnitType.MAGE || type === UnitType.SMALL) {
        return (
            <g style={{ animationDelay: `${animationDelay}s` }}>
                <circle cx="100" cy="50" r="10" fill="none" stroke={hoodColor} strokeWidth="2" opacity="0">
                    <animate attributeName="r" values="5;25" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="stroke-width" values="3;0" dur="0.8s" repeatCount="indefinite" />
                </circle>
                <path d="M100 35 L105 45 L115 45 L108 52 L110 62 L100 55 L90 62 L92 52 L85 45 L95 45 Z" fill={isPlayer ? "#e9d5ff" : "#fda4af"} opacity="0.8">
                     <animateTransform attributeName="transform" type="scale" values="0.8;1.2;0.8" dur="0.8s" repeatCount="indefinite" additive="sum" />
                     <animateTransform attributeName="transform" type="rotate" from="0 100 50" to="360 100 50" dur="3s" repeatCount="indefinite" additive="sum" />
                </path>
                <circle cx="100" cy="50" r="15" fill={hoodColor} opacity="0.3" className="animate-pulse" />
            </g>
        );
     }

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
  
  const renderSummonEffect = () => {
    if (type !== UnitType.SMALL) return null;

    return (
        <g pointerEvents="none">
             <defs>
                 <radialGradient id="summonGlow" cx="0.5" cy="0.5" r="0.5">
                     <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.9" />
                     <stop offset="60%" stopColor="#a855f7" stopOpacity="0.4" />
                     <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                 </radialGradient>
             </defs>
             <ellipse cx="50" cy="90" rx="0" ry="0" fill="none" stroke="#d8b4fe" strokeWidth="3" opacity="1">
                 <animate attributeName="rx" from="0" to="35" dur="0.6s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.1 0.8 0.2 1" />
                 <animate attributeName="ry" from="0" to="12" dur="0.6s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.1 0.8 0.2 1" />
                 <animate attributeName="opacity" values="1;0" dur="0.8s" begin="0s" fill="freeze" />
                 <animate attributeName="stroke-width" values="3;0" dur="0.8s" begin="0s" fill="freeze" />
             </ellipse>
             <path d="M45 90 L 55 90 L 50 90 Z" fill="url(#summonGlow)" opacity="0">
                 <animate attributeName="d" values="M45 90 L 55 90 L 50 90 Z; M30 90 L 70 90 L 50 5 Z" dur="0.4s" begin="0s" fill="freeze" />
                 <animate attributeName="opacity" values="0;1;0" dur="0.7s" begin="0s" fill="freeze" />
             </path>
             <g transform="translate(50, 50)">
                 <circle cx="0" cy="0" r="0" fill="white" opacity="0.8">
                      <animate attributeName="r" values="0;25" dur="0.5s" begin="0.1s" fill="freeze" />
                      <animate attributeName="opacity" values="0.8;0" dur="0.5s" begin="0.1s" fill="freeze" />
                 </circle>
             </g>
        </g>
    );
  };
  
  const renderRootVisuals = () => {
      if (!isRooted) return null;
      return (
          <g className="animate-pulse" style={{ pointerEvents: 'none' }}>
              <path d="M20 95 Q 35 70 50 85 Q 65 70 80 95" stroke="#a855f7" strokeWidth="4" fill="none" opacity="0.9" /> 
              <path d="M30 100 Q 40 60 50 75 Q 60 60 70 100" stroke="#9333ea" strokeWidth="4" fill="none" opacity="0.9" /> 
              <ellipse cx="50" cy="85" rx="30" ry="10" stroke="#d8b4fe" strokeWidth="2" fill="none" opacity="0.8" strokeDasharray="5 5" />
              <circle cx="30" cy="80" r="3" fill="#e9d5ff" className="animate-ping" style={{ animationDuration: '2s' }} />
              <circle cx="70" cy="80" r="3" fill="#e9d5ff" className="animate-ping" style={{ animationDuration: '1.5s' }} />
          </g>
      );
  };

  const renderBossAbilityVisuals = () => {
      if (!isBossAbility) return null;
      return (
          <g className="pointer-events-none" style={{ transformOrigin: '50px 90px' }}>
              <defs>
                  <radialGradient id="bossExplosionGrad" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="30%" stopColor="#fcd34d" stopOpacity="0.95" />
                      <stop offset="60%" stopColor="#f97316" stopOpacity="0.85" />
                      <stop offset="85%" stopColor="#dc2626" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                  </radialGradient>
              </defs>
              <circle cx="50" cy="90" r="0" fill="white" className="animate-boss-flash" />
              <circle cx="50" cy="90" r="10" fill="none" stroke="#fbbf24" strokeWidth="4" className="animate-boss-shockwave" />
              <circle cx="50" cy="90" r="0" fill="url(#bossExplosionGrad)" className="animate-boss-explosion" />
              {[...Array(12)].map((_, i) => (
                  <circle key={i} cx="50" cy="90" r={3 + Math.random() * 3} fill={Math.random() > 0.5 ? "#fbbf24" : "#ef4444"} className="animate-ember" style={{ 
                      '--angle': `${i * 30}deg`, 
                      '--dist': `${100 + Math.random() * 60}px`, 
                      animationDelay: `${Math.random() * 0.1}s`
                  } as any} />
              ))}
              <g opacity="0.6">
                  <path d="M50 90 L 30 100" stroke="#78350f" strokeWidth="2" className="animate-pulse" />
                  <path d="M50 90 L 70 100" stroke="#78350f" strokeWidth="2" className="animate-pulse" />
                  <path d="M50 90 L 50 110" stroke="#78350f" strokeWidth="2" className="animate-pulse" />
              </g>
          </g>
      );
  };

  return (
    <svg 
      width={100 * scale} 
      height={100 * scale} 
      viewBox="0 0 100 100" 
      className="overflow-visible"
    >
      <defs>
          <style>{`
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            
            @keyframes summon-circle { 0% { opacity: 0; transform: scale(0.5) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(180deg); } 100% { opacity: 0; transform: scale(0.5) rotate(360deg); } }
            .animate-summon-circle { animation: summon-circle 1s ease-in-out; }
            
            @keyframes fireburst-pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
            .animate-fireburst { animation: fireburst-pulse 1s ease-out forwards; transform-origin: 50px 75px; }
            
            @keyframes energy-rise { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
            .animate-energy-rise { animation: energy-rise 0.8s ease-out; }

            /* Updated Sword Swing for Imperial Slime - Closer to body */
            @keyframes sword-swing {
                0% { transform: translate(68px, 72px) rotate(-15deg); } /* Closer to body */
                30% { transform: translate(65px, 65px) rotate(-50deg); } /* Windup back */
                60% { transform: translate(75px, 75px) rotate(100deg); } /* Swing forward */
                100% { transform: translate(68px, 72px) rotate(-15deg); }
            }
            .animate-sword-swing { animation: sword-swing 0.4s ease-in-out; transform-origin: 0 0; }

            @keyframes boss-shockwave {
                0% { r: 10; opacity: 1; stroke-width: 6; }
                100% { r: 200; opacity: 0; stroke-width: 0; }
            }
            .animate-boss-shockwave { animation: boss-shockwave 0.8s ease-out forwards; }

            @keyframes boss-explosion {
                0% { r: 0; opacity: 1; }
                20% { r: 120; opacity: 0.95; }
                100% { r: 140; opacity: 0; }
            }
            .animate-boss-explosion { animation: boss-explosion 0.8s ease-out forwards; }

            @keyframes boss-flash {
                0% { opacity: 1; r: 10; }
                100% { opacity: 0; r: 200; }
            }
            .animate-boss-flash { animation: boss-flash 0.3s ease-out forwards; }

            @keyframes ember-fly {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                100% { transform: rotate(var(--angle)) translate(var(--dist)) scale(0); opacity: 0; }
            }
            .animate-ember { animation: ember-fly 0.8s ease-out forwards; transform-origin: 50px 90px; }

            @keyframes mining-swing {
                0% { transform: translate(72px, 70px) rotate(0deg); }
                30% { transform: translate(72px, 65px) rotate(-45deg); } 
                60% { transform: translate(72px, 80px) rotate(60deg); } 
                70% { transform: translate(72px, 75px) rotate(55deg); } 
                100% { transform: translate(72px, 70px) rotate(0deg); }
            }
            .animate-mining-swing { animation: mining-swing 0.8s ease-in-out infinite; }

            @keyframes miner-work {
                0%, 100% { transform: scale(1, 1); }
                50% { transform: scale(1.1, 0.9) translateY(2px); }
            }
            .animate-miner-work { transform-origin: bottom center; animation: miner-work 0.8s ease-in-out infinite; }

            @keyframes dust-rise {
                0% { transform: translateY(0) scale(0.5); opacity: 0; }
                50% { opacity: 0.6; }
                100% { transform: translateY(-15px) scale(1.2); opacity: 0; }
            }
            .animate-dust { animation: dust-rise 2s linear infinite; }
            
            @keyframes lamp-beam {
                0%, 100% { opacity: 0.2; }
                50% { opacity: 0.3; }
            }
            
            @keyframes paladin-shield-idle {
                0%, 100% { transform: translate(75px, 70px); }
                50% { transform: translate(75px, 72px); }
            }
            .animate-paladin-shield { animation: paladin-shield-idle 2s ease-in-out infinite; }
            
            @keyframes paladin-attack {
                0% { transform: translateX(0); }
                40% { transform: translateX(10px) scale(1.05); } /* Step forward */
                100% { transform: translateX(0); }
            }
            .animate-paladin-attack { animation: paladin-attack 0.4s ease-in-out infinite; }
          `}</style>
          
          <linearGradient id="lampBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>

          {/* New Robust Shadow Gradient */}
          <radialGradient id="groundShadow">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#000000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
      </defs>

      {/* -- SHADOW -- Enhanced for dark backgrounds */}
      {!isDying && (
         <ellipse cx="50" cy="100" rx="30" ry="8" fill="url(#groundShadow)" />
      )}

      {/* SELECTION RING - Detached */}
      {isSelected && !isDying && (
          <ellipse cx="50" cy="95" rx="25" ry="8" fill="none" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />
      )}
      
      {/* -- ANIMATED BODY GROUP -- */}
      {/* This group contains everything that should bounce/lunge */}
      <g className={animClass} style={style}>
        {renderBackAccessories()}
        {renderSlimeBody()}
        {renderSlimeBubbles()}
        {renderEyes()}
        {renderAccessories()}
        {/* Magic effects attached to body parts */}
        {isAttacking && !isDying && (type === UnitType.MAGE || type === UnitType.SMALL) && (
           <circle cx="80" cy="50" r="8" fill="none" stroke={secondaryColor} strokeWidth="2" className="animate-magic-pulse" />
        )}
        {renderImpactVisuals()}
      </g>
      
      {/* -- STATIC / GROUND EFFECTS -- */}
      {/* These stay on the ground even if body jumps */}
      {renderSummonEffect()}
      {renderRootVisuals()}
      {renderBossAbilityVisuals()}

      {/* Boss Shockwave - Fixed position on ground */}
      {isAttacking && !isDying && type === UnitType.BOSS && !isBossAbility && (
         <circle cx="50" cy="90" r="25" fill="none" stroke="white" strokeWidth="2" className="animate-shockwave" />
      )}
      
    </svg>
  );
};
