import { Variants } from 'framer-motion';

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Card stagger variants
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Fade variants
export const fadeVariants: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Slide up variants
export const slideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Scale variants
export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Stagger container variants
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

// Stagger item variants
export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Sidebar variants
export const sidebarVariants: Variants = {
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 40
    }
  },
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 40
    }
  }
};

// Modal variants
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      duration: 0.4,
      bounce: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Backdrop variants
export const backdropVariants: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Layout transition variants
export const layoutVariants: Variants = {
  collapsed: {
    width: '72px',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  expanded: {
    width: '280px',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Content fade variants for sidebar collapse
export const contentFadeVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      delay: 0.1,
      ease: 'easeOut'
    }
  }
};

// Hover and tap gesture variants
export const buttonVariants: Variants = {
  initial: {
    scale: 1
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeIn'
    }
  }
};

// Card hover variants
export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 0 0 rgba(168, 85, 247, 0)'
  },
  hover: {
    y: -2,
    boxShadow: '0 10px 25px rgba(168, 85, 247, 0.1)',
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};

// Loading spinner variants
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Pulse variants for loading states
export const pulseVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};