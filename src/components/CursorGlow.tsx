import React, { useEffect, useRef } from 'react';
import { useProject } from '../context/ProjectContext';

/**
 * CursorGlow
 * Subtle futuristic purple ambient glow that smoothly follows the cursor.
 * - Uses requestAnimationFrame with linear interpolation (lerp) for smooth lag/catch-up
 * - Pure CSS variable transform updates directly on DOM nodes (0 React re-renders)
 * - pointer-events: none ensures zero interference with clicks, selections, or graph interactions
 * - Fully disabled on touch / mobile devices and respects prefers-reduced-motion and user settings
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const { settings } = useProject();

  useEffect(() => {
    if (!settings.cursorGlow) return;

    // Check for touch device or coarse pointer
    const isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    // Check prefers-reduced-motion or settings.reducedMotion
    const prefersReducedMotion = 
      settings.reducedMotion || 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouchDevice || prefersReducedMotion) {
      return;
    }

    const glowEl = glowRef.current;
    if (!glowEl) return;

    // Current mouse coordinates and smoothed glow coordinates
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isVisible = false;
    let isHoveringInteractive = false;
    let animationFrameId: number;

    // Linear interpolation factor (subtle magnetic lag)
    const lerpFactor = 0.12;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        glowEl.style.opacity = '1';
      }

      // Check if cursor is over a button or interactive link
      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest('button, a, input, select, textarea, [role="button"]');
      if (interactive !== isHoveringInteractive) {
        isHoveringInteractive = interactive;
        if (isHoveringInteractive) {
          glowEl.style.setProperty('--glow-scale', '0.85');
          glowEl.style.setProperty('--glow-opacity', '0.22');
        } else {
          glowEl.style.setProperty('--glow-scale', '1');
          glowEl.style.setProperty('--glow-opacity', '0.14');
        }
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
      glowEl.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      isVisible = true;
      glowEl.style.opacity = '1';
    };

    const animate = () => {
      // Interpolate towards mouse position
      currentX += (mouseX - currentX) * lerpFactor;
      currentY += (mouseY - currentY) * lerpFactor;

      glowEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(var(--glow-scale, 1))`;

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [settings.cursorGlow, settings.reducedMotion]);

  if (!settings.cursorGlow) return null;

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-40 will-change-transform opacity-0 transition-opacity duration-500 ease-out"
      style={
        {
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(168, 85, 247, var(--glow-opacity, 0.14)) 0%, rgba(147, 51, 234, calc(var(--glow-opacity, 0.14) * 0.6)) 30%, rgba(126, 34, 206, calc(var(--glow-opacity, 0.14) * 0.2)) 55%, transparent 70%)',
          filter: 'blur(32px)',
          mixBlendMode: 'screen',
        } as React.CSSProperties
      }
    />
  );
}
