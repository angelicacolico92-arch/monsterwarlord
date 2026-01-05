
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
  let hoodColor = isPlayer ? "#2563eb" : "#dc2626";

  switch(type) {
      case UnitType.WORKER:
          baseColor = isPlayer ? "#a16207" : "#7f1d1d"; 
          secondaryColor = isPlayer ? "#713f12" : "#450a0a";
          break;
      case UnitType.TOXIC:
          baseColor = isPlayer ? "#2563eb" : "#9f1239"; 
          secondaryColor = isPlayer ? "#1e3a8a" : "#881337"; 
          hoodColor = "#fbbf24"; 
          break;
      case UnitType.ARCHER:
          baseColor = isPlayer ? "#047857" : "#7f1d1d"; 
          secondaryColor = isPlayer ? "#064e3b" : "#450a0a"; 
          hoodColor = "#fbbf24"; 
          break;
      case UnitType.PALADIN:
          baseColor = isPlayer ? "#f8fafc" : "#475569"; 
          secondaryColor = isPlayer ? "#94a3b8" : "#1e293b"; 
          break;
      case UnitType.MAGE:
          baseColor = isPlayer ? "#7e22ce" : "#831843"; 
          secondaryColor = isPlayer ? "#581c87" : "#881337";
          hoodColor = "#fbbf24"; 
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

  const renderBackAccessories = () => {
      if (type === UnitType.TOXIC) {
          return (
              <g transform="translate(0, 0)">
                  <path d="M25 50 Q 15 80 10 95 L 90 95 Q 85 80 75 50" fill={isPlayer ? "#1e40af" : "#7f1d1d"} />
                  <path d="M30 50 L 70 50" stroke={hoodColor} strokeWidth="2" />
              </g>
          );
      }
      if (type === UnitType.ARCHER) {
          return (
              <g transform="translate(0,0)">
                  <path d="M68 55 L 75 80 L 65 85 L 58 60 Z" fill="#4a2c0f" stroke="#271c19" strokeWidth="1" />
                  <path d="M60 58 L 72 58" stroke={hoodColor} strokeWidth="1.5" />
                  <path d="M68 50 L 70 40 L 66 40 Z" fill="#ecfccb" />
                  <path d="M72 52 L 74 42 L 70 42 Z" fill="#ecfccb" />
              </g>
          );
      }
      if (type === UnitType.MAGE) {
          const auraPrimary = isPlayer ? "#a855f7" : "#c026d3"; 
          const auraSecondary = isPlayer ? "#7e22ce" : "#be185d";
          return (
              <g>
                  <defs>
                      <radialGradient id={`aura-${isPlayer ? 'p' : 'e'}`} cx="0.5" cy="0.5" r="0.7">
                          <stop offset="0%" stopColor={auraPrimary} stopOpacity="0.6" />
                          <stop offset="50%" stopColor={auraSecondary} stopOpacity="0.2" />
                          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                      </radialGradient>
                  </defs>
                  <g className="animate-spin-slow" style={{ transformOrigin: '50px 65px', opacity: 0.8 }}>
                       <path d="M50 20 L 50 25 M 50 105 L 50 110 M 5 65 L 10 65 M 90 65 L 95 65" stroke={auraPrimary} strokeWidth="2" />
                       <circle cx="50" cy="65" r="45" stroke={auraPrimary} strokeWidth="1.5" strokeDasharray="10 30" fill="none" />
                  </g>
                  <g className="animate-spin-slow" style={{ transformOrigin: '50px 65px', opacity: 0.6, animationDirection: 'reverse', animationDuration: '6s' }}>
                      <circle cx="50" cy="65" r="30" stroke={auraSecondary} strokeWidth="1" strokeDasharray="5 5" fill="none" />
                      <path d="M50 35 L 50 95 M 20 65 L 80 65" stroke={auraSecondary} strokeWidth="0.5" />
                  </g>
                  <circle cx="50" cy="65" r="50" fill={`url(#aura-${isPlayer ? 'p' : 'e'})`} className="animate-pulse" />
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
        return (
            <g>
                <defs>
                    <radialGradient id={`mageGlow-${isPlayer ? 'p' : 'e'}-${type}`} cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor={isPlayer ? "#a855f7" : "#be123c"} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={baseColor} stopOpacity="1" />
                    </radialGradient>
                </defs>
                <path 
                    d="M20 95 Q 15 50 30 40 Q 50 20 70 40 Q 85 50 80 95 L 20 95 Z" 
                    fill={`url(#mageGlow-${isPlayer ? 'p' : 'e'}-${type})`} 
                    stroke={secondaryColor} 
                    strokeWidth="2" 
                />
                <path 
                    d="M25 55 Q 50 25 75 55 L 75 65 Q 50 45 25 65 Z" 
                    fill={baseColor} 
                    stroke={hoodColor} 
                    strokeWidth="1.5" 
                />
                <path d="M42 55 L 40 90 L 45 95 L 50 90 L 48 55" fill={isPlayer ? "#4c1d95" : "#881337"} />
                <path d="M52 55 L 50 90 L 55 95 L 60 90 L 58 55" fill={isPlayer ? "#4c1d95" : "#881337"} />
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
        return (
            <g>
                <path 
                    d="M15 100 L 15 95 Q 15 45 50 45 Q 85 45 85 95 L 85 100 Z" 
                    fill={baseColor} 
                    stroke={secondaryColor} 
                    strokeWidth="2" 
                />
                <path 
                    d="M30 75 Q 50 82 70 75 L 70 85 Q 50 95 30 85 Z" 
                    fill="#e2e8f0" 
                    stroke={hoodColor} 
                    strokeWidth="1" 
                />
                <circle cx="20" cy="70" r="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                <circle cx="20" cy="70" r="4" fill={hoodColor} opacity="0.5" />
                <circle cx="80" cy="70" r="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                <circle cx="80" cy="70" r="4" fill={hoodColor} opacity="0.5" />
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

    if (type === UnitType.TOXIC) {
        return (
            <g>
                <path 
                    d="M15 100 L 15 90 Q 15 45 50 45 Q 85 45 85 90 L 85 100 Z" 
                    fill={baseColor} 
                    stroke={secondaryColor} 
                    strokeWidth="3"
                />
                <path 
                    d="M20 55 Q 35 60 45 70 L 80 95 Q 65 90 55 80 L 20 55 Z" 
                    fill="#e2e8f0" 
                    stroke="#475569" 
                    strokeWidth="1" 
                    opacity="0.9"
                />
                <path d="M30 62 L 65 87" stroke={hoodColor} strokeWidth="2" strokeDasharray="3 2" opacity="0.8" />
                <path d="M10 65 Q 10 50 30 55 L 30 70 Q 15 65 10 65 Z" fill={hoodColor} stroke="#b45309" strokeWidth="1" />
                <path d="M90 65 Q 90 50 70 55 L 70 70 Q 85 65 90 65 Z" fill={hoodColor} stroke="#b45309" strokeWidth="1" />
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
  
  const renderSlimeBubbles = () => (
      <g>
          <circle cx="35" cy="60" r="3" fill="#ffffff" fillOpacity="0.4" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
          <circle cx="75" cy="85" r="2" fill="#ffffff" fillOpacity="0.3" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
          <circle cx="20" cy="85" r="4" fill="#ffffff" fillOpacity="0.2" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
      </g>
  );

  const renderEyes = () => {
    const eyeColor = "#fff";
    const pupilColor = "#000";

    if (type === UnitType.ARCHER) {
        return (
            <g transform="translate(0, 0)">
                 <ellipse cx="40" cy="65" rx="5" ry="6" fill={eyeColor} />
                 <circle cx="42" cy="65" r="2" fill={pupilColor} />
                 <ellipse cx="60" cy="65" rx="5" ry="6" fill={eyeColor} />
                 <circle cx="62" cy="65" r="2" fill={pupilColor} />
            </g>
        )
    }
    
    return (
        <g className={isAttacking ? "animate-angry-eyes" : ""}>
            <circle cx="35" cy="65" r="6" fill="white" />
            <circle cx="37" cy="65" r="2.5" fill="black" />
            <circle cx="65" cy="65" r="6" fill="white" />
            <circle cx="67" cy="65" r="2.5" fill="black" />
            {isAttacking && (
                 <g>
                    <path d="M28 58 L 42 62" stroke="black" strokeWidth="1.5" />
                    <path d="M72 58 L 58 62" stroke="black" strokeWidth="1.5" />
                 </g>
            )}
        </g>
    );
  };

  const renderAccessories = () => {
    if (type === UnitType.WORKER) {
        return (
             <g className={isMining ? "animate-mining-swing" : ""}>
                 <path d="M65 60 L 85 40" stroke="#78350f" strokeWidth="3" />
                 <path d="M85 40 L 90 35" stroke="#94a3b8" strokeWidth="4" />
                 <path d="M80 35 Q 85 40 95 35" stroke="#94a3b8" strokeWidth="3" fill="none" />
             </g>
        );
    }
    if (type === UnitType.TOXIC) {
        return (
             <g className={isAttacking ? "animate-sword-swing" : ""} transform="translate(0,0)">
                 <path d="M75 75 L 90 60" stroke="#eab308" strokeWidth="3" />
                 <path d="M85 65 L 95 55 L 100 60" fill="#cbd5e1" stroke="#475569" strokeWidth="1" /> 
             </g>
        );
    }
    if (type === UnitType.ARCHER) {
        return (
             <g className={isAttacking ? "animate-archer-bow" : ""} transformOrigin="50px 70px">
                 <path d="M60 40 Q 90 70 60 100" fill="none" stroke="#78350f" strokeWidth="2.5" />
                 <line x1="60" y1="40" x2="60" y2="100" stroke="#fefce8" strokeWidth="0.5" opacity="0.6" />
                 {isAttacking && (
                      <g className="animate-archer-reload">
                          <line x1="30" y1="70" x2="70" y2="70" stroke="#fefce8" strokeWidth="1.5" />
                          <path d="M65 70 L 60 67 L 60 73 Z" fill="#94a3b8" />
                      </g>
                 )}
             </g>
        );
    }
    if (type === UnitType.PALADIN) {
        return (
            <g className="animate-paladin-shield">
                <path d="M65 60 L 95 60 L 80 90 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
                <path d="M80 60 L 80 90" stroke="#475569" strokeWidth="1" />
                <path d="M65 60 L 80 75 L 95 60" fill="none" stroke="#475569" strokeWidth="1" opacity="0.5" />
            </g>
        );
    }
    if (type === UnitType.MAGE) {
        return (
            <g transform={isAttacking ? "rotate(15 80 70)" : "rotate(0 80 70)"} className="transition-transform duration-300">
                <line x1="80" y1="95" x2="80" y2="40" stroke="#4a2c0f" strokeWidth="2.5" />
                <circle cx="80" cy="35" r="5" fill="#a855f7" className="animate-pulse" />
            </g>
        );
    }
    return null;
  };

  const renderImpactVisuals = () => {
    if (isAttacking && type === UnitType.TOXIC) {
        return <path d="M85 60 L 95 50 M 90 65 L 100 60" stroke="white" strokeWidth="1" className="animate-ping" style={{ animationDuration: '0.3s' }} />;
    }
    return null;
  };

  const renderSummonEffect = () => {
    return <circle cx="50" cy="95" r="20" stroke="#a855f7" strokeWidth="2" fill="none" className="animate-summon-circle" />;
  };

  const renderRootVisuals = () => {
    return (
        <g>
            <path d="M20 95 Q 30 85 35 95" stroke="#3f6212" strokeWidth="2" fill="none" />
            <path d="M70 95 Q 60 85 65 95" stroke="#3f6212" strokeWidth="2" fill="none" />
        </g>
    );
  };

  const renderBossAbilityVisuals = () => {
    return (
        <g>
            <circle cx="50" cy="90" r="10" fill="none" stroke="#f43f5e" strokeWidth="4" className="animate-boss-shockwave" />
            <circle cx="50" cy="50" r="5" fill="#f43f5e" className="animate-boss-flash" />
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
          <linearGradient id="lampBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="groundShadow">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#000000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <style>{`
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            @keyframes summon-circle { 0% { opacity: 0; transform: scale(0.5) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(180deg); } 100% { opacity: 0; transform: scale(0.5) rotate(360deg); } }
            .animate-summon-circle { animation: summon-circle 1s ease-in-out; }
            @keyframes fireburst-pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
            .animate-fireburst { animation: fireburst-pulse 1s ease-out forwards; transform-origin: 50px 75px; }
            @keyframes energy-rise { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
            .animate-energy-rise { animation: energy-rise 0.8s ease-out; }
            @keyframes sword-swing { 0% { transform: translate(68px, 72px) rotate(-15deg); } 30% { transform: translate(65px, 65px) rotate(-50deg); } 60% { transform: translate(75px, 75px) rotate(100deg); } 100% { transform: translate(68px, 72px) rotate(-15deg); } }
            .animate-sword-swing { animation: sword-swing 0.4s ease-in-out; transform-origin: 0 0; }
            @keyframes boss-shockwave { 0% { r: 10; opacity: 1; stroke-width: 6; } 100% { r: 200; opacity: 0; stroke-width: 0; } }
            .animate-boss-shockwave { animation: boss-shockwave 0.8s ease-out forwards; }
            @keyframes boss-explosion { 0% { r: 0; opacity: 1; } 20% { r: 120; opacity: 0.95; } 100% { r: 140; opacity: 0; } }
            .animate-boss-explosion { animation: boss-explosion 0.8s ease-out forwards; }
            @keyframes boss-flash { 0% { opacity: 1; r: 10; } 100% { opacity: 0; r: 200; } }
            .animate-boss-flash { animation: boss-flash 0.3s ease-out forwards; }
            @keyframes ember-fly { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: rotate(var(--angle)) translate(var(--dist)) scale(0); opacity: 0; } }
            .animate-ember { animation: ember-fly 0.8s ease-out forwards; transform-origin: 50px 90px; }
            @keyframes mining-swing { 0% { transform: translate(72px, 70px) rotate(0deg); } 30% { transform: translate(72px, 65px) rotate(-45deg); } 60% { transform: translate(72px, 80px) rotate(60deg); } 70% { transform: translate(72px, 75px) rotate(55deg); } 100% { transform: translate(72px, 70px) rotate(0deg); } }
            .animate-mining-swing { animation: mining-swing 0.8s ease-in-out infinite; }
            @keyframes miner-work { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.1, 0.9) translateY(2px); } }
            .animate-miner-work { transform-origin: bottom center; animation: miner-work 0.8s ease-in-out infinite; }
            @keyframes dust-rise { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(-15px) scale(1.2); opacity: 0; } }
            .animate-dust { animation: dust-rise 2s linear infinite; }
            @keyframes paladin-shield-idle { 0%, 100% { transform: translate(75px, 70px); } 50% { transform: translate(75px, 72px); } }
            .animate-paladin-shield { animation: paladin-shield-idle 2s ease-in-out infinite; }
            @keyframes paladin-attack { 0% { transform: translateX(0); } 40% { transform: translateX(10px) scale(1.05); } 100% { transform: translateX(0); } }
            .animate-paladin-attack { animation: paladin-attack 0.4s ease-in-out infinite; }
            @keyframes archer-draw-cycle { 0% { transform: scale(1, 1) rotate(0deg); } 10% { transform: scale(1, 1); } 80% { transform: scale(0.95, 1) rotate(-2deg); } 95% { transform: scale(0.95, 1) rotate(-2deg); } 100% { transform: scale(1, 1) rotate(0deg); } }
            .animate-archer-bow { animation: archer-draw-cycle 2.5s ease-in-out infinite; }
            @keyframes arrow-reload-cycle { 0% { opacity: 0; transform: translateX(0); } 15% { opacity: 1; transform: translateX(0); } 80% { opacity: 1; transform: translateX(-12px); } 95% { opacity: 1; transform: translateX(-12px); } 100% { opacity: 0; transform: translateX(0); } }
            .animate-archer-reload { animation: arrow-reload-cycle 2.5s linear infinite; }
            @keyframes archer-body-sway-cycle { 0% { transform: rotate(0deg); } 5% { transform: rotate(-2deg); } 80% { transform: rotate(-5deg); } 95% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
            .animate-archer-body { transform-origin: bottom center; animation: archer-body-sway-cycle 2.5s ease-in-out infinite; }
          `}</style>
      </defs>

      {!isDying && <ellipse cx="50" cy="100" rx="30" ry="8" fill="url(#groundShadow)" />}
      {isSelected && !isDying && <ellipse cx="50" cy="95" rx="25" ry="8" fill="none" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />}
      
      <g className={animClass} style={Object.assign({}, style, animStyle)}>
        {renderBackAccessories()}
        {renderSlimeBody()}
        {renderSlimeBubbles()}
        {renderStuckArrows()} 
        {renderEyes()}
        {renderAccessories()}
        {isAttacking && !isDying && (type === UnitType.MAGE || type === UnitType.SMALL) && (
           <circle cx="80" cy="50" r="8" fill="none" stroke={secondaryColor} strokeWidth="2" className="animate-magic-pulse" />
        )}
        {renderImpactVisuals()}
      </g>
      
      {/* Static/Ground Effects */}
      {type === UnitType.SMALL && renderSummonEffect()}
      {isRooted && renderRootVisuals()}
      {isBossAbility && renderBossAbilityVisuals()}
      {isAttacking && !isDying && type === UnitType.BOSS && !isBossAbility && (
         <circle cx="50" cy="90" r="25" fill="none" stroke="white" strokeWidth="2" className="animate-shockwave" />
      )}
    </svg>
  );
};
