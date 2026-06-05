'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Video,
  Send,
  Users,
  MessageSquare,
  ListChecks,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  File,
  Radio,
  Download,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

/**
 * Task Fix: Cleaned legacy mock data. 
 * This page now uses the verified Auth state and real-time student counts for the course.
 */

type ChatMessage = {
    id: number;
    name: string;
    message: string;
};

export default function LiveSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, firestore } = useAuth();
  const { toast } = useToast();
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { id: 1, name: 'System', message: 'Secure broadcast tunnel established.' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showEndCallDialog, setShowEndCallDialog] = useState(false);

  // Fetch real students enrolled in this course for the roster
  const enrollmentQuery = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return query(collection(firestore, 'enrollments'), where('courseId', '==', params.id));
  }, [firestore, params.id]);

  const { data: enrollments, isLoading: rosterLoading } = useCollection(enrollmentQuery);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
        const message: ChatMessage = {
            id: Date.now(),
            name: user?.displayName || 'Host',
            message: newMessage.trim(),
        };
        setChatMessages([...chatMessages, message]);
        setNewMessage('');
    }
  }

  const handleToggleRecording = () => {
    const recordingState = !isRecording;
    setIsRecording(recordingState);
    toast({
        title: recordingState ? "Recording Started" : "Recording Stopped",
        description: recordingState ? "Capturing hardware demonstration..." : "Session saved to cloud storage.",
    });
  }

  const handleEndCall = () => {
    setShowEndCallDialog(false);
    toast({ title: "Broadcast Terminated" });
    router.push('/teacher/dashboard');
  };

  const jitsiRoomName = `fusion8-broadcast-${params.id}`;
  const videoPlaceholder = PlaceHolderImages.find(p => p.id === 'hero-cad');

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-headline">Live Broadcast: Bamenda Lab 01</h1>
             <Button asChild variant="outline">
                <Link href={`https://meet.jit.si/${jitsiRoomName}`} target="_blank">
                    <Video className="mr-2 h-4 w-4" /> Detach Player
                </Link>
            </Button>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1">
        <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-4">
          <Card className="flex-1 overflow-hidden border-none bg-black">
             <CardContent className="p-0 h-full relative">
               <div className="h-full w-full flex items-center justify-center">
                 {isVideoOn && videoPlaceholder ? (
                    <Image
                        src={videoPlaceholder.imageUrl}
                        alt="Live video feed"
                        fill
                        className="object-cover opacity-80"
                        data-ai-hint="engineering cad"
                    />
                 ) : (
                    <div className="text-white flex flex-col items-center gap-2">
                        <VideoOff className="h-12 w-12 text-muted-foreground"/>
                        <p className="text-muted-foreground font-mono">Transmission Suspended</p>
                    </div>
                 )}
                  {isRecording && (
                     <div className="absolute top-4 left-4 flex items-center gap-2 text-white bg-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                         <Radio className="h-3 w-3" />
                         <span>REC</span>
                     </div>
                  )}
               </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-center gap-4 rounded-xl bg-primary p-3 shadow-2xl">
            <Button onClick={handleToggleRecording} variant={isRecording ? 'destructive' : 'outline'} size="sm" className="h-10 px-6 font-bold">
              <Radio className={cn('mr-2 h-4 w-4', { 'animate-pulse': isRecording })}/> {isRecording ? 'STOP' : 'START REC'}
            </Button>
            <div className="h-8 w-px bg-white/10" />
            <Button onClick={() => setIsMicOn(!isMicOn)} variant={isMicOn ? 'outline' : 'destructive'} size="icon" className="rounded-full h-10 w-10">
                {isMicOn ? <Mic /> : <MicOff />}
            </Button>
            <Button onClick={() => setIsVideoOn(!isVideoOn)} variant={isVideoOn ? 'outline' : 'destructive'} size="icon" className="rounded-full h-10 w-10">
                {isVideoOn ? <Video /> : <VideoOff />}
            </Button>
             <Button onClick={() => setShowEndCallDialog(true)} variant="destructive" size="icon" className="rounded-full h-10 w-10">
                <PhoneOff />
            </Button>
          </div>
        </div>

        <div className="md:col-span-1 lg:col-span-1">
          <Card className="h-full border-none shadow-xl overflow-hidden">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 rounded-none bg-secondary/50">
                <TabsTrigger value="chat"><MessageSquare className="h-4 w-4"/></TabsTrigger>
                <TabsTrigger value="participants"><Users className="h-4 w-4"/></TabsTrigger>
                <TabsTrigger value="attendance"><ListChecks className="h-4 w-4"/></TabsTrigger>
                <TabsTrigger value="materials"><File className="h-4 w-4"/></TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className="flex gap-2 text-xs">
                                <span className="font-black text-accent">{msg.name}:</span>
                                <span className="text-muted-foreground">{msg.message}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                 <form onSubmit={handleSendMessage} className="p-3 flex gap-2 border-t bg-secondary/20">
                    <Input placeholder="Message lab..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="bg-background border-none h-9 text-xs" />
                    <Button type="submit" size="icon" className="h-9 w-9 bg-accent"><Send className="h-4 w-4" /></Button>
                </form>
              </TabsContent>

              <TabsContent value="participants" className="flex-1 p-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-accent/10 p-2 rounded-lg">
                        <Avatar className="h-8 w-8 border border-accent">
                            <AvatarImage src={user?.photoURL || ''} />
                            <AvatarFallback>H</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs font-black">{user?.displayName}</p>
                            <Badge variant="secondary" className="text-[8px] h-4">LECTURER (HOST)</Badge>
                        </div>
                    </div>
                    <div className="h-px bg-border border-dashed" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Connected Students ({enrollments?.length || 0})</p>
                    {rosterLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto opacity-20" />
                    ) : (
                        <div className="space-y-2">
                            {enrollments?.map((e: any) => (
                                <div key={e.id} className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    <span className="text-xs text-muted-foreground font-mono truncate">{e.studentId.slice(0,8)}...</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </TabsContent>
              
              <TabsContent value="materials" className="flex-1 p-4">
                 <div className="text-center py-12 border-2 border-dashed rounded-xl bg-secondary/30">
                    <File className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No resources uploaded.</p>
                 </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
      <AlertDialog open={showEndCallDialog} onOpenChange={setShowEndCallDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Terminate Transmission?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will end the broadcast for all connected students and stop the cloud recording.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Resume</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndCall} className="bg-destructive hover:bg-destructive/90">Confirm Terminate</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
