'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input[type="text"]:not([disabled])',
  'input[type="radio"]:not([disabled])',
  'input[type="checkbox"]:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(FOCUSABLE_ELEMENTS);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    // Focus first element when trap becomes active
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

export function useEscapeKey(handler: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handler, isActive]);
}

export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, isActive]);
}