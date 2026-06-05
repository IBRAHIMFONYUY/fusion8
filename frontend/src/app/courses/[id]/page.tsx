
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Clock, Loader2, AlertCircle, PlayCircle, Lock, LogIn } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { EnrollmentPaymentDialog } from '@/components/enrollment-payment-dialog';
import { paymentService } from '@/services/payment-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params?.id;
  const { user, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    async function loadCourseData() {
      if (!courseId) return;
      
      setLoading(true);
      setError(null);

      try {
        const docRef = doc(firestore, 'courses', courseId);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          setError("Course not found.");
          setLoading(false);
          return;
        }

        setCourse({ id: snap.id, ...snap.data() });

        // Fetch syllabus
        const modulesQuery = query(collection(firestore, `courses/${courseId}/modules`), orderBy('order', 'asc'));
        const lessonsQuery = query(collection(firestore, `courses/${courseId}/lessons`), orderBy('order', 'asc'));

        const [modulesSnap, lessonsSnap] = await Promise.all([
          getDocs(modulesQuery),
          getDocs(lessonsQuery)
        ]);

        const allLessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const modulesList = modulesSnap.docs.map(mDoc => ({
          id: mDoc.id,
          ...mDoc.data(),
          lessons: allLessons.filter((l: any) => l.moduleId === mDoc.id)
        }));

        setModules(modulesList);
        
        if (user) {
          if (role === 'admin' || (role === 'teacher' && snap.data().teacherId === user.uid)) {
            setEnrollmentStatus('active');
          } else {
            const status = await paymentService.checkEnrollmentStatus(user.uid, courseId);
            setEnrollmentStatus(status);
          }
        }
      } catch (err: any) {
        console.error("Error loading course details:", err);
        if (err.code === 'permission-denied') {
          // Handle gracefully — do not emit globally (would crash the page)
          setError(
            user
              ? "This course is not available yet. It may still be under review — check back soon or contact support."
              : "Please sign in to view this course."
          );
        } else if (err.code === 'not-found') {
          setError("This course does not exist.");
        } else {
          setError("Failed to load course details. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadCourseData();
  }, [courseId, user, role]);

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading course showroom...</p>
      </div>
    );
  }

  if (error || !course) {
    const needsSignIn = !user && error?.includes("sign in");
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{needsSignIn ? "Sign In Required" : "Course Unavailable"}</AlertTitle>
            <AlertDescription>{error || "Course not found."}</AlertDescription>
            <div className="flex flex-col gap-2 mt-4">
              {needsSignIn && (
                <Button className="w-full bg-accent hover:bg-accent/90" onClick={() => router.push(`/login?returnTo=/courses/${courseId}`)}>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In to Continue
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => router.push('/courses')}>
                Back to Catalog
              </Button>
            </div>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  const handleEnrollClick = () => {
    if (!user) {
      // User must authenticate first — bounce through /login and return here.
      router.push(`/login?returnTo=/courses/${courseId}`);
      return;
    }

    if (enrollmentStatus === 'active') {
      router.push(`/student/courses/${courseId}`);
      return;
    }

    setIsPaymentOpen(true);
  };

  const courseImage = course.thumbnail || PlaceHolderImages.find(img => img.id === 'course-1')?.imageUrl;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{course.description}</p>
              
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Course Overview</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-neutral dark:prose-invert">
                  <p>{course.longDescription || "This course provides hands-on engineering training designed for the Cameroon tech ecosystem. Learn building real-world projects with industry-standard tools."}</p>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Course Syllabus</h2>
                {modules.length > 0 ? (
                  <Accordion type="multiple" defaultValue={modules.map(m => `item-${m.id}`)} className="w-full space-y-2">
                    {modules.map((module) => (
                      <AccordionItem value={`item-${module.id}`} key={module.id} className="border bg-card rounded-lg overflow-hidden">
                        <AccordionTrigger className="font-semibold text-lg px-6 py-4 hover:no-underline">
                          {module.title}
                        </AccordionTrigger>
                        <AccordionContent className="p-0">
                          <ul className="divide-y">
                            {module.lessons.map((lesson: any, index: number) => (
                              <li key={lesson.id} className="flex items-center justify-between px-6 py-4 text-muted-foreground">
                                <div className="flex items-center gap-4">
                                  <div className="text-xl font-bold opacity-20">{String(index + 1).padStart(2, '0')}</div>
                                  <div>
                                    <h3 className="font-medium text-foreground">{lesson.title}</h3>
                                    <p className="text-xs">{lesson.duration || "10 mins"}</p>
                                  </div>
                                </div>
                                <Lock className="h-4 w-4 opacity-40" />
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground italic">No syllabus available for this course yet.</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-xl overflow-hidden border-none">
                 <div className="relative aspect-video">
                    <img
                        src={courseImage}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                 </div>
                 <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold">{(course.price || 5000).toLocaleString()} XAF</span>
                        <div className="flex items-center gap-1">
                            <Star className="text-yellow-400 fill-yellow-400 h-4 w-4" />
                            <span className="font-semibold">4.9</span>
                        </div>
                    </div>
                   
                   <Button 
                    onClick={handleEnrollClick} 
                    size="lg" 
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg"
                   >
                     {enrollmentStatus === 'active' ? 'Go to Course' : 'Enroll in Course'}
                   </Button>

                   <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-center"><Clock className="h-4 w-4 mr-2 text-accent"/> Lifetime access</li>
                        <li className="flex items-center"><Star className="h-4 w-4 mr-2 text-accent"/> Certificate of completion</li>
                        <li className="flex items-center"><PlayCircle className="h-4 w-4 mr-2 text-accent"/> {modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons</li>
                   </ul>
                 </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {user && (
        <EnrollmentPaymentDialog
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          courseId={course.id}
          courseTitle={course.title}
          price={course.price || 5000}
          studentId={user.uid}
        />
      )}
    </div>
  );
}
