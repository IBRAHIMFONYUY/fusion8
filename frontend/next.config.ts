import type { NextConfig } from 'next';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Firebase Storage — course thumbnails, avatars, certificates
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      // Dynamic project-specific storage bucket
      ...(storageBucket
        ? [{ protocol: 'https' as const, hostname: storageBucket }]
        : []),
      // DiceBear — generated user avatars
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      // Google user profile photos (OAuth)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // YouTube thumbnails for lesson previews
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      // Unsplash — used in mock/seed data; remove once real assets are uploaded
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Picsum — seed data fallback; remove in Phase 2
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },

  // Enforce strict mode for catching concurrent-mode issues early
  reactStrictMode: true,

  // Bundle size: only server-side packages should stay external
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
