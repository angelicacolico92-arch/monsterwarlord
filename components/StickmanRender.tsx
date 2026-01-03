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
  hasGold = false,
  isSummoning = false
}) => {
  const animationDelay = useMemo(() => Math.random() * 1, []);
  
  // Memoize random delays for the bubbles so they don't look uniform across all units
  const bubbleDelays = useMemo(() => [Math.random() * 2, Math.random() * 2, Math.random() * 2], []);
  
  // -- ANIMATION CLASS SELECTOR --
  let animClass = "";
  if (isDying) {
      animClass = "animate-death-puddle";
  } else if (isSummoning && type === UnitType.MAGE) {
      // Mage summon pose (stationary but possibly levitating/channeling)
      animClass = "animate-mage-float"; 
  } else if (isAttacking || isMining) {
      if (type === UnitType.TOXIC) animClass = "animate-toxic-spit"; 
      else if (type === UnitType.ARCHER) animClass = "animate-archer-body"; 
      else if (type === UnitType.BOSS) animClass = "animate-boss-stomp";
      else if (type === UnitType.WORKER && isMining) animClass = "animate-mining";
      else animClass = "animate-slime-attack";
  } else if (isMoving || isDepositing) {
      if (type === UnitType.MAGE || type === UnitType.SMALL) animClass = "animate-mage-float";
      else animClass = "animate-slime-bounce";
  } else {
      if (type === UnitType.MAGE || type === UnitType.SMALL) animClass = "animate-mage-float";
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
      case UnitType.SMALL:
          // New Mage Colors: Purple-Blue Glow (as per design)
          // Player: Stronger Blue-Purple, Enemy: Darker Red-Purple
          baseColor = isPlayer ? "#8b5cf6" : "#7c3aed"; 
          secondaryColor = isPlayer ? "#6d28d9" : "#5b21b6";
          break;
      case UnitType.BOSS:
          baseColor = isPlayer ? "#f43f5e" : "#881337"; // Pink/Red / Dark Red
          secondaryColor = isPlayer ? "#9f1239" : "#4c0519";
          break;
  }

  // --- COMPONENT PARTS ---

  const SlimeBody = () => {
    // Mage has specific semi-transparent body design
    if (type === UnitType.MAGE || type === UnitType.SMALL) {
        return (
            <g>
                <defs>
                    {/* Add type to ID to prevent conflict if needed, though reuse is fine */}
                    <radialGradient id={`mageGlow-${isPlayer ? 'p' : 'e'}-${type}`} cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor={isPlayer ? '#a78bfa' : '#9333ea'} stopOpacity="0.8" />
                        <stop offset="80%" stopColor={baseColor} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.6" />
                    </radialGradient>
                </defs>
                <path 
                    d="M15 100 C 15 100 15 40 50 40 C 85 40 85 100 85 100 Z" 
                    fill={`url(#mageGlow-${isPlayer ? 'p' : 'e'}-${type})`}
                    stroke={secondaryColor} 
                    strokeWidth="2"
                    strokeOpacity="0.8"
                />
            </g>
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
     if (type === UnitType.MAGE || type === UnitType.SMALL) {
         // Glowing Arcane Eyes
         return (
             <g>
                 {/* Arcane Symbol / Vertical pupil hint */}
                 <path d="M35 58 L 35 62" stroke="white" strokeWidth="1.5" opacity="0.8" />
                 <path d="M65 58 L 65 62" stroke="white" strokeWidth="1.5" opacity="0.8" />
                 
                 <circle cx="35" cy="60" r="3" fill="white" className="animate-pulse" />
                 <circle cx="65" cy="60" r="3" fill="white" className="animate-pulse" />
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
                  {/* Bow Body - Uses new wind-up animation */}
                  <g className={isAttacking ? "animate-archer-bow" : ""}>
                      <path d="M15 -20 Q -5 0 15 20" stroke="#fcd34d" strokeWidth="3" fill="none" />
                      {/* String */}
                      <line x1="15" y1="-20" x2="15" y2="20" stroke="white" strokeWidth="1" opacity="0.6" />
                  </g>
                  
                  {/* Arrow - Uses new wind-up and shoot animation */}
                  <g className={isAttacking ? "animate-archer-arrow" : ""}>
                      <line x1="-5" y1="0" x2="15" y2="0" stroke="white" strokeWidth="2" />
                      <path d="M15 0 L 10 -3 L 10 3 Z" fill="white" />
                      <path d="M-5 0 L -8 -2 M-5 0 L -8 2" stroke="white" strokeWidth="1" />
                  </g>
              </g>
          );
      }

      // Paladin Shield & Helm
      if (type === UnitType.PALADIN) {
          const isIdle = !isAttacking && !isMoving && !isDying;
          const shieldAnim = isIdle ? "animate-paladin-shield" : "";

          return (
              <g>
                  {/* HELMET */}
                  <g>
                      {/* Plume/Crest */}
                      <path d="M50 25 Q 55 15 65 20" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" />
                      
                      {/* Main Dome */}
                      <path d="M30 48 Q 50 20 70 48" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
                      
                      {/* Visor Band */}
                      <rect x="30" y="48" width="40" height="8" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
                      
                      {/* Nose Guard */}
                      <path d="M50 48 L 50 68" stroke="#475569" strokeWidth="2.5" />
                      
                      {/* Side Wings (Decorative) */}
                      <path d="M30 42 L 20 32 L 32 38" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
                      <path d="M70 42 L 80 32 L 68 38" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
                  </g>
                  
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

      // Mage Redesign (Final) + Small (Mini-Mage)
      if (type === UnitType.MAGE || type === UnitType.SMALL) {
          return (
              <g>
                  {/* Core: Floating Magic Crystal/Orb inside */}
                  <g className="animate-pulse">
                      <circle cx="50" cy="75" r="6" fill="#a78bfa" opacity="0.6" filter="blur(1px)" />
                      <path d="M50 68 L 54 75 L 50 82 L 46 75 Z" fill="#fff" opacity="0.9" />
                  </g>

                  {/* Aura: Floating Runes */}
                  <g opacity="0.6" className="animate-spin-slow" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                      <path d="M25 50 L 28 45" stroke="#e9d5ff" strokeWidth="1" />
                      <path d="M75 50 L 72 55" stroke="#e9d5ff" strokeWidth="1" />
                      <circle cx="50" cy="30" r="1" fill="#e9d5ff" />
                  </g>

                  {/* Accessory: Floating Crystal Staff (Rune Shard) */}
                  <g transform={isAttacking ? "translate(0, -5) rotate(5, 85, 70)" : "translate(0, 0)"}>
                      {/* Staff Shaft - Crystal-like */}
                      <path d="M85 50 L 85 90" stroke="#a78bfa" strokeWidth="1.5" />
                      {/* Top Crystal Shard */}
                      <path d="M85 50 L 90 40 L 85 30 L 80 40 Z" fill="#d8b4fe" stroke="#7c3aed" strokeWidth="1" className="animate-pulse" />
                      {/* Small Orbiting particles around staff */}
                      <circle cx="85" cy="40" r="8" fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="2 2" className="animate-spin" style={{ transformOrigin: '85px 40px' }} />
                  </g>

                  {/* Summon Animation: Magic Circle (Only for actual Mage doing summoning) */}
                  {type === UnitType.MAGE && isSummoning && (
                      <g className="animate-summon-circle" style={{ transformOrigin: '50px 95px' }}>
                          <ellipse cx="50" cy="95" rx="30" ry="8" fill="none" stroke="#d8b4fe" strokeWidth="1.5" />
                          <path d="M50 87 L 50 103 M 35 95 L 65 95" stroke="#d8b4fe" strokeWidth="1" />
                          <path d="M40 90 L 60 100 M 60 90 L 40 100" stroke="#d8b4fe" strokeWidth="1" opacity="0.5" />
                          {/* Runes on circle */}
                          <circle cx="20" cy="95" r="1" fill="#fff" />
                          <circle cx="80" cy="95" r="1" fill="#fff" />
                      </g>
                  )}
                  
                  {/* Summon Energy Gathering */}
                  {type === UnitType.MAGE && isSummoning && (
                      <g>
                          <circle cx="50" cy="95" r="2" fill="#fff" className="animate-energy-rise" />
                          <circle cx="40" cy="95" r="1.5" fill="#fff" className="animate-energy-rise" style={{ animationDelay: '0.2s' }} />
                          <circle cx="60" cy="95" r="1.5" fill="#fff" className="animate-energy-rise" style={{ animationDelay: '0.4s' }} />
                      </g>
                  )}
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

     // Mage Special Impact
     if (type === UnitType.MAGE || type === UnitType.SMALL) {
        return (
            <g style={{ animationDelay: `${animationDelay}s` }}>
                <circle cx="100" cy="50" r="10" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0">
                    <animate attributeName="r" values="5;25" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="stroke-width" values="3;0" dur="0.8s" repeatCount="indefinite" />
                </circle>
                
                <path d="M100 35 L105 45 L115 45 L108 52 L110 62 L100 55 L90 62 L92 52 L85 45 L95 45 Z" fill="#e9d5ff" opacity="0.8">
                     <animateTransform attributeName="transform" type="scale" values="0.8;1.2;0.8" dur="0.8s" repeatCount="indefinite" additive="sum" />
                     <animateTransform attributeName="transform" type="rotate" from="0 100 50" to="360 100 50" dur="3s" repeatCount="indefinite" additive="sum" />
                </path>
                
                <circle cx="100" cy="50" r="15" fill="#d8b4fe" opacity="0.3" className="animate-pulse" />
            </g>
        );
     }

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
  
  // Magical Summon Effect for newly created SMALL units
  const SummonEffect = () => {
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
             
             {/* Portal Ring expanding on ground */}
             <ellipse cx="50" cy="90" rx="0" ry="0" fill="none" stroke="#d8b4fe" strokeWidth="3" opacity="1">
                 <animate attributeName="rx" from="0" to="35" dur="0.6s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.1 0.8 0.2 1" />
                 <animate attributeName="ry" from="0" to="12" dur="0.6s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.1 0.8 0.2 1" />
                 <animate attributeName="opacity" values="1;0" dur="0.8s" begin="0s" fill="freeze" />
                 <animate attributeName="stroke-width" values="3;0" dur="0.8s" begin="0s" fill="freeze" />
             </ellipse>
             
             {/* Vertical Beam of Light */}
             <path d="M45 90 L 55 90 L 50 90 Z" fill="url(#summonGlow)" opacity="0">
                 <animate attributeName="d" values="M45 90 L 55 90 L 50 90 Z; M30 90 L 70 90 L 50 5 Z" dur="0.4s" begin="0s" fill="freeze" />
                 <animate attributeName="opacity" values="0;1;0" dur="0.7s" begin="0s" fill="freeze" />
             </path>
             
             {/* Burst Stars/Sparkles */}
             <g transform="translate(50, 50)">
                 <circle cx="0" cy="0" r="0" fill="white" opacity="0.8">
                      <animate attributeName="r" values="0;25" dur="0.5s" begin="0.1s" fill="freeze" />
                      <animate attributeName="opacity" values="0.8;0" dur="0.5s" begin="0.1s" fill="freeze" />
                 </circle>
             </g>
        </g>
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
      <defs>
          <style>{`
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            
            @keyframes summon-circle { 0% { opacity: 0; transform: scale(0.5) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(180deg); } 100% { opacity: 0; transform: scale(0.5) rotate(360deg); } }
            .animate-summon-circle { animation: summon-circle 1s ease-in-out; }
            
            @keyframes energy-rise { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
            .animate-energy-rise { animation: energy-rise 0.8s ease-out; }
          `}</style>
      </defs>

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
      
      {/* Render Summon Effect after body so the flash overlays the appearing unit */}
      <SummonEffect />

      {/* Boss Shockwave Effect */}
      {isAttacking && !isDying && type === UnitType.BOSS && (
         <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="2" className="animate-shockwave" />
      )}
      
      {/* Magic Effects */}
      {isAttacking && !isDying && (type === UnitType.MAGE || type === UnitType.SMALL) && (
         <circle cx="80" cy="50" r="8" fill="none" stroke={secondaryColor} strokeWidth="2" className="animate-magic-pulse" />
      )}
      
      <ImpactVisuals />
    </svg>
  );
};