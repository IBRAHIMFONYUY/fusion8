import type { MetadataRoute } from 'next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/firebase';

const BASE_URL = 'https://fusion8.tech';

// Static public routes — always indexed
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
  { url: `${BASE_URL}/courses`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE_URL}/projects`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/academy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/accelerator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/incubator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/labs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/community`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/apply`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/become-instructor`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/subscribe`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamic: MetadataRoute.Sitemap = [];

  try {
    // Published courses
    const coursesSnap = await getDocs(
      query(collection(firestore, 'courses'), where('status', '==', 'published'))
    );
    coursesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const lastMod = data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? new Date();
      dynamic.push({
        url: `${BASE_URL}/courses/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // Active / in-progress projects
    const projectsSnap = await getDocs(
      query(
        collection(firestore, 'projects'),
        where('status', 'in', ['recruiting', 'in_progress'])
      )
    );
    projectsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const lastMod = data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? new Date();
      dynamic.push({
        url: `${BASE_URL}/projects/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // Published blog posts
    const blogSnap = await getDocs(
      query(collection(firestore, 'blog_posts'), where('published', '==', true))
    );
    blogSnap.docs.forEach((doc) => {
      const data = doc.data();
      const lastMod = data.updatedAt?.toDate?.() ?? data.publishedAt?.toDate?.() ?? new Date();
      dynamic.push({
        url: `${BASE_URL}/blog/${data.slug ?? doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });
  } catch {
    // Sitemap generation runs at build time / on-demand — network errors should not
    // break the build. We fall back to static routes only.
  }

  return [...STATIC_ROUTES, ...dynamic];
}
