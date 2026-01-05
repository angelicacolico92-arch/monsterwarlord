
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
      if (type === UnitType.TOXIC || type === UnitType.ARCHER) animClass = "animate-knight-death";
      else animClass = "animate-death-puddle";
  } else if (isRooted) {
      animClass = "animate-idle-breathe"; 
  } else if (isSummoning && type === UnitType.MAGE) {
      animClass = "animate-mage-float"; 
  } else if (isAttacking || isMining) {
      if (type === UnitType.TOXIC) animClass = ""; // Knight uses custom SVG transform for attack
      else if (type === UnitType.ARCHER) animClass = ""; // Archer uses internal SVG animation for focus/recoil
      else if (type === UnitType.BOSS) animClass = "animate-boss-stomp";
      else if (type === UnitType.WORKER && isMining) animClass = ""; // Miner uses custom SVG transform for pickaxe
      else if (type === UnitType.PALADIN) animClass = "animate-paladin-attack"; 
      else animClass = "animate-slime-attack";
  } else if (isMoving || isDepositing) {
      if (type === UnitType.MAGE || type === UnitType.SMALL) animClass = "animate-mage-float";
      else if (type === UnitType.TOXIC) animClass = "animate-idle-breathe"; // Noble march
      else if (type === UnitType.ARCHER) animClass = "animate-slime-bounce"; // Round bouncy march
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
          baseColor = isPlayer ? "#3b82f6" : "#ef4444"; 
          secondaryColor = isPlayer ? "#1e40af" : "#991b1b";
          break;
      case UnitType.TOXIC: // Imperial Knight
          baseColor = isPlayer ? "#2563eb" : "#9f1239"; 
          secondaryColor = isPlayer ? "#1e3a8a" : "#881337"; 
          break;
      case UnitType.ARCHER: // Imperial Archer
          baseColor = isPlayer ? "#1d4ed8" : "#be123c"; // Slightly lighter than Knight for "Leather/Cloth" feel
          secondaryColor = isPlayer ? "#1e3a8a" : "#881337"; 
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
      // Centered on the body mass (approx 50, 70) so relative offsets work correctly
      return (
          <g className="pointer-events-none" transform="translate(50, 70)">
              {stuckArrows.map(arrow => (
                  <g key={arrow.id} transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.angle})`}>
                      <line x1="0" y1="0" x2="-22" y2="0" stroke="white" strokeWidth="1.5" strokeLinecap="butt" />
                      <path d="M-22 0 L -26 -3 L -26 3 Z" fill="#facc15" stroke="#a16207" strokeWidth="0.5" />
                      {/* Entry wound effect */}
                      <circle cx="0" cy="0" r="2" fill="#333" opacity="0.6" />
                      <circle cx="0" cy="0" r="1" fill="#ef4444" opacity="0.8" />
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

                 {/* CARRYING CRYSTAL (When hasGold is true) */}
                 {hasGold && (
                     <g transform="translate(45, 45)" className="animate-gold-carry">
                         {/* Glowing Crystal Chunk */}
                         <path d="M0 10 L 10 0 L 20 10 L 10 25 Z" fill="#22d3ee" stroke="#cffafe" strokeWidth="1.5" />
                         <path d="M5 10 L 10 5 L 15 10 L 10 18 Z" fill="#a5f3fc" opacity="0.8" />
                         {/* Sparkles */}
                         <circle cx="0" cy="5" r="1" fill="white" className="animate-ping" style={{ animationDuration: '1.5s' }} />
                         <circle cx="20" cy="15" r="1" fill="white" className="animate-ping" style={{ animationDuration: '2s' }} />
                     </g>
                 )}

                 {/* IMPERIAL PICKAXE */}
                 <g 
                    className={isMining ? "animate-pickaxe-swing" : "transition-transform duration-500"}
                    style={{ 
                        transformOrigin: "80px 65px",
                        transform: hasGold ? "rotate(160deg) translate(0, 10px)" : (isMining ? "" : "rotate(0deg)")
                    }}
                 >
                     {/* Handle - Dark Wood/Bronze - Long & Sturdy */}
                     <path d="M75 75 L 95 35" stroke="#5D4037" strokeWidth="3.5" strokeLinecap="round" />
                     
                     {/* Metal Head - Curved Imperial Style */}
                     {/* Main heavy arc */}
                     <path d="M82 40 Q 95 30 108 40" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                     
                     {/* Tips - Dipped in Gold (High Durability) */}
                     <path d="M82 40 L 80 42" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
                     <path d="M108 40 L 110 42" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
                     
                     {/* Central Hub/Insignia */}
                     <circle cx="95" cy="35" r="3.5" fill="#facc15" stroke="#b45309" strokeWidth="1" />
                     <path d="M95 32 L 95 38 M 92 35 L 98 35" stroke="#b45309" strokeWidth="1" />
                 </g>
                 
                 <style>{`
                    @keyframes pickaxeSwing {
                        0% { transform: rotate(0deg); }
                        25% { transform: rotate(-45deg); } /* Higher Wind up */
                        50% { transform: rotate(60deg); }  /* Deep Strike */
                        60% { transform: rotate(55deg); }  /* Impact shudder */
                        100% { transform: rotate(0deg); }
                    }
                    .animate-pickaxe-swing { animation: pickaxeSwing 1.2s cubic-bezier(0.36, 0, 0.66, -0.56) infinite; }
                    
                    @keyframes goldCarry {
                        0%, 100% { transform: translate(45px, 45px) rotate(0deg); }
                        50% { transform: translate(45px, 42px) rotate(2deg); } /* Heavy bob */
                    }
                    .animate-gold-carry { animation: goldCarry 1s ease-in-out infinite; }
                 `}</style>
             </g>
        );
      }

      // IMPERIAL KNIGHT ARCHER (Anime Style - ROUND)
      if (type === UnitType.ARCHER) {
          return (
              <g>
                  {/* -- BASE ARMOR -- */}
                  
                  {/* Round Hood (Back) */}
                  <path d="M25 50 Q 50 35 75 50 L 78 80 Q 50 90 22 80 Z" fill={secondaryColor} opacity="0.6" />
                  
                  {/* Light Chest Plate (Curved for round body) */}
                  <path 
                      d="M30 60 Q 50 55 70 60 L 66 80 Q 50 85 34 80 Z" 
                      fill={armorColor} 
                      stroke={armorTrim} 
                      strokeWidth="1" 
                  />
                  
                  {/* Arm Bracer (Bow Arm - Right side for viewer) */}
                  <rect x="72" y="60" width="8" height="12" rx="2" fill="#78350f" stroke={armorTrim} strokeWidth="1" transform="rotate(-5 76 66)" />

                  {/* Quiver (Peeking from back) */}
                  <g transform="translate(18, 50) rotate(-20)">
                      <rect x="0" y="0" width="8" height="18" rx="2" fill="#5D4037" stroke="#3E2723" />
                      {/* Feathers */}
                      <path d="M2 -5 L 4 0 L 6 -5" stroke="white" strokeWidth="1" fill="none" />
                      <path d="M0 -3 L 4 2 L 8 -3" stroke="white" strokeWidth="1" fill="none" />
                  </g>

                  {/* -- ANIME BOW ANIMATION -- */}
                  <g 
                    className={isAttacking ? "animate-bow-draw" : "transition-transform duration-700"}
                    style={{ 
                        transformOrigin: "75px 60px",
                        transform: isAttacking ? "rotate(0deg)" : "rotate(25deg) translate(0, 5px)"
                    }}
                  >
                      {/* Realistic Recurve Bow */}
                      <path 
                        d="M60 25 C 50 35, 75 45, 75 60 C 75 75, 50 85, 60 95" 
                        fill="none" 
                        stroke="#8B4513" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                      />
                      {/* Handle Grip */}
                      <path d="M72 55 L 72 65" stroke="#facc15" strokeWidth="3.5" />

                      {/* Bow String - Dynamic Draw */}
                      <path 
                        className={isAttacking ? "animate-string-draw" : ""}
                        d="M60 25 L 60 95" 
                        fill="none" 
                        stroke="#fff" 
                        strokeWidth="0.5" 
                        opacity="0.6"
                      />

                      {/* Arrow - Only visible during draw/attack */}
                      <g className={isAttacking ? "animate-arrow-appear" : "opacity-0"}>
                          <line x1="40" y1="60" x2="80" y2="60" stroke="#e2e8f0" strokeWidth="1.5" />
                          <path d="M80 60 L 75 57 L 75 63 Z" fill="#e2e8f0" /> {/* Single Head */}
                          <path d="M40 60 L 35 57 L 35 63 Z" fill="white" /> {/* Feathers */}
                      </g>
                  </g>

                  <style>{`
                    @keyframes bowDraw {
                        0% { transform: rotate(20deg); }
                        20% { transform: rotate(-5deg); } /* Raise */
                        90% { transform: rotate(-5deg); } /* Hold Aim */
                        100% { transform: rotate(0deg); } /* Recoil/Relax */
                    }
                    @keyframes stringDraw {
                        0% { d: path("M60 25 L 60 95"); }
                        40% { d: path("M60 25 L 35 60 L 60 95"); } /* Draw Back */
                        90% { d: path("M60 25 L 35 60 L 60 95"); } /* Hold */
                        95% { d: path("M60 25 L 65 60 L 60 95"); } /* Release Snap */
                        100% { d: path("M60 25 L 60 95"); }
                    }
                    @keyframes arrowAppear {
                        0% { opacity: 0; transform: translate(10px, 0); }
                        20% { opacity: 1; transform: translate(0, 0); } /* Nock */
                        40% { opacity: 1; transform: translate(-25px, 0); } /* Draw */
                        90% { opacity: 1; transform: translate(-25px, 0); } /* Hold */
                        100% { opacity: 0; transform: translate(0, 0); } /* Fire */
                    }
                    .animate-bow-draw { animation: bowDraw 2s ease-in-out infinite; }
                    .animate-string-draw { animation: stringDraw 2s ease-in-out infinite; }
                    .animate-arrow-appear { animation: arrowAppear 2s ease-in-out infinite; }
                  `}</style>
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
    // Imperial Archer - Round, Bulbous body (Anime Style)
    if (type === UnitType.ARCHER) {
        return (
            <path 
                d="M 25 100 C 15 90 15 45 50 45 C 85 45 85 90 75 100 Z" 
                fill={baseColor} 
                stroke={secondaryColor} 
                strokeWidth="3"
                opacity="0.95"
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
        const yOffset = type === UnitType.WORKER ? 0 : -5;
        return (
            <g transform={`translate(0, ${yOffset})`}>
                <ellipse cx="38" cy="55" rx="5" ry="7" fill="black" />
                <circle cx="40" cy="52" r="2.5" fill="white" /> 
                <ellipse cx="62" cy="55" rx="5" ry="7" fill="black" />
                <circle cx="64" cy="52" r="2.5" fill="white" /> 
            </g>
        );
    }
    
    // Imperial Archer: Zen Mode (Idle) vs Focused (Attack)
    if (type === UnitType.ARCHER) {
        if (isAttacking) {
            // FOCUSED ANIME EYES ( ◕ ◕ ) - Sharp
            return (
                <g transform="translate(0, -5)">
                    <ellipse cx="40" cy="55" rx="4" ry="6" fill="black" />
                    <circle cx="42" cy="53" r="2" fill="white" />
                    {/* Angry Eyebrows for focus */}
                    <path d="M36 48 L 44 50" stroke="black" strokeWidth="1" />
                    
                    <ellipse cx="60" cy="55" rx="4" ry="6" fill="black" />
                    <circle cx="62" cy="53" r="2" fill="white" />
                    <path d="M64 48 L 56 50" stroke="black" strokeWidth="1" />
                </g>
            );
        } else {
            // ZEN/CALM EYES ( ˘ ˘ )
            return (
                <g transform="translate(0, -5)">
                     <path d="M36 55 Q 40 58 44 55" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                     <path d="M56 55 Q 60 58 64 55" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                </g>
            );
        }
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
