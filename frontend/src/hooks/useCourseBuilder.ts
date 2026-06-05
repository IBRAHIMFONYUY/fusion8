
'use client';

import { useState } from 'react';
import { useToast } from './use-toast';

export type Lesson = {
  id: string;
  title: string;
  videoUrl: string;
  content: string;
  duration: string;
  isAssignment?: boolean;
};

export type Module = {
  id:string;
  title: string;
  lessons: Lesson[];
};

export type CourseData = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  modules: Module[];
  teacherId?: number; // Added for context
  status?: 'published' | 'unpublished' | 'pending'; // Added for context
  featured?: boolean; // Added for context
  price?: number;
};

const initialCourseState: CourseData = {
    id: `course_${Date.now()}`,
    title: '',
    description: '',
    longDescription: '',
    imageUrl: '',
    modules: [],
    teacherId: 2, // Mock teacherId
    status: 'pending'
}

export function useCourseBuilder(initialState: Partial<CourseData> = {}) {
    const { toast } = useToast();
    const [course, setCourse] = useState<CourseData>({ ...initialCourseState, ...initialState });

    const updateCourseInfo = (field: keyof Omit<CourseData, 'modules' | 'id'>, value: string) => {
        setCourse(prev => ({ ...prev, [field]: value }));
    };

    const addModule = () => {
        const newModule: Module = {
            id: `mod_${Date.now()}`,
            title: `New Module ${course.modules.length + 1}`,
            lessons: [],
        };
        setCourse(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
        toast({ title: 'Module Added', description: 'A new module has been added to your curriculum.' });
    };

    const removeModule = (moduleId: string) => {
        setCourse(prev => ({
            ...prev,
            modules: prev.modules.filter(m => m.id !== moduleId),
        }));
        toast({ variant: 'destructive', title: 'Module Removed', description: 'The module and all its lessons have been removed.' });
    };

    const updateModule = (moduleId: string, title: string) => {
        setCourse(prev => ({
            ...prev,
            modules: prev.modules.map(m => m.id === moduleId ? { ...m, title } : m),
        }));
    };

    const addLessonToModule = (moduleId: string) => {
        setCourse(prev => ({
            ...prev,
            modules: prev.modules.map(m => {
                if (m.id === moduleId) {
                    const newLesson: Lesson = {
                        id: `lesson_${Date.now()}`,
                        title: `New Lesson ${m.lessons.length + 1}`,
                        videoUrl: '',
                        content: '',
                        duration: '10',
                        isAssignment: false,
                    };
                    return { ...m, lessons: [...m.lessons, newLesson] };
                }
                return m;
            })
        }));
        toast({ title: 'Lesson Added', description: 'A new lesson has been added to the module.' });
    };

    const removeLesson = (moduleId: string, lessonId: string) => {
         setCourse(prev => ({
            ...prev,
            modules: prev.modules.map(m => {
                if (m.id === moduleId) {
                    return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
                }
                return m;
            })
        }));
        toast({ variant: 'destructive', title: 'Lesson Removed', description: 'The lesson has been removed.' });
    };
    
    const updateLesson = (moduleId: string, lessonId: string, updatedLesson: Partial<Omit<Lesson, 'id'>>) => {
        setCourse(prev => ({
            ...prev,
            modules: prev.modules.map(m => {
                if (m.id === moduleId) {
                    const updatedLessons = m.lessons.map(l => 
                        l.id === lessonId ? { ...l, ...updatedLesson } : l
                    );
                    return { ...m, lessons: updatedLessons };
                }
                return m;
            })
        }));
    };
    
    const setModules = (modules: Module[]) => {
        setCourse(prev => ({...prev, modules}));
    }

    const setLessonsForModule = (moduleId: string, lessons: Lesson[]) => {
        setCourse(prev => ({
            ...prev,
            modules: prev.modules.map(m => 
                m.id === moduleId ? { ...m, lessons } : m
            )
        }));
    };


    return {
        course,
        setCourse,
        updateCourseInfo,
        addModule,
        removeModule,
        updateModule,
        addLessonToModule,
        removeLesson,
        updateLesson,
        setModules,
        setLessonsForModule,
    };
}
