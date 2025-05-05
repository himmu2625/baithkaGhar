/**
 * Global polyfills for browser compatibility
 * This file should be imported in _app.js or layout.js
 */

// Polyfill function for browser compatibility
export function applyPolyfills() {
  if (typeof window !== "undefined") {
    // Polyfill global objects
    window.global = window;
    window.self = window;

    // Fix for process and Buffer references
    if (typeof window.process === "undefined") {
      window.process = { env: { NODE_ENV: process.env.NODE_ENV } };
    }

    // Ensure fetch is polyfilled if needed
    if (!window.fetch) {
      console.warn(
        "Fetch API is not available in this browser and needs to be polyfilled"
      );
    }

    // Ensure Promise is available
    if (!window.Promise) {
      console.warn(
        "Promise API is not available in this browser and needs to be polyfilled"
      );
    }
  }
}

// Default export for easy importing
export default applyPolyfills;
