import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Laycal - AI-Powered Sales Calling Platform',
    short_name: 'Laycal',
    description: 'Scale your sales calls with AI agents that work 24/7',
    start_url: '/',
    display: 'standalone',
    background_color: '#1e40af',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}