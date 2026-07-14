
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Lightbulb, Users as UsersIcon, Check, X, Lock, Rocket, Loader2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/empty-state';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, getDocs } from 'firebase/firestore';
import type { Project } from '@/services/project-service';

const ApplicantCard = ({ applicant, onAccept, onReject }: { applicant: any, onAccept: () => void, onReject: () => void }) => {
    return (
        <div className="p-4 bg-background rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${applicant.studentId}`} alt={applicant.fullName} />
                    <AvatarFallback>{applicant.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold">{applicant.fullName}</h4>
                    <p className="text-sm text-accent font-medium">{applicant.applyingFor || 'Team Member'}</p>
                    <p className="text-sm text-muted-foreground mt-1 italic">"{applicant.pitch}"</p>
                </div>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50" onClick={onReject}><X className="h-4 w-4"/></Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={onAccept}><Check className="h-4 w-4"/></Button>
            </div>
        </div>
    )
}

export default function StudentProjectsPage() {
    const { toast } = useToast();
    const { user, firestore } = useAuth();
    const [isActionPending, setIsActionPending] = useState(false);

    // 1. Fetch Projects I Lead
    const ledQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'projects'), where('studentLeadId', '==', user.uid));
    }, [firestore, user]);

    const { data: myLedProjects, isLoading: ledLoading } = useCollection<Project>(ledQuery);

    // 2. Fetch Projects I am part of (Collaboration)
    // For MVP, we fetch recruiting/in_progress projects and filter client-side 
    // since Firestore map filtering is complex.
    const allProjectsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'projects'), where('status', 'in', ['recruiting', 'in_progress']));
    }, [firestore]);

    const { data: allProjects, isLoading: allLoading } = useCollection<Project>(allProjectsQuery);

    const myJoinedProjects = allProjects?.filter(p => 
        p.studentLeadId !== user?.uid && p.members?.[user?.uid || '']
    ) || [];

    const handleLaunchProject = async (projectId: string) => {
        if (!firestore) return;
        setIsActionPending(true);
        try {
            const projectRef = doc(firestore, 'projects', projectId);
            await updateDoc(projectRef, { 
                status: 'in_progress',
                launchedAt: new Date().toISOString()
            });
            toast({
                title: "Venture Launched!",
                description: "Your project is now in progress and the workspace is active.",
            });
        } catch (error) {
            toast({ variant: 'destructive', title: "Launch Failed" });
        } finally {
            setIsActionPending(false);
        }
    };

    if (ledLoading || allLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                <p className="text-muted-foreground animate-pulse">Synchronizing ventures...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-4xl font-black font-headline tracking-tighter uppercase">Innovation Incubator</h1>
                    <p className="text-muted-foreground mt-2">Manage your ventures and collaborate with your engineering team.</p>
                </div>
                 <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                    <Link href="/projects">
                        <UsersIcon className="mr-2 h-4 w-4" />
                        Explore Community Hub
                    </Link>
                </Button>
            </div>

            <div className="space-y-10">
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Rocket className="h-6 w-6 text-accent" />
                        My Ventures (Lead)
                    </h2>
                     {myLedProjects && myLedProjects.length > 0 ? (
                         <Accordion type="multiple" className="space-y-4">
                            {myLedProjects.map(project => (
                                <AccordionItem value={`project-${project.id}`} key={project.id} className="border-none">
                                    <Card className="bg-card shadow-lg border-none">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-xl font-headline">{project.title}</CardTitle>
                                                    <CardDescription className="mt-1">{project.description}</CardDescription>
                                                </div>
                                                <Badge variant={project.status === 'recruiting' ? 'secondary' : 'default'}>
                                                    {project.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                         <CardContent className="space-y-6">
                                            <div className="p-4 bg-secondary/30 rounded-xl">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Current Engineering Team</h4>
                                                <div className="flex items-center gap-2">
                                                    {Object.keys(project.members || {}).map(uid => (
                                                        <div key={uid} className="flex flex-col items-center gap-1">
                                                            <Avatar className="h-10 w-10 border-2 border-background">
                                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} />
                                                                <AvatarFallback>U</AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">{project.members?.[uid]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {project.status === 'recruiting' && (
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                                        <UsersIcon className="h-4 w-4 text-accent" />
                                                        Pending Applications
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground italic">Venture applications are processed via the Community Hub. Ensure your project pitch is compelling.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="gap-3">
                                            {project.status === 'recruiting' ? (
                                                <Button 
                                                    onClick={() => handleLaunchProject(project.id)} 
                                                    disabled={isActionPending || Object.keys(project.members || {}).length < 1} 
                                                    className="w-full bg-primary hover:bg-primary/90 font-bold"
                                                >
                                                    <Lock className="mr-2 h-4 w-4" />
                                                    Lock Team & Start Project
                                                </Button>
                                            ) : (
                                                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-12 shadow-lg">
                                                    <Link href={`/projects/${project.id}`}>
                                                        Enter Project Workspace <ExternalLink className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                     ) : (
                        <EmptyState 
                            icon={Lightbulb}
                            title="No ventures proposed yet."
                            description="Turn your idea into a real-world engineering project. Propose a new venture to start recruiting a team."
                            action={{ text: 'Propose a New Venture', href: '/student/propose' }}
                        />
                    )}
                </div>

                <div className="pt-6 border-t border-dashed">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <UsersIcon className="h-6 w-6 text-primary" />
                        My Collaborations
                    </h2>
                    {myJoinedProjects.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {myJoinedProjects.map(project => (
                                <Card key={project.id} className="flex flex-col border-none shadow-md bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-headline line-clamp-1">{project.title}</CardTitle>
                                            <Badge variant="outline" className="text-[10px] uppercase">{project.members?.[user?.uid || '']}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button asChild className="w-full bg-primary hover:bg-primary/90 font-bold" disabled={project.status !== 'in_progress'}>
                                            <Link href={`/projects/${project.id}`}>
                                                {project.status === 'in_progress' ? 'Open Workspace' : 'Awaiting Launch'}
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <EmptyState 
                            icon={Rocket}
                            title="Join a venture."
                            description="You haven't joined any collaborations yet. Explore the Community Hub to find a team that needs your engineering skills."
                            action={{ text: 'Explore the Hub', href: '/projects' }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
