'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    media.addEventListener('change', listener);

    return () => {
      window.removeEventListener('resize', listener);
      media.removeEventListener('change', listener);
    };
  }, [matches, query]);

  return matches;
}

// Predefined breakpoint hooks
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsLarge = () => useMediaQuery('(min-width: 1280px)');

// Touch device detection
export const useIsTouch = () => useMediaQuery('(pointer: coarse)');

// Motion preference detection
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

// Color scheme detection
export const usePrefersDark = () => useMediaQuery('(prefers-color-scheme: dark)');

// High contrast detection
export const usePrefersHighContrast = () => useMediaQuery('(prefers-contrast: high)');