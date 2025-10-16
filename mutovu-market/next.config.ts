import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      // FIX 1: Allow the public placeholder image
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      // 🔑 FIX 2: Allow the local backend image host
      {
        protocol: 'http', // Use 'http' since your backend is on localhost:8000
        hostname: 'localhost',
        port: '8000', // Explicitly specify the port
        pathname: '/media/**', // You can restrict the path for better security
      },
    ],
  },
};

export default nextConfig;
