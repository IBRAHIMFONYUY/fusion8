
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';

export default function StudentCoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMyCourses() {
            if (!user) return;
            try {
                setLoading(true);
                const q = query(
                    collection(firestore, 'enrollments'),
                    where('studentId', '==', user.uid),
                    where('status', '==', 'active')
                );
                
                const snap = await getDocs(q).catch(async (err: any) => {
                    if (err.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                            path: 'enrollments',
                            operation: 'list',
                        }));
                    }
                    throw err;
                });
                
                const coursesWithData = await Promise.all(snap.docs.map(async (eDoc) => {
                    const eData = eDoc.data();
                    const cRef = doc(firestore, 'courses', eData.courseId);
                    const cSnap = await getDoc(cRef).catch(async (err: any) => {
                        if (err.code === 'permission-denied') {
                            errorEmitter.emit('permission-error', new FirestorePermissionError({
                                path: cRef.path,
                                operation: 'get',
                            }));
                        }
                        throw err;
                    });
                    return {
                        id: eData.courseId,
                        ...(cSnap ? cSnap.data() : {}),
                        progress: eData.progress || 0
                    };
                }));
                
                setEnrolledCourses(coursesWithData);
            } catch (err) {
                // Caught and handled by emitter or logic
            } finally {
                setLoading(false);
            }
        }
        if (!authLoading) loadMyCourses();
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center p-6 sm:p-24 min-h-[40vh]">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>Continue your learning journey by selecting a course below.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                {enrolledCourses.length > 0 ? enrolledCourses.map(course => {
                    const courseImage = course.thumbnail || PlaceHolderImages[0].imageUrl;

                    return (
                        <Card key={course.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 overflow-hidden transition-shadow hover:shadow-md">
                            <div className="relative w-full sm:w-48 aspect-video flex-shrink-0">
                                <img 
                                    src={courseImage} 
                                    alt={course.title} 
                                    className="w-full h-full rounded-md object-cover"
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <h3 className="text-lg font-semibold">{course.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-3 line-clamp-2">{course.description}</p>
                                <div className="flex items-center gap-3">
                                    <Progress value={course.progress} className="h-2 flex-1" />
                                    <span className="text-xs text-muted-foreground">{course.progress}% complete</span>
                                </div>
                            </div>
                            <Button asChild variant="outline" className="w-full mt-4 sm:w-auto sm:mt-0 self-center">
                                <Link href={`/student/courses/${course.id}`}>Continue <ArrowRight className="h-4 w-4 ml-2"/></Link>
                            </Button>
                        </Card>
                    )
                }) : (
                     <EmptyState 
                        icon={BookOpen}
                        title="Your Learning Journey Awaits"
                        description="You are not enrolled in any courses yet. Explore our catalog to find a skill path that excites you."
                        action={{ href: "/courses", text: "Explore Course Catalog" }}
                     />
                )}
            </CardContent>
        </Card>
    )
}
