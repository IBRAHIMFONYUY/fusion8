'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PlusCircle, Users as UsersIcon, Search, FilterX, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JoinTeamDialog } from '@/components/join-team-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Project, ProjectStatus, ProjectCategory } from '@/services/project-service';

const ProjectCard = ({ project, onJoinClick }: { project: Project, onJoinClick: (project: Project) => void }) => {
    const spotsFilled = Object.keys(project.members || {}).length;
    const totalSpots = project.teamSize?.total || 4;

    const getStatusBadgeVariant = (status: ProjectStatus) => {
        if (status === 'recruiting') return 'recruiting';
        if (status === 'in_progress') return 'in-progress';
        return 'outline';
    };
    
    return (
        <Card key={project.id} className="flex flex-col border-none shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
             <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-xl pr-2 group-hover:text-accent transition-colors">{project.title}</CardTitle>
                     <Badge variant={getStatusBadgeVariant(project.status)} className="capitalize shrink-0">
                        {project.status.replace('_', ' ')}
                    </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2">{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
                 <div>
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2 tracking-wider">Skills Needed</h4>
                    <div className="flex flex-wrap gap-1">
                        {project.skillsNeeded?.map(skill => <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>)}
                    </div>
                </div>
                <div className="pt-4 border-t border-dashed">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Team Capacity</h4>
                        <span className="text-xs font-semibold">{spotsFilled} / {totalSpots} members</span>
                     </div>
                     <div className="flex items-center space-x-2">
                         <div className="flex -space-x-2 overflow-hidden">
                            {Object.keys(project.members || {}).map((uid, i) => (
                                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} alt="Member" />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        {totalSpots > spotsFilled && <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold">+{totalSpots-spotsFilled}</div>}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={() => project.status === 'recruiting' && onJoinClick(project)} className="w-full" variant={project.status === 'recruiting' ? 'default' : 'secondary'} disabled={project.status !== 'recruiting'}>
                    {project.status === 'recruiting' ? 'Apply to Join' : project.status === 'in_progress' ? 'In Progress' : 'Completed'}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function ProjectsHubPage() {
  const { firestore } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, 'projects'));
    if (statusFilter !== 'all') q = query(q, where('status', '==', statusFilter));
    if (categoryFilter !== 'all') q = query(q, where('category', '==', categoryFilter));
    return q;
  }, [firestore, statusFilter, categoryFilter]);

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-secondary py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Community Project Hub</Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 font-headline text-primary">The Innovation Incubator</h1>
            <p className="text-muted-foreground text-xl">Collaborate with peers, build your professional portfolio, and solve local problems through engineering.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                    <Link href="/student/propose">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Propose a Venture
                    </Link>
                </Button>
            </div>
          </div>

          <div id="explore" className="space-y-8">
            <Card className="p-3 sm:p-6 border-none shadow-lg bg-background/80 backdrop-blur-sm sticky top-16 z-30">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                            <Search className="h-3 w-3" /> Filter by Status
                        </label>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="recruiting">Recruiting</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Industry Category</label>
                        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
                            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="All Categories" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="Agriculture">Agriculture</SelectItem>
                                <SelectItem value="Hardware">Hardware</SelectItem>
                                <SelectItem value="Fintech">Fintech</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" className="w-full text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground border-dashed" onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}>
                        <FilterX className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" /> 
                        <span className="hidden sm:inline">Clear All Filters</span>
                        <span className="sm:hidden">Reset</span>
                    </Button>
                </div>
            </Card>

            <div className="pt-8">
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>
                ) : projects && projects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {projects.map(project => <ProjectCard key={project.id} project={project} onJoinClick={() => setSelectedProject(project)} />)}
                    </div>
                ) : (
                    <EmptyState
                    icon={UsersIcon}
                    title="No Ventures Found"
                    description="No projects match your current filters. Try adjusting your search or be the first to propose a new venture!"
                    action={{ text: 'Propose a Venture', href: '/student/propose' }}
                    />
                )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    {selectedProject && (
        <JoinTeamDialog
            project={selectedProject as any}
            isOpen={!!selectedProject}
            onClose={() => setSelectedProject(null)}
        />
    )}
    </>
  );
}
