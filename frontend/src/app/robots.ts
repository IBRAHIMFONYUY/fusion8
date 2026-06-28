import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Never index authenticated portals or internal pages
        disallow: [
          '/student/',
          '/teacher/',
          '/admin/',
          '/unauthorized',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://fusion8.tech/sitemap.xml',
    host: 'https://fusion8.tech',
  };
}
