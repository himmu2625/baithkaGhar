// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Improved image optimization
  images: {
    domains: [
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "images.pexels.com",
      "plus.unsplash.com",
      "images.unsplash.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/de9ivnm52/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Set default image quality to reduce initial load size
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Global settings for server components
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
    optimizeCss: true, // Enable CSS optimization
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "date-fns",
    ],
    // Enhanced server components
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },

  // Force every page to be server-side rendered
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Explicitly mark the project as server-rendered
  // This prevents static export errors
  output: "standalone",

  // Disable static generation completely
  env: {
    NEXT_PUBLIC_DISABLE_SSG: "true",
    NEXT_DISABLE_STATIC_GENERATION: "true",
  },

  // Override output modes for static export
  // This explicitly disables static generation for all routes
  distDir: ".next",

  // Enable additional performance options
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Improve runtime performance
  onDemandEntries: {
    // Number of pages to keep in memory
    maxInactiveAge: 15 * 1000,
    // Number of pages to cache
    pagesBufferLength: 5,
  },

  webpack: (config, { isServer }) => {
    // Add polyfills for Node.js modules used in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      mongoose: false,
    };

    // Fix ESM modules
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

    return config;
  },
};

export default nextConfig;
