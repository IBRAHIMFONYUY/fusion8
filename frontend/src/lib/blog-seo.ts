import { Metadata } from 'next';

interface BlogPostSEO {
  title: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  ogImage?: string;
  coverImageUrl?: string;
  slug: string;
  authorName?: string;
  publishedAt?: any;
  category?: string;
  tags?: string[];
}

const SITE_URL = 'https://fusion8.tech';
const SITE_NAME = 'Fusion 8';

export function generateArticleMetadata(post: BlogPostSEO): Metadata {
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || `Read "${post.title}" on the Fusion 8 Blog.`;
  const image = post.ogImage || post.coverImageUrl;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    keywords: [
      ...(post.tags || []),
      post.category,
      post.focusKeyword,
      'Fusion 8',
      'engineering',
      'Cameroon',
      'innovation',
    ].filter(Boolean) as string[],
    authors: post.authorName ? [{ name: post.authorName }] : [{ name: SITE_NAME }],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: post.title }] } : {}),
      ...(post.publishedAt ? {
        publishedTime: new Date(
          post.publishedAt.seconds ? post.publishedAt.seconds * 1000 : post.publishedAt
        ).toISOString(),
      } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateArticleJsonLd(post: BlogPostSEO): object {
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt.seconds ? post.publishedAt.seconds * 1000 : post.publishedAt).toISOString()
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    image: post.ogImage || post.coverImageUrl || '',
    author: {
      '@type': 'Person',
      name: post.authorName || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    url: `${SITE_URL}/blog/${post.slug}`,
    ...(publishedDate ? { datePublished: publishedDate } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };
}
