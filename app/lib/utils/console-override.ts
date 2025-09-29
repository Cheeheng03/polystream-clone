export const disableConsoleInProduction = () => {
    if (process.env.NODE_ENV === 'production') {
      const noop = () => {};
      
      // Store original methods in case you need them for debugging
      (window as any).__originalConsole = {
        log: console.log,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
      };
      
      // Override console methods
      console.log = noop;
      console.warn = noop;
      console.info = noop;
      console.debug = noop;
      // Keep console.error for critical issues
    }
  };