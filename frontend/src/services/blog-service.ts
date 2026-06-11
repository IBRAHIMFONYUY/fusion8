'use client';

import {
  doc, getDoc, setDoc, deleteDoc, updateDoc,
  increment, serverTimestamp, collection, addDoc,
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

export function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function incrementViews(firestore: Firestore, postId: string) {
  try {
    await updateDoc(doc(firestore, 'blog_posts', postId), {
      views: increment(1),
    });
  } catch (err) {
    console.error('Failed to increment views:', err);
  }
}

export async function incrementShares(firestore: Firestore, postId: string) {
  try {
    await updateDoc(doc(firestore, 'blog_posts', postId), {
      shares: increment(1),
    });
  } catch (err) {
    console.error('Failed to increment shares:', err);
  }
}

export async function toggleLike(
  firestore: Firestore,
  postId: string,
  userId: string
): Promise<boolean> {
  const likeId = `${postId}_${userId}`;
  const likeRef = doc(firestore, 'blog_likes', likeId);
  const likeSnap = await getDoc(likeRef);

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(doc(firestore, 'blog_posts', postId), {
      likes: increment(-1),
    });
    return false;
  } else {
    await setDoc(likeRef, {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(firestore, 'blog_posts', postId), {
      likes: increment(1),
    });
    return true;
  }
}

export async function toggleBookmark(
  firestore: Firestore,
  postId: string,
  userId: string
): Promise<boolean> {
  const bmId = `${postId}_${userId}`;
  const bmRef = doc(firestore, 'blog_bookmarks', bmId);
  const bmSnap = await getDoc(bmRef);

  if (bmSnap.exists()) {
    await deleteDoc(bmRef);
    await updateDoc(doc(firestore, 'blog_posts', postId), {
      bookmarks: increment(-1),
    });
    return false;
  } else {
    await setDoc(bmRef, {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(firestore, 'blog_posts', postId), {
      bookmarks: increment(1),
    });
    return true;
  }
}

export async function checkUserLiked(
  firestore: Firestore,
  postId: string,
  userId: string
): Promise<boolean> {
  const likeRef = doc(firestore, 'blog_likes', `${postId}_${userId}`);
  const snap = await getDoc(likeRef);
  return snap.exists();
}

export async function checkUserBookmarked(
  firestore: Firestore,
  postId: string,
  userId: string
): Promise<boolean> {
  const bmRef = doc(firestore, 'blog_bookmarks', `${postId}_${userId}`);
  const snap = await getDoc(bmRef);
  return snap.exists();
}

export async function addComment(
  firestore: Firestore,
  postId: string,
  userId: string,
  userName: string,
  userPhoto: string,
  content: string
) {
  await addDoc(collection(firestore, 'blog_comments'), {
    postId,
    userId,
    userName,
    userPhoto,
    content: content.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function subscribeNewsletter(
  firestore: Firestore,
  name: string,
  email: string
) {
  const normalizedEmail = email.toLowerCase().trim();
  const docId = normalizedEmail.replace(/[^a-z0-9]/g, '_');
  await setDoc(doc(firestore, 'newsletter_subscribers', docId), {
    name: name.trim(),
    email: normalizedEmail,
    subscribedAt: serverTimestamp(),
  });
}

export function getEngagementScore(post: any): number {
  return (post.views || 0) + (post.likes || 0) * 3 + (post.shares || 0) * 5;
}

export const BLOG_CATEGORIES = [
  'Innovation',
  'Startups',
  'Technology',
  'Engineering',
  'Research',
  'AI',
  'Sustainability',
  'Fusion8 News',
  'Student Projects',
  'Mentor Insights',
  'Funding & Investment',
  'Entrepreneurship',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function getShareUrl(platform: string, url: string, title: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    default:
      return url;
  }
}
