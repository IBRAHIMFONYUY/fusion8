
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, Loader2, Info, Rocket, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { EmptyState } from '@/components/empty-state';

export default function StudentNotificationsPage() {
  const { user, firestore } = useAuth();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Task: Filter by user ID to satisfy security rules for non-admins
    return query(
        collection(firestore, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const handleMarkRead = async (id: string) => {
    try {
        await deleteDoc(doc(firestore, 'notifications', id));
    } catch (e) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
        case 'LIVE_SESSION': return <Calendar className="h-5 w-5 text-accent" />;
        case 'NEW_LESSON': return <Rocket className="h-5 w-5 text-primary" />;
        default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
        <div className="flex justify-center p-24"><Loader2 className="animate-spin h-12 w-12 text-accent" /></div>
    );
  }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-black font-headline tracking-tighter uppercase">Dispatch Center</h1>
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-secondary/30 border-b border-dashed">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg">Real-Time Sync</CardTitle>
                    <CardDescription>Stay updated with lab schedules and course releases.</CardDescription>
                </div>
                {notifications && notifications.length > 0 && (
                    <Button variant="outline" size="sm" className="font-bold border-2 rounded-xl">Clear All</Button>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {notifications && notifications.length > 0 ? (
                <div className="divide-y">
                    {notifications.map(notif => (
                        <div key={notif.id} className="flex items-start gap-4 p-6 hover:bg-secondary/20 transition-colors">
                            <div className="mt-1 p-2 bg-secondary rounded-lg">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm leading-tight">{notif.message}</p>
                                <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
                                    {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleMarkRead(notif.id)} className="hover:text-accent">
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12">
                    <EmptyState 
                        icon={Bell}
                        title="Quiet center"
                        description="Your notification feed is currently clear. You'll be alerted here when mentors schedule new labs."
                    />
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
