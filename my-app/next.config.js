/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
        pathname: "/de9ivnm52/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    unoptimized: true,
  },

  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons", "framer-motion", "date-fns"],
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },

  output: "standalone",

  env: {
    NEXT_PUBLIC_DISABLE_SSG: "true",
    NEXT_DISABLE_STATIC_GENERATION: "true",
  },

  distDir: ".next",

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 5,
  },

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      mongoose: false,
    }

    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    })

    return config
  },
}

export default nextConfig
