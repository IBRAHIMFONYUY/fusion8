
'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCourseBuilder } from '@/hooks/useCourseBuilder';
import { useToast } from '@/hooks/use-toast';
import { GripVertical, PlusCircle, Trash2, Upload, Edit, Loader2, BookOpen, ImageIcon, Send, RefreshCcw, Link as LinkIcon, X } from 'lucide-react';
import type { Lesson, Module, CourseCategory, CourseLevel } from '@/hooks/useCourseBuilder';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { LessonEditDialog } from '@/components/lesson-edit-dialog';
import { lmsService } from '@/services/lms-service';
import { useAuth } from '@/firebase';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouter, useSearchParams } from 'next/navigation';
import { notificationService } from '@/services/notification-service';

const SortableLessonItem = ({
  lesson,
  moduleId,
  onRemove,
  onEdit,
}: {
  lesson: Lesson;
  moduleId: string;
  onRemove: (moduleId: string, lessonId: string) => void;
  onEdit: (lesson: Lesson, moduleId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-2 sm:p-4 rounded-lg bg-background relative flex justify-between items-center ml-4 sm:ml-10 border">
      <div className="flex items-center gap-2 flex-grow">
        <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        <span className="font-medium">{lesson.title}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(lesson, moduleId)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this lesson?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the lesson titled "{lesson.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(moduleId, lesson.id)} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};


const SortableModuleItem = ({
  module,
  onUpdate,
  onRemove,
  onAddLesson,
  onRemoveLesson,
  setLessonsForModule,
  onEditLesson,
}: {
  module: Module;
  onUpdate: (moduleId: string, title: string) => void;
  onRemove: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onRemoveLesson: (moduleId: string, lessonId: string) => void;
  setLessonsForModule: (moduleId: string, lessons: Lesson[]) => void;
  onEditLesson: (lesson: Lesson, moduleId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = module.lessons.findIndex(l => l.id === active.id);
      const newIndex = module.lessons.findIndex(l => l.id === over!.id);
      const reorderedLessons = arrayMove(module.lessons, oldIndex, newIndex);
      setLessonsForModule(module.id, reorderedLessons);
    }
  }


  return (
    <div ref={setNodeRef} style={style} className="border p-4 rounded-lg space-y-4 bg-secondary/50">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 w-full">
           <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            className="text-lg font-semibold border-none focus-visible:ring-0 p-1 bg-transparent"
            value={module.title}
            onChange={(e) => onUpdate(module.id, e.target.value)}
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this module?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone and will delete all lessons within "{module.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(module.id)} className="bg-destructive hover:bg-destructive/90">
                Delete Module
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
       <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
        <SortableContext items={module.lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 pl-6">
                {module.lessons.map((lesson) => (
                    <SortableLessonItem
                        key={lesson.id}
                        lesson={lesson}
                        moduleId={module.id}
                        onRemove={onRemoveLesson}
                        onEdit={onEditLesson}
                    />
                ))}
            </div>
        </SortableContext>
      </DndContext>
      
      <div className="pl-6">
          <Button variant="outline" size="sm" onClick={() => onAddLesson(module.id)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Lesson
          </Button>
      </div>
    </div>
  );
};


export default function CourseBuilderPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!!courseId);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload a JPG, PNG, WebP, or GIF image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum thumbnail size is 5 MB.' });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    const storageRef = ref(storage, `course-thumbnails/${user.uid}/${Date.now()}-${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      'state_changed',
      (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
        setIsUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        updateCourseInfo('imageUrl', url);
        setIsUploading(false);
        setUploadProgress(0);
        toast({ title: 'Thumbnail uploaded' });
      }
    );
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const {
    course,
    setCourse,
    updateCourseInfo,
    addModule,
    updateModule,
    removeModule,
    addLessonToModule,
    updateLesson,
    removeLesson,
    setModules,
    setLessonsForModule,
  } = useCourseBuilder();

  useEffect(() => {
    async function loadExistingCourse() {
      if (!courseId) return;
      try {
        const data = await lmsService.getCourseById(courseId);
        if (data) {
          const mappedCourse = {
            id: data.id,
            title: data.title || '',
            description: data.description || '',
            longDescription: data.longDescription || '',
            price: data.price || 5000,
            imageUrl: data.thumbnail || '',
            status: data.status || 'draft',
            category: data.category || undefined,
            level: data.level || undefined,
            modules: data.modules.map((m: any) => ({
              id: m.id,
              title: m.title,
              lessons: m.lessons.map((l: any) => ({
                id: l.id,
                title: l.title,
                videoUrl: l.youtubeVideoUrl || '',
                content: l.content || '',
                duration: l.duration || '10'
              }))
            }))
          };
          setCourse(mappedCourse);
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Loading Error', description: 'Could not fetch existing course.' });
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadExistingCourse();
  }, [courseId, setCourse, toast]);

  const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson, moduleId: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
        const oldIndex = course.modules.findIndex(m => m.id === active.id);
        const newIndex = course.modules.findIndex(m => m.id === over!.id);
        const reorderedModules = arrayMove(course.modules, oldIndex, newIndex);
        setModules(reorderedModules);
    }
  };
  
  const handleEditLesson = (lesson: Lesson, moduleId: string) => {
    setEditingLesson({ lesson, moduleId });
  };

  const handleSaveLesson = (moduleId: string, lessonId: string, updatedLesson: Partial<Omit<Lesson, 'id'>>) => {
    updateLesson(moduleId, lessonId, updatedLesson);
    setEditingLesson(null);
    toast({ title: 'Lesson Updated', description: 'Changes saved locally.' });
  };

  const handleSaveCourse = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await lmsService.saveCourseCurriculum(user.uid, { ...course, status: course.status || 'draft' });
      toast({ title: 'Draft Saved!', description: 'Your updates are secured in the database.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!user) return;
    if (!course.title) {
        toast({ variant: 'destructive', title: 'Missing Title' });
        return;
    }

    setIsPublishing(true);
    try {
      // If already published, we just update. The service will notify admin.
      const isAlreadyPublished = course.status === 'published';
      const targetStatus = isAlreadyPublished ? 'published' : 'pending';
      
      await lmsService.saveCourseCurriculum(user.uid, { ...course, status: targetStatus });
      
      if (isAlreadyPublished) {
        await notificationService.notifyUser(user.uid, {
            message: `Your updates to "${course.title}" are now live.`,
            type: 'COURSE_UPDATE',
        });
        await notificationService.notifyCourseStudents(courseId || course.id, {
            message: `${course.title} has new updates available!`,
            type: 'NEW_LESSON',
            senderId: user.uid
        });
      }
      
      toast({ 
        title: isAlreadyPublished ? 'Updates Live' : 'Submitted for Review', 
        description: isAlreadyPublished 
          ? 'Changes are live. Admins have been notified to preview your updates.' 
          : 'Your course has been sent to the administrators for vetting.' 
      });
      
      router.push('/teacher/courses');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Submission Failed' });
    } finally {
      setIsPublishing(false);
    }
  };

  const isPublished = course.status === 'published';

  if (authLoading || isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground">Retrieving course curriculum...</p>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-5xl mx-auto pb-24">
       <div className="sticky top-[65px] bg-background/95 backdrop-blur-sm z-10 py-4 border-b mb-6">
        <div className="flex justify-between items-center">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Smart Course Wizard</h1>
                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Status: {course.status || 'draft'}</p>
            </div>
            <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveCourse} disabled={isSaving || isPublishing}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Draft
            </Button>
            <Button onClick={handlePublishCourse} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSaving || isPublishing}>
                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isPublished ? <RefreshCcw className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />)}
                {isPublished ? 'Submit Updates' : 'Submit for Review'}
            </Button>
            </div>
        </div>
      </div>
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Course Essentials</CardTitle>
            <CardDescription>Set the identity of your course.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Python"
                  value={course.title}
                  onChange={(e) => updateCourseInfo('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (XAF)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="5000"
                  value={course.price || 5000}
                  onChange={(e) => updateCourseInfo('price' as any, e.target.value)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={course.category || ''}
                  onValueChange={(v) => updateCourseInfo('category' as any, v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {(['Automotive', 'Drones & UAV', 'Embedded Systems', 'MATLAB', 'Mechatronics', 'SolidWorks', 'Other'] as CourseCategory[]).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={course.level || ''}
                  onValueChange={(v) => updateCourseInfo('level' as any, v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select difficulty level" /></SelectTrigger>
                  <SelectContent>
                    {(['Beginner', 'Intermediate', 'Advanced'] as CourseLevel[]).map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Course Thumbnail</Label>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="h-9 w-full grid grid-cols-2 mb-3">
                  <TabsTrigger value="upload" className="text-xs font-bold">
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Image
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs font-bold">
                    <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Paste URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-0 space-y-3">
                  {/* Hidden file input */}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleThumbnailUpload}
                  />

                  {/* Preview or drop zone */}
                  {course.imageUrl && !isUploading ? (
                    <div className="relative rounded-xl overflow-hidden border bg-secondary/20 aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={course.imageUrl}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => updateCourseInfo('imageUrl', '')}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center transition-colors"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full border-2 border-dashed border-border hover:border-accent rounded-xl aspect-video flex flex-col items-center justify-center gap-3 bg-secondary/10 hover:bg-accent/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-accent animate-spin" />
                          <span className="text-sm font-bold text-accent">{uploadProgress}%</span>
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-accent" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold">Click to upload</p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP or GIF · max 5 MB</p>
                          </div>
                        </>
                      )}
                    </button>
                  )}
                </TabsContent>

                <TabsContent value="url" className="mt-0 space-y-2">
                  <Input
                    id="imageUrl"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={course.imageUrl}
                    onChange={(e) => updateCourseInfo('imageUrl', e.target.value)}
                  />
                  {course.imageUrl && (
                    <div className="rounded-xl overflow-hidden border bg-secondary/20 aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={course.imageUrl}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Paste any publicly accessible image URL.</p>
                </TabsContent>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Subtitle</Label>
              <Textarea
                id="description"
                placeholder="Brief summary for the catalog."
                value={course.description}
                onChange={(e) => updateCourseInfo('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Curriculum Builder</CardTitle>
                <CardDescription>Drag and drop to reorder modules and lessons.</CardDescription>
              </div>
              <Button variant="outline" onClick={addModule}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Module
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                 <SortableContext items={course.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    {course.modules.length > 0 ? (
                    course.modules.map((module) => (
                        <SortableModuleItem
                            key={module.id}
                            module={module}
                            onUpdate={updateModule}
                            onRemove={removeModule}
                            onAddLesson={addLessonToModule}
                            onRemoveLesson={removeLesson}
                            setLessonsForModule={setLessonsForModule}
                            onEditLesson={handleEditLesson}
                        />
                    ))
                    ) : (
                      <EmptyState 
                        icon={BookOpen}
                        title="Empty Curriculum"
                        description="Start by adding your first module."
                        action={{ text: 'Add first module', onClick: addModule }}
                      />
                    )}
                 </SortableContext>
             </DndContext>
          </CardContent>
        </Card>
      </div>
    </div>

    {editingLesson && (
      <LessonEditDialog
        isOpen={!!editingLesson}
        onClose={() => setEditingLesson(null)}
        lesson={editingLesson.lesson}
        moduleId={editingLesson.moduleId}
        onSave={handleSaveLesson}
      />
    )}
    </>
  );
}
