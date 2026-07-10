
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Globe, Link as LinkIcon, Target } from 'lucide-react';
import type { Lesson } from '@/hooks/useCourseBuilder';
import { Alert, AlertDescription } from './ui/alert';

interface LessonEditDialogProps {
  lesson: Lesson;
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (moduleId: string, lessonId: string, updatedLesson: Partial<Omit<Lesson, 'id'>>) => void;
}

export function LessonEditDialog({
  lesson,
  moduleId,
  isOpen,
  onClose,
  onSave,
}: LessonEditDialogProps) {
  const [editedLesson, setEditedLesson] = useState<Omit<Lesson, 'id'>>({
    title: '',
    videoUrl: '',
    content: '',
    duration: '10',
    isAssignment: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setEditedLesson({
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        content: lesson.content,
        duration: lesson.duration,
        isAssignment: lesson.isAssignment || false,
      });
    }
  }, [lesson]);

  const handleInputChange = (field: keyof typeof editedLesson, value: string) => {
    setEditedLesson(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    onSave(moduleId, lesson.id, editedLesson);
    setIsSaving(false);
  };

  if (!lesson) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Curriculum Editor: {editedLesson.title}</DialogTitle>
        </DialogHeader>
        
        <Alert className="bg-secondary/50 border-dashed">
          <Globe className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">
            Supported video sources: <strong>YouTube</strong> (watch or share link) and <strong>Google Drive</strong> (share link — file must be set to &quot;Anyone with the link&quot;).
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title</Label>
            <Input
              id="lesson-title"
              value={editedLesson.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/20">
            <div className="space-y-0.5">
              <Label htmlFor="is-assignment" className="text-base flex items-center gap-2 text-accent font-bold">
                <Target className="h-4 w-4" /> Assessment Checkpoint
              </Label>
              <p className="text-sm text-muted-foreground">Require students to submit an external project (e.g. GitHub URL) to pass this lesson.</p>
            </div>
            <Switch
              id="is-assignment"
              checked={editedLesson.isAssignment}
              onCheckedChange={(checked) => setEditedLesson(prev => ({...prev, isAssignment: checked}))}
            />
          </div>
          
          <Tabs defaultValue="video">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="video">Resource Link</TabsTrigger>
              <TabsTrigger value="description">Text Content</TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">Video / Resource URL</Label>
                <div className="relative">
                  <Input
                    id="video-url"
                    placeholder="https://youtu.be/... or https://drive.google.com/file/d/..."
                    value={editedLesson.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    className="pl-10"
                  />
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">YouTube share link or Google Drive share link</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Time (mins)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={editedLesson.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="description" className="pt-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-content">Educational Body Content</Label>
                <Textarea
                  id="lesson-content"
                  rows={12}
                  placeholder="Main text content for the lesson. Markdown supported."
                  value={editedLesson.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Syncing...' : 'Save Curriculum Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
