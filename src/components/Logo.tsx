import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Logo
 * Official ChangeGuard Shield Logo component.
 * Features:
 * - Uses the official uploaded futuristic shield logo (/changeguard-logo.png)
 * - Compact navbar size (~36px mobile, ~40px desktop, within 32-42px)
 * - Retains aspect ratio without stretching, cropping, or distortion
 * - Very subtle ambient violet glow fitting the dark futuristic theme
 * - Subtle hover scale (~1.02) and smooth glow transition
 */
export default function Logo() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavLink
      to="/"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-3 group cursor-pointer select-none"
      aria-label="ChangeGuard Home"
    >
      {/* Official Shield Logo */}
      <div className="relative flex items-center justify-center shrink-0">
        {/* Subtle ambient violet glow */}
        <div 
          className="absolute inset-0 rounded-full bg-primary/25 blur-md pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-75" 
        />
        
        <img
          src="/changeguard-logo.png"
          alt="ChangeGuard"
          className="h-9 w-9 sm:h-10 sm:w-10 object-contain relative z-10 transition-all duration-300 ease-out group-hover:scale-[1.02] drop-shadow-[0_0_8px_rgba(168,85,247,0.35)] group-hover:drop-shadow-[0_0_14px_rgba(168,85,247,0.6)]"
        />
      </div>

      {/* Brand Typography */}
      <span className="font-bold text-lg tracking-wider text-glow transition-all duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]">
        ChangeGuard
      </span>
    </NavLink>
  );
}
