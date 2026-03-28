'use client';

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Folder, File, Trash2, LayoutGrid, FileText, Loader2, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProjectTaskSubmissionDialog } from '@/components/project-task-submission-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const KanbanColumn = ({ title, tasks = [], onTaskClick }: { title: string; tasks: any[], onTaskClick: (task: any) => void }) => (
  <div className="flex flex-col w-72 md:w-80 bg-secondary/50 rounded-lg flex-shrink-0 border border-dashed">
    <div className="p-4 font-bold border-b flex items-center justify-between uppercase text-[10px] tracking-widest text-muted-foreground">
      {title} <span>{tasks.length}</span>
    </div>
    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
      {tasks.map(task => (
        <Card 
            key={task.id} 
            className="p-4 bg-background shadow-sm hover:shadow-md transition-all cursor-pointer border-none"
            onClick={() => onTaskClick(task)}
        >
          <p className="text-sm font-medium">{task.title}</p>
          <div className="mt-2 flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-accent" />
             <span className="text-[10px] text-muted-foreground font-mono">TASK-{task.id.slice(-4)}</span>
          </div>
        </Card>
      ))}
      {title === 'To Do' && (
        <Button variant="ghost" className="w-full justify-start text-muted-foreground h-12 border-2 border-dashed">
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      )}
    </div>
  </div>
);

const DocumentsTab = () => (
  <Card className="border-none shadow-xl">
    <CardContent className="pt-6">
       <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Shared Resources</h3>
          <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add URL Resource</Button>
       </div>
       <div className="p-12 text-center border-2 border-dashed rounded-lg bg-secondary/20">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No documents shared yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Use the "Hub & Spoke" model: Share external links to GitHub, Figma, or Drive.</p>
       </div>
    </CardContent>
  </Card>
);

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const { firestore, user } = useAuth();
  const { toast } = useToast();
  
  const projectRef = useMemoFirebase(() => firestore ? doc(firestore, 'projects', params.id) : null, [firestore, params.id]);
  const { data: project, isLoading } = useDoc<any>(projectRef);
  
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
        </div>
    );
  }

  if (!project) return notFound();
  
  const handleTaskClick = (task: any) => setSelectedTask(task);
  
  const handleTaskSubmit = (taskId: string, submission: { link: string; notes: string }) => {
    toast({
      title: 'Action Received',
      description: `Submission for "${selectedTask?.title}" recorded.`,
    });
    setSelectedTask(null);
  };

  const tasks = project.tasks || [];
  const tasksByStatus = {
    'To Do': tasks.filter((t: any) => t.status === 'To Do'),
    'In Progress': tasks.filter((t: any) => t.status === 'In Progress'),
    'Submitted': tasks.filter((t: any) => t.status === 'Submitted'),
    'Done': tasks.filter((t: any) => t.status === 'Done'),
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col bg-secondary/30">
        <div className="container mx-auto px-4 flex flex-col flex-1 py-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
                <Badge className="mb-2 bg-accent/10 text-accent border-accent/20 uppercase tracking-widest text-[10px]">Active Venture</Badge>
                <h1 className="text-4xl font-extrabold tracking-tight text-primary font-headline">{project.title}</h1>
                <p className="text-muted-foreground max-w-2xl mt-2">{project.description}</p>
            </div>
            <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Live Site
            </Button>
          </div>
          
          <Tabs defaultValue="board" className="flex flex-col flex-1">
            <TabsList className="mb-6 self-start bg-background p-1 border">
              <TabsTrigger value="board" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><LayoutGrid className="mr-2 h-4 w-4"/>Sprint Board</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><FileText className="mr-2 h-4 w-4"/>Venture Docs</TabsTrigger>
            </TabsList>
            <TabsContent value="board" className="flex-1 overflow-x-auto">
              <div className="flex space-x-6 pb-6 h-[60vh]">
                <KanbanColumn title="To Do" tasks={tasksByStatus['To Do']} onTaskClick={handleTaskClick} />
                <KanbanColumn title="In Progress" tasks={tasksByStatus['In Progress']} onTaskClick={handleTaskClick} />
                <KanbanColumn title="Review" tasks={tasksByStatus['Submitted']} onTaskClick={handleTaskClick} />
                <KanbanColumn title="Completed" tasks={tasksByStatus['Done']} onTaskClick={handleTaskClick} />
              </div>
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      {selectedTask && (
        <ProjectTaskSubmissionDialog
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={handleTaskSubmit}
          currentUserRole="student" 
        />
      )}
    </div>
  );
}
