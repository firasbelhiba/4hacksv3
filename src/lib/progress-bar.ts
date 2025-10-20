import NProgress from 'nprogress';

// Configure NProgress
NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
  trickleSpeed: 200,
  parent: 'body'
});

// Custom styles for the progress bar
const injectStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Progress bar */
    #nprogress {
      pointer-events: none;
    }

    #nprogress .bar {
      background: linear-gradient(90deg, #a855f7, #8b5cf6, #7c3aed);
      position: fixed;
      z-index: 9999;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      box-shadow: 0 0 10px #a855f7, 0 0 5px #a855f7;
    }

    /* Peg */
    #nprogress .peg {
      display: block;
      position: absolute;
      right: 0px;
      width: 100px;
      height: 100%;
      box-shadow: 0 0 10px #a855f7, 0 0 5px #a855f7;
      opacity: 1.0;
      transform: rotate(3deg) translate(0px, -4px);
    }

    /* Remove spinner */
    #nprogress .spinner {
      display: none;
    }

    /* Fancy blur bars */
    #nprogress .bar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #a855f7, #8b5cf6, #7c3aed);
      filter: blur(5px);
      opacity: 0.7;
      z-index: -1;
    }
  `;
  document.head.appendChild(style);
};

// Initialize progress bar styling
if (typeof window !== 'undefined') {
  injectStyles();
}

export class ProgressBar {
  private static timer: NodeJS.Timeout | null = null;

  static start() {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Add a small delay to prevent flash for fast navigation
    this.timer = setTimeout(() => {
      NProgress.start();
    }, 150);
  }

  static done() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    NProgress.done();
  }

  static set(progress: number) {
    NProgress.set(progress);
  }

  static inc() {
    NProgress.inc();
  }
}

export default ProgressBar;