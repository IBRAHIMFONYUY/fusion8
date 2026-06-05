'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Newspaper, Plus, Edit3, Trash2, Eye, EyeOff, Loader2,
  ArrowLeft, Calendar, Tag, BookOpen, Globe, FileText,
  CheckCircle2, Clock,
} from 'lucide-react';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection, query, orderBy, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

type PostStatus = 'draft' | 'published';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  tags: string[];
  status: PostStatus;
  authorId: string;
  authorName: string;
  createdAt?: any;
  publishedAt?: any;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const CATEGORIES = [
  'Engineering', 'Robotics', 'AI & ML', 'Startup Insights',
  'Student Stories', 'Platform News', 'Hardware', 'Community',
];

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  category: 'Platform News',
  tags: '',
  status: 'draft' as PostStatus,
};

// ── Components ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PostStatus }) {
  return status === 'published' ? (
    <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-lg">
      <Globe className="h-3 w-3" /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 bg-secondary text-muted-foreground text-[10px] font-bold px-2 py-1 rounded-lg">
      <FileText className="h-3 w-3" /> Draft
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
  const { user, firestore } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [previewMode, setPreviewMode] = useState(false);

  // Real-time posts from Firestore
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'blog_posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: rawPosts, isLoading } = useCollection(postsQuery);

  const posts: BlogPost[] = (rawPosts ?? []).map((p: any) => ({
    id: p.id,
    title: p.title ?? '',
    slug: p.slug ?? '',
    excerpt: p.excerpt ?? '',
    content: p.content ?? '',
    coverImageUrl: p.coverImageUrl ?? '',
    category: p.category ?? '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    status: p.status ?? 'draft',
    authorId: p.authorId ?? '',
    authorName: p.authorName ?? '',
    createdAt: p.createdAt,
    publishedAt: p.publishedAt,
  }));

  const published = posts.filter(p => p.status === 'published');
  const drafts = posts.filter(p => p.status === 'draft');

  // Auto-generate slug from title
  useEffect(() => {
    if (!editingId) {
      setForm(f => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, editingId]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setPreviewMode(false);
    setView('editor');
  }

  function openEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      category: post.category,
      tags: post.tags.join(', '),
      status: post.status,
    });
    setPreviewMode(false);
    setView('editor');
  }

  async function handleSave(publishNow?: boolean) {
    if (!firestore || !user) return;
    if (!form.title.trim()) {
      toast({ variant: 'destructive', title: 'Title required', description: 'Add a title before saving.' });
      return;
    }

    setSaving(true);
    try {
      const status: PostStatus = publishNow ? 'published' : form.status;
      const payload = {
        title: form.title.trim(),
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        coverImageUrl: form.coverImageUrl.trim(),
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        status,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Admin',
        publishedAt: publishNow ? serverTimestamp() : (editingId ? undefined : null),
      };

      if (editingId) {
        await updateDoc(doc(firestore, 'blog_posts', editingId), payload);
        toast({ title: publishNow ? 'Post published!' : 'Post updated', description: `"${form.title}" has been saved.` });
      } else {
        await addDoc(collection(firestore, 'blog_posts'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: publishNow ? 'Post published!' : 'Draft saved', description: `"${form.title}" is now ${status}.` });
      }
      setView('list');
    } catch {
      toast({ variant: 'destructive', title: 'Save failed', description: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(post: BlogPost) {
    if (!firestore) return;
    const newStatus: PostStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(firestore, 'blog_posts', post.id), {
        status: newStatus,
        publishedAt: newStatus === 'published' ? serverTimestamp() : null,
      });
      toast({ title: newStatus === 'published' ? 'Published' : 'Moved to draft', description: post.title });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update' });
    }
  }

  async function handleDelete(postId: string, title: string) {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'blog_posts', postId));
      toast({ title: 'Post deleted', description: `"${title}" has been removed.` });
    } catch {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  }

  // ── EDITOR VIEW ─────────────────────────────────────────────────────────────

  if (view === 'editor') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">

        {/* Editor toolbar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to posts
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(p => !p)}
              className="rounded-xl h-9 gap-2"
            >
              {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave()}
              disabled={saving}
              className="rounded-xl h-9"
            >
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-9 px-5"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving…</>
              ) : (
                <><Globe className="mr-2 h-3.5 w-3.5" /> Publish</>
              )}
            </Button>
          </div>
        </div>

        {previewMode ? (
          /* ── PREVIEW MODE ─────────────────────────────────────────────────── */
          <div className="space-y-6">
            {form.coverImageUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
                <img src={form.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                  {form.category}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold font-headline leading-tight mb-3">
                {form.title || 'Untitled Post'}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">{form.excerpt}</p>
              <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-foreground border-t border-border pt-6">
                {form.content || <span className="text-muted-foreground italic">No content yet…</span>}
              </div>
              {form.tags && (
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border">
                  {form.tags.split(',').filter(Boolean).map(t => (
                    <Badge key={t} variant="outline" className="text-xs rounded-lg">{t.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── EDIT MODE ────────────────────────────────────────────────────── */
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Main editor */}
            <div className="lg:col-span-2 space-y-5">
              <Card className="border border-border bg-card rounded-2xl">
                <CardContent className="p-6 space-y-5">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Post Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Write a compelling headline…"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="text-lg font-bold h-12 rounded-xl border-border"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      URL Slug
                    </Label>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground font-mono">/blog/</span>
                      <Input
                        value={form.slug}
                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                        className="flex-1 font-mono text-sm h-9 rounded-xl border-border"
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Excerpt
                      </Label>
                      <span className="text-[10px] text-muted-foreground">{form.excerpt.length}/200</span>
                    </div>
                    <Textarea
                      placeholder="A short summary shown on the blog listing page…"
                      value={form.excerpt}
                      onChange={e => setForm(f => ({ ...f, excerpt: e.target.value.slice(0, 200) }))}
                      rows={3}
                      className="rounded-xl resize-none text-sm border-border"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Content
                      </Label>
                      <span className="text-[10px] text-muted-foreground">{form.content.length} chars</span>
                    </div>
                    <Textarea
                      placeholder="Write your post here. Plain text and line breaks are preserved."
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      rows={20}
                      className="rounded-xl resize-y text-sm font-mono leading-relaxed border-border"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar settings */}
            <div className="space-y-4">
              {/* Status */}
              <Card className="border border-border bg-card rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-sm font-bold">Post Settings</h3>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v: PostStatus) => setForm(f => ({ ...f, status: v }))}
                    >
                      <SelectTrigger className="h-9 rounded-xl text-sm border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={v => setForm(f => ({ ...f, category: v }))}
                    >
                      <SelectTrigger className="h-9 rounded-xl text-sm border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tags
                    </Label>
                    <Input
                      placeholder="robotics, AI, hardware…"
                      value={form.tags}
                      onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      className="h-9 rounded-xl text-sm border-border"
                    />
                    <p className="text-[10px] text-muted-foreground">Comma-separated</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cover image */}
              <Card className="border border-border bg-card rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold">Cover Image</h3>
                  <Input
                    placeholder="https://… (image URL)"
                    value={form.coverImageUrl}
                    onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))}
                    className="h-9 rounded-xl text-sm border-border"
                  />
                  {form.coverImageUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-muted mt-2">
                      <img
                        src={form.coverImageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-headline tracking-tight">Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage posts for the FUSION8 blog.
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-10 px-5 shadow-lg shadow-accent/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Posts', value: posts.length, icon: Newspaper, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Published', value: published.length, icon: Globe, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/15' },
          { label: 'Drafts', value: drafts.length, icon: FileText, color: 'text-muted-foreground', bg: 'bg-secondary' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
              </div>
              <div className="text-2xl font-extrabold font-headline">{s.value}</div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="border border-dashed border-border bg-card rounded-2xl">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Newspaper className="h-10 w-10 mx-auto mb-4 text-muted-foreground/25" />
            <p className="font-semibold text-sm">No posts yet.</p>
            <p className="text-xs mt-1">Create your first blog post to share with the community.</p>
            <Button
              onClick={openNew}
              size="sm"
              className="mt-5 bg-accent hover:bg-accent/90 text-white rounded-xl"
            >
              <Plus className="mr-2 h-3.5 w-3.5" /> Write First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card
              key={post.id}
              className="border border-border bg-card rounded-2xl hover:border-accent/30 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Cover thumbnail */}
                  {post.coverImageUrl ? (
                    <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-14 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-accent/50" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm leading-snug line-clamp-1">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.excerpt || 'No excerpt'}</p>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="bg-secondary text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {post.createdAt
                          ? formatDistanceToNow(post.createdAt.toDate?.() ?? new Date(), { addSuffix: true })
                          : 'Just now'}
                      </span>
                      {post.tags.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          {post.tags.slice(0, 2).join(', ')}
                          {post.tags.length > 2 && ` +${post.tags.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(post)}
                      className="h-8 w-8 p-0 rounded-lg"
                      title={post.status === 'published' ? 'Move to draft' : 'Publish'}
                    >
                      {post.status === 'published'
                        ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                        : <Globe className="h-4 w-4 text-green-600" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(post)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-accent/10"
                    >
                      <Edit3 className="h-4 w-4 text-accent" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{post.title}" will be permanently deleted and removed from the blog.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(post.id, post.title)}
                            className="bg-destructive hover:bg-destructive/90 text-white rounded-xl"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
