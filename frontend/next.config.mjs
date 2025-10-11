import { fileURLToPath } from 'url';
import { dirname } from 'path';

/** @type {import('next').NextConfig} */
const configDir = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // Development server configuration
  devIndicators: {
    position: 'bottom-right',
  },
  
  // Disable ESLint during production builds to allow current code to compile
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['next/font/google'],
  },
  
  // Development server security configuration
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
  ],
  
  // Allow development origins for CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // Webpack configuration to handle Firebase messaging
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Firebase messaging from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        'firebase/messaging': 'commonjs firebase/messaging'
      });
    }
    return config;
  },

  // Turbopack configuration
  turbopack: {
    // Explicitly set the workspace root to the frontend directory
    root: configDir,
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
