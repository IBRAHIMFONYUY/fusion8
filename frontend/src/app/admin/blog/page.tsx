'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Clock, Share2, Users, Download, Heart, Bookmark, TrendingUp
} from 'lucide-react';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection, query, orderBy, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { BLOG_CATEGORIES, generateSlug } from '@/services/blog-service';

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
  views?: number;
  likes?: number;
  shares?: number;
  createdAt?: any;
  publishedAt?: any;
}

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  category: BLOG_CATEGORIES[0] as string,
  tags: '',
  status: 'draft' as PostStatus,
};

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

  const [activeTab, setActiveTab] = useState('overview');
  const [view, setView] = useState<'main' | 'editor'>('main');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [previewMode, setPreviewMode] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  // Real-time posts
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'blog_posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  
  const { data: rawPosts, isLoading } = useCollection(postsQuery);

  // Load subscribers
  useEffect(() => {
    if (!firestore) return;
    getDocs(collection(firestore, 'newsletter_subscribers')).then(snap => {
      setSubscribers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [firestore]);

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
    views: p.views || 0,
    likes: p.likes || 0,
    shares: p.shares || 0,
    createdAt: p.createdAt,
    publishedAt: p.publishedAt,
  }));

  const published = posts.filter(p => p.status === 'published');
  const drafts = posts.filter(p => p.status === 'draft');
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0);
  const mostViewed = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0))[0];

  useEffect(() => {
    if (!editingId) {
      setForm(f => ({ ...f, slug: generateSlug(f.title) }));
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
      toast({ variant: 'destructive', title: 'Title required' });
      return;
    }

    setSaving(true);
    try {
      const status: PostStatus = publishNow ? 'published' : form.status;
      const payload = {
        title: form.title.trim(),
        slug: form.slug || generateSlug(form.title),
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
        toast({ title: publishNow ? 'Post published!' : 'Post updated' });
      } else {
        await addDoc(collection(firestore, 'blog_posts'), {
          ...payload,
          views: 0,
          likes: 0,
          shares: 0,
          createdAt: serverTimestamp(),
        });
        toast({ title: publishNow ? 'Post published!' : 'Draft saved' });
      }
      setView('main');
    } catch {
      toast({ variant: 'destructive', title: 'Save failed' });
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
      toast({ title: newStatus === 'published' ? 'Published' : 'Moved to draft' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update' });
    }
  }

  async function handleDelete(postId: string) {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'blog_posts', postId));
      toast({ title: 'Post deleted' });
    } catch {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  }

  function exportSubscribers() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Date\n"
      + subscribers.map(s => `${s.name},${s.email},${s.subscribedAt ? format(s.subscribedAt.toDate(), 'yyyy-MM-dd') : ''}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subscribers.csv");
    document.body.appendChild(link);
    link.click();
  }

  // ── EDITOR VIEW ─────────────────────────────────────────────────────────────

  if (view === 'editor') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border sticky top-4 z-10 shadow-sm">
          <button onClick={() => setView('main')} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} className="rounded-xl h-9 gap-2">
              {previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving} className="rounded-xl h-9">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Save Draft
            </Button>
            <Button size="sm" onClick={() => handleSave(true)} disabled={saving} className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-9">
              {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Globe className="mr-2 h-3.5 w-3.5" />} Publish
            </Button>
          </div>
        </div>

        {previewMode ? (
          <div className="bg-card p-8 rounded-2xl border border-border prose prose-slate max-w-none dark:prose-invert">
            {form.coverImageUrl && <img src={form.coverImageUrl} alt="Cover" className="w-full aspect-video object-cover rounded-xl mb-8" />}
            <Badge className="mb-4">{form.category}</Badge>
            <h1 className="text-4xl font-black mb-4">{form.title || 'Untitled Post'}</h1>
            <p className="text-xl text-muted-foreground mb-8">{form.excerpt}</p>
            <div className="whitespace-pre-wrap font-mono text-sm">{form.content}</div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <Card className="border border-border bg-card rounded-2xl">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="text-lg font-bold h-12 rounded-xl" placeholder="Article title..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Excerpt ({form.excerpt.length}/200)</Label>
                    <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value.slice(0, 200) }))} className="rounded-xl resize-none" rows={3} placeholder="Brief summary..." />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Markdown Content</Label>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setForm(f => ({...f, content: f.content + '\n## Heading 2\n'}))}>H2</Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setForm(f => ({...f, content: f.content + '\n**Bold Text**\n'}))}>Bold</Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setForm(f => ({...f, content: f.content + '\n[Link Text](https://)\n'}))}>Link</Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setForm(f => ({...f, content: f.content + '\n![Alt Text](https://)\n'}))}>Image</Button>
                      </div>
                    </div>
                    <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="rounded-xl resize-y font-mono text-sm leading-relaxed min-h-[500px]" placeholder="Write with Markdown..." />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="border border-border bg-card rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                    <Select value={form.status} onValueChange={(v: PostStatus) => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BLOG_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Slug</Label>
                    <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="rounded-xl font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags (comma-separated)</Label>
                    <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="rounded-xl text-sm" placeholder="AI, startup, hardware..." />
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cover Image URL</Label>
                  <Input value={form.coverImageUrl} onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))} className="rounded-xl text-sm" placeholder="https://..." />
                  {form.coverImageUrl && <div className="aspect-video rounded-xl bg-muted overflow-hidden mt-2"><img src={form.coverImageUrl} className="w-full h-full object-cover" /></div>}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MAIN VIEW ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7 pb-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-headline tracking-tight">Knowledge Hub CMS</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage articles, subscribers, and analytics.</p>
        </div>
        <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-10 px-5 shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border h-12 rounded-xl p-1 w-full max-w-md grid grid-cols-3">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-white">Posts</TabsTrigger>
          <TabsTrigger value="newsletter" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-white">Newsletter</TabsTrigger>
        </TabsList>

        {/* ══ OVERVIEW TAB ══ */}
        <TabsContent value="overview" className="pt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border bg-card rounded-2xl"><CardContent className="p-5"><div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mb-3"><Newspaper className="h-4 w-4 text-accent" /></div><div className="text-2xl font-black">{posts.length}</div><p className="text-xs text-muted-foreground font-bold uppercase">Total Posts</p></CardContent></Card>
            <Card className="border-border bg-card rounded-2xl"><CardContent className="p-5"><div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mb-3"><Globe className="h-4 w-4 text-green-500" /></div><div className="text-2xl font-black">{published.length}</div><p className="text-xs text-muted-foreground font-bold uppercase">Published</p></CardContent></Card>
            <Card className="border-border bg-card rounded-2xl"><CardContent className="p-5"><div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3"><Eye className="h-4 w-4 text-blue-500" /></div><div className="text-2xl font-black">{totalViews}</div><p className="text-xs text-muted-foreground font-bold uppercase">Total Views</p></CardContent></Card>
            <Card className="border-border bg-card rounded-2xl"><CardContent className="p-5"><div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3"><Users className="h-4 w-4 text-purple-500" /></div><div className="text-2xl font-black">{subscribers.length}</div><p className="text-xs text-muted-foreground font-bold uppercase">Subscribers</p></CardContent></Card>
          </div>
          {mostViewed && (
            <Card className="border border-border bg-card rounded-2xl">
              <CardHeader className="pb-3 border-b border-border"><CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent"/> Top Performing Article</CardTitle></CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-6 items-center">
                  <div className="w-32 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                    {mostViewed.coverImageUrl ? <img src={mostViewed.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/5 flex items-center justify-center"><span className="text-xl font-black text-accent/20">F8</span></div>}
                  </div>
                  <div>
                    <h3 className="text-lg font-black mb-2">{mostViewed.title}</h3>
                    <div className="flex gap-4 text-sm font-bold">
                      <span className="flex items-center gap-1 text-blue-500"><Eye className="h-4 w-4"/> {mostViewed.views} Views</span>
                      <span className="flex items-center gap-1 text-pink-500"><Heart className="h-4 w-4"/> {mostViewed.likes} Likes</span>
                      <span className="flex items-center gap-1 text-green-500"><Share2 className="h-4 w-4"/> {mostViewed.shares} Shares</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══ POSTS TAB ══ */}
        <TabsContent value="posts" className="pt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : posts.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-border rounded-2xl bg-card">
              <Newspaper className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-bold">No posts yet</p>
            </div>
          ) : (
            posts.map(post => (
              <Card key={post.id} className="border border-border bg-card rounded-2xl hover:border-accent/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl bg-muted overflow-hidden shrink-0">
                    {post.coverImageUrl ? <img src={post.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/5 flex items-center justify-center"><BookOpen className="h-6 w-6 text-accent/20" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-sm truncate">{post.title}</h3>
                      <StatusBadge status={post.status} />
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold">
                      <span className="bg-secondary px-2 py-0.5 rounded-md">{post.category}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3"/>{post.views}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3"/>{post.likes}</span>
                      <span>{post.publishedAt ? formatDistanceToNow(post.publishedAt.toDate(), {addSuffix: true}) : 'Draft'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleTogglePublish(post)} className="h-8 w-8 p-0" title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                      {post.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(post)} className="h-8 w-8 p-0 hover:text-accent"><Edit3 className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader><AlertDialogTitle>Delete Post?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(post.id)} className="rounded-xl bg-destructive text-white">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ══ NEWSLETTER TAB ══ */}
        <TabsContent value="newsletter" className="pt-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-lg">Subscribers ({subscribers.length})</h3>
            <Button variant="outline" size="sm" onClick={exportSubscribers} className="rounded-xl gap-2 font-bold">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          <Card className="border border-border bg-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border text-left">
                <tr><th className="px-6 py-3 font-bold text-xs uppercase text-muted-foreground">Name</th><th className="px-6 py-3 font-bold text-xs uppercase text-muted-foreground">Email</th><th className="px-6 py-3 font-bold text-xs uppercase text-muted-foreground">Subscribed</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map(s => (
                  <tr key={s.id} className="hover:bg-secondary/20">
                    <td className="px-6 py-4 font-medium">{s.name || 'Anonymous'}</td>
                    <td className="px-6 py-4">{s.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{s.subscribedAt ? formatDistanceToNow(s.subscribedAt.toDate(), {addSuffix: true}) : 'Unknown'}</td>
                  </tr>
                ))}
                {subscribers.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No subscribers yet.</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
