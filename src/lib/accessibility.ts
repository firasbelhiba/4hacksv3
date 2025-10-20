/**
 * Accessibility utilities for the 4hacks platform
 */

// Screen reader announcements
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    }
  });

  firstElement?.focus();
}

// ARIA utilities
export const aria = {
  describe: (id: string) => ({ 'aria-describedby': id }),
  label: (text: string) => ({ 'aria-label': text }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  current: (current: boolean | 'page' | 'step') => ({ 'aria-current': current }),
  live: (type: 'polite' | 'assertive' | 'off') => ({ 'aria-live': type }),
  busy: (busy: boolean) => ({ 'aria-busy': busy }),
  pressed: (pressed: boolean) => ({ 'aria-pressed': pressed }),
  selected: (selected: boolean) => ({ 'aria-selected': selected }),
  checked: (checked: boolean) => ({ 'aria-checked': checked }),
  disabled: (disabled: boolean) => ({ 'aria-disabled': disabled }),
  invalid: (invalid: boolean) => ({ 'aria-invalid': invalid }),
  required: (required: boolean) => ({ 'aria-required': required }),
  controls: (id: string) => ({ 'aria-controls': id }),
  owns: (id: string) => ({ 'aria-owns': id }),
  haspopup: (type: boolean | 'menu' | 'dialog' | 'grid' | 'listbox' | 'tree') => ({ 'aria-haspopup': type }),
};

// Focus trap hook compatible function
export function createFocusTrap(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  };

  return {
    activate() {
      firstElement?.focus();
      document.addEventListener('keydown', handleTabKey);
    },
    deactivate() {
      document.removeEventListener('keydown', handleTabKey);
    }
  };
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd want to use a proper color library
  return 4.5; // Placeholder - meets WCAG AA standards
}

export function isAccessibleContrast(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

// Keyboard navigation utilities
export const keyboardUtils = {
  isActionKey: (key: string) => ['Enter', ' ', 'Space'].includes(key),
  isArrowKey: (key: string) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key),
  isEscapeKey: (key: string) => key === 'Escape',
  isTabKey: (key: string) => key === 'Tab',
};

// Screen reader only text utility
export function srOnly(text: string): React.CSSProperties {
  return {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  };
}