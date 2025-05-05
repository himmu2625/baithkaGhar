/**
 * Global fixes for Next.js ESM compatibility
 * This file is imported by next.config.js
 */

export function applyESMFixes(config, isServer, webpack) {
  // Server-only packages fallbacks for client
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      aws4: false,
      mongoose: false,
    };
  }

  // Improve module resolution for better ESM compatibility
  config.resolve = {
    ...config.resolve,
    // Fix browser field resolution
    mainFields: ["browser", "module", "main"],
    // Add extension preference order
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".mjs"],
  };

  // Simplified chunk splitting for better stability
  config.optimization = {
    ...config.optimization,
    moduleIds: "deterministic",
    runtimeChunk: isServer ? undefined : "single",
  };

  // Fix for ESM modules
  config.module = {
    ...config.module,
    rules: [
      ...config.module.rules,
      {
        test: /\.m?js$/,
        type: "javascript/auto",
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  };

  // Add banner plugin to inject global/exports compatibility
  config.plugins.push(
    new webpack.BannerPlugin({
      banner:
        'if (typeof global === "undefined") { var global = typeof window !== "undefined" ? window : {}; }\n' +
        'if (typeof self === "undefined") { var self = typeof window !== "undefined" ? window : global; }\n' +
        'if (typeof exports === "undefined") { var exports = typeof global.exports !== "undefined" ? global.exports : {}; }\n' +
        'if (typeof module === "undefined") { var module = { exports: exports }; }',
      raw: true,
      entryOnly: false,
    })
  );

  return config;
}
