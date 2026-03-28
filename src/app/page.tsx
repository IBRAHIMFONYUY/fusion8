
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowRight, Zap, Rocket, ShieldCheck, Code2, TrendingUp, BarChart3, Building2, Cpu, MonitorPlay, ClipboardCheck, Search, Hammer, Loader2, Users } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { lmsService, LMSCourse } from '@/services/lms-service';
import { projectService, Project } from '@/services/project-service';
import { Badge } from '@/components/ui/badge';

const applicationSteps = [
  {
    step: "01",
    title: "The Application",
    description: "Tell us what you want to build. We look for passion, curiosity, and a drive to solve local problems.",
    icon: ClipboardCheck
  },
  {
    step: "02",
    title: "The Review",
    description: "Our expert mentors review your ambition and technical baseline to ensure you are ready for the intensity.",
    icon: Search
  },
  {
    step: "03",
    title: "The Matriculation",
    description: "Accepted students receive their official Fusion8 ID, lab access credentials, and hardware starter kits.",
    icon: ShieldCheck
  },
  {
    step: "04",
    title: "The Build Phase",
    description: "12 weeks of intense, project-based engineering. No fluff—just building industry-grade solutions.",
    icon: Hammer
  }
];

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<LMSCourse[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const heroSlides = [
    PlaceHolderImages.find((img) => img.id === 'hero-background'),
    PlaceHolderImages.find((img) => img.id === 'hero-cad'),
    PlaceHolderImages.find((img) => img.id === 'hero-robotics'),
    PlaceHolderImages.find((img) => img.id === 'course-6'),
  ].filter(Boolean);

  useEffect(() => {
    async function loadData() {
      try {
        const [courseData, projectData] = await Promise.all([
          lmsService.getPopularCourses(6),
          projectService.getActiveProjects()
        ]);
        setFeaturedCourses(courseData);
        setActiveProjects(projectData.slice(0, 3));
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Cinematic Hero Section */}
        <section className="relative w-full h-[70vh] md:h-[90vh] text-white overflow-hidden bg-black">
          <div className="absolute inset-0 w-full h-full">
            {heroSlides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {slide && (
                  <img
                    src={slide.imageUrl}
                    alt={slide.description}
                    className={`w-full h-full object-cover ${index === currentSlide ? 'animate-zoom-in' : ''}`}
                    data-ai-hint={slide.imageHint}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pointer-events-none">
            <div className="max-w-4xl pointer-events-auto">
              <Badge variant="secondary" className="mb-6 bg-accent text-accent-foreground border-none px-4 py-1 text-sm font-bold tracking-wider animate-fade-in-down">
                ENGINEERING ACCELERATOR
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 text-shadow-lg animate-fade-in-down font-headline text-white uppercase">
                Forge Your Tech Future.
              </h1>
              <p className="max-w-3xl mx-auto text-lg md:text-xl text-neutral-200 mb-8 animate-fade-in-down animation-delay-300">
                Fusion8 is Cameroon's collaborative engineering hub. We bridge the skills gap by empowering students to build real-world solutions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
                  <Button asChild size="lg" className="h-14 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-xl text-lg rounded-full">
                      <Link href="/courses">Start Learning</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-8 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 font-bold text-lg rounded-full">
                      <Link href="/become-instructor">Partner With Us</Link>
                  </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Path Chooser Section */}
        <section className="py-16 md:py-24 bg-background border-b relative z-20 -mt-12 md:-mt-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 border-accent/20 bg-card shadow-2xl relative overflow-hidden group rounded-[2.5rem]">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Cpu className="h-32 w-32 text-accent" />
                </div>
                <CardHeader className="pt-8 px-8">
                  <Badge className="w-fit mb-2 bg-accent/10 text-accent border-accent/20 font-black tracking-widest uppercase text-[10px]">The VIP Lane</Badge>
                  <CardTitle className="text-3xl font-black font-headline uppercase tracking-tighter">Onsite Accelerator</CardTitle>
                  <CardDescription className="text-lg mt-2 font-medium">
                    Exclusive hands-on engineering training in our Yaoundé labs. Work with real hardware and 1-on-1 mentorship.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground font-bold uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" /> Physical lab space & hardware kits
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground font-bold uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" /> Daily onsite mentor guidance
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pb-10 px-8">
                  <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black h-14 shadow-lg rounded-2xl text-lg uppercase tracking-tighter" size="lg">
                    <Link href="/apply">Apply for Cohort 01 <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-2 border-primary/10 bg-secondary/30 shadow-xl relative overflow-hidden group rounded-[2.5rem]">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MonitorPlay className="h-32 w-32 text-primary" />
                </div>
                <CardHeader className="pt-8 px-8">
                  <Badge variant="outline" className="w-fit mb-2 font-black tracking-widest uppercase text-[10px]">Flexible Learning</Badge>
                  <CardTitle className="text-3xl font-black font-headline uppercase tracking-tighter">Digital Campus</CardTitle>
                  <CardDescription className="text-lg mt-2 font-medium">
                    Access our entire online curriculum from anywhere. Self-paced video lessons in engineering and high-tech software.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground font-bold uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" /> 24/7 access to video library
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground font-bold uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" /> AI-powered content summaries
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pb-10 px-8">
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-2xl text-lg uppercase tracking-tighter" variant="default" size="lg">
                    <Link href="/courses">Browse Online Catalog <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Courses Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div className="max-w-2xl text-center md:text-left">
                  <Badge variant="secondary" className="mb-2 bg-accent/10 text-accent font-black tracking-widest px-3 py-1 uppercase text-[10px]">Popular Tracks</Badge>
                  <h2 className="text-3xl md:text-5xl font-black mb-4 font-headline tracking-tighter uppercase leading-tight">Trending Engineering Tracks</h2>
                  <p className="text-muted-foreground text-xl font-medium">Explore the high-impact skills being mastered by our top learners.</p>
                </div>
                <Button asChild variant="ghost" className="text-accent hover:text-accent/80 font-black uppercase tracking-widest text-xs">
                  <Link href="/courses">Full Catalog <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                  <p className="text-muted-foreground font-black tracking-widest uppercase text-xs">Synchronizing Top Content...</p>
                </div>
              ) : featuredCourses.length > 0 ? (
                <div className="mt-12">
                <Carousel opts={{ align: "start", loop: true, }} className="w-full">
                    <CarouselContent>
                        {featuredCourses.map((course) => {
                        const courseImage = course.thumbnail || PlaceHolderImages[0].imageUrl;
                        return (
                            <CarouselItem key={course.id} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-2">
                                <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full border-none rounded-[2rem] bg-card group">
                                <div className="relative aspect-video overflow-hidden">
                                    <img
                                        src={courseImage}
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-accent text-accent-foreground border-none font-black text-[8px] uppercase tracking-[0.2em] px-2 py-0.5">Top Rated</Badge>
                                    </div>
                                </div>
                                <CardContent className="flex-1 pt-8 px-8">
                                    <CardTitle className="text-xl mb-3 h-14 line-clamp-2 font-headline font-black tracking-tight uppercase leading-tight">{course.title}</CardTitle>
                                    <p className="text-muted-foreground line-clamp-2 text-sm italic mb-6">"{course.description}"</p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-dashed">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-accent" />
                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{course.enrolledCount || 0} Learners</span>
                                        </div>
                                        <span className="text-xs font-black text-primary uppercase">{(course.price || 50000).toLocaleString()} XAF</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pb-8 px-8">
                                    <Button asChild className="w-full bg-primary hover:bg-accent text-white font-black h-12 rounded-xl text-xs uppercase tracking-widest transition-all">
                                    <Link href={`/courses/${course.id}`}>
                                        View Track Details <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                    </Button>
                                </CardFooter>
                                </Card>
                            </div>
                            </CarouselItem>
                        );
                        })}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                    </Carousel>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground italic border-2 border-dashed rounded-[3rem] bg-secondary/20">
                  <Rocket className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  Popular tracks are currently being synchronized. Check back shortly.
                </div>
              )}
          </div>
        </section>

        {/* Admissions Process Section */}
        <section className="py-20 bg-secondary/50 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4 bg-accent/10 text-accent border-none font-black uppercase tracking-widest text-[10px] px-4 py-1.5">The Admissions Track</Badge>
              <h2 className="text-3xl md:text-5xl font-black mb-4 font-headline uppercase tracking-tighter">Your Engineering Journey</h2>
              <p className="text-muted-foreground text-lg font-medium">We don't just take students; we select future innovators. Here is how you join the elite.</p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-accent/20 -translate-y-1/2 z-0" />
              <div className="grid md:grid-cols-4 gap-8 relative z-10">
                {applicationSteps.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div className="w-16 h-16 rounded-full bg-background border-4 border-accent flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="h-7 w-7 text-accent" />
                    </div>
                    <div className="bg-background p-6 rounded-[2rem] shadow-md border border-border/50 h-full transition-all group-hover:shadow-xl group-hover:border-accent/20">
                      <span className="text-accent font-black text-xs tracking-widest uppercase mb-2 block">Step {item.step}</span>
                      <h3 className="text-xl font-black mb-3 font-headline tracking-tighter uppercase">{item.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ventures Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 -skew-x-12 transform translate-x-1/2" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge className="bg-accent text-accent-foreground border-none px-3 py-1 font-black uppercase tracking-widest text-[10px]">Impact Mission</Badge>
                <h2 className="text-3xl md:text-6xl font-black font-headline tracking-tighter uppercase leading-none">Bridging the Gap.</h2>
                <p className="text-lg text-neutral-300 leading-relaxed font-medium">
                  Fusion8 exists to ensure the African demographic dividend becomes a reality by providing industry-grade training and a platform for collaborative innovation in Cameroon.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div>
                    <h4 className="text-accent font-black text-4xl font-headline tracking-tighter">1000+</h4>
                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em]">Students Trained</p>
                  </div>
                  <div>
                    <h4 className="text-accent font-black text-4xl font-headline tracking-tighter">50+</h4>
                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em]">Ventures Launched</p>
                  </div>
                </div>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-neutral-200 font-black h-14 px-10 rounded-2xl shadow-xl text-lg uppercase tracking-tighter">
                  <Link href="/become-instructor">Partner With Us <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
              <div className="relative aspect-square md:aspect-video rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHx0ZWFtJTIwd29ya2luZ3xlbnwwfHx8fDE3NTk1NTgwNjh8MA&ixlib=rb-4.0.3&q=80&w=1080"
                  alt="Team collaboration"
                  className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                  data-ai-hint="team collaboration"
                />
                <div className="absolute inset-0 bg-accent/10 mix-blend-overlay" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
