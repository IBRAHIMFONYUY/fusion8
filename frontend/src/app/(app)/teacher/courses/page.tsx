
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users, BarChart, BookOpen, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { lmsService, LMSCourse } from '@/services/lms-service';
import { useAuth } from '@/firebase';
import { Badge } from '@/components/ui/badge';

export default function TeacherCoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [courses, setCourses] = useState<LMSCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCourses() {
            if (!user) return;
            try {
                setLoading(true);
                const data = await lmsService.getTeacherCourses(user.uid);
                setCourses(data);
            } catch (error) {
                console.error("Error loading teacher courses:", error);
            } finally {
                setLoading(false);
            }
        }
        if (!authLoading) loadCourses();
    }, [user, authLoading]);

    const getStatusBadge = (status: LMSCourse['status']) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-500 hover:bg-green-600">Published</Badge>;
            case 'pending':
                return <Badge variant="secondary">Pending Review</Badge>;
            case 'draft':
                return <Badge variant="outline">Draft</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                <p className="text-muted-foreground">Loading your curriculum...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                <Button asChild>
                    <Link href="/teacher/courses/builder"><PlusCircle className="mr-2 h-4 w-4" /> Create New Course</Link>
                </Button>
            </div>

            {courses.length > 0 ? (
                <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const courseImage = course.thumbnail || PlaceHolderImages[0].imageUrl;
                        return (
                            <Card key={course.id} className="flex flex-col overflow-hidden shadow-lg">
                                <CardHeader className="p-0 relative">
                                    <div className="relative aspect-video">
                                        <img
                                            src={courseImage}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2">
                                            {getStatusBadge(course.status)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pt-6">
                                    <CardTitle className="text-xl mb-2 line-clamp-1">{course.title}</CardTitle>
                                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{course.enrolledCount} Students</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <BarChart className="h-4 w-4" />
                                            <span>Active</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="gap-2">
                                    <Button asChild className="w-full">
                                        <Link href={`/teacher/courses/builder?id=${course.id}`}>
                                            Edit Course
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href={`/courses/${course.id}`} target="_blank">
                                            Preview
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <EmptyState 
                    icon={BookOpen}
                    title="You haven't created any courses yet."
                    description="Use the course wizard to build your first course and share your expertise with students."
                    action={{ text: 'Create New Course', href: '/teacher/courses/builder' }}
                />
            )}
        </div>
    );
}
