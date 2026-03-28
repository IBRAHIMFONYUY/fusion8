
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { DollarSign, Users, BookCheck, Clock, Loader2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { firestore, errorEmitter, FirestorePermissionError } from '@/firebase';

export default function AdminAnalyticsPage() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [topCourses, setTopCourses] = useState<any[]>([]);
    const [recentSignups, setRecentSignups] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const wrapFetch = async (promise: Promise<any>, path: string) => {
                    try {
                        return await promise;
                    } catch (err: any) {
                        if (err.code === 'permission-denied') {
                            errorEmitter.emit('permission-error', new FirestorePermissionError({
                                path,
                                operation: 'list',
                            }));
                        }
                        throw err;
                    }
                };

                const [courseSnap, userSnap] = await Promise.all([
                    wrapFetch(getDocs(query(collection(firestore, 'courses'), orderBy('enrolledCount', 'desc'), limit(10))), 'courses'),
                    wrapFetch(getDocs(query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(10))), 'users')
                ]);
                
                const courses = courseSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                const users = userSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

                setTopCourses(courses);
                setRecentSignups(users);

                const data = [];
                for (let i = 5; i >= 0; i--) {
                    data.push({
                        name: format(new Date(2024, 0 + i, 1), 'MMM'),
                        revenue: Math.floor(Math.random() * 500000) + 100000,
                        enrollments: Math.floor(Math.random() * 20) + 5
                    });
                }
                setChartData(data);

                setStats({
                    totalRevenue: (courses.reduce((acc: number, c: any) => acc + (c.price || 0) * (c.enrolledCount || 0), 0)).toLocaleString() + ' XAF',
                    avgEngagement: '92%',
                    completions: '45',
                    activeUsers: users.length
                });
            } catch (error: any) {
                // Handled via emitter
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                <p className="text-muted-foreground font-black tracking-widest uppercase text-xs">Generating Platform Intel...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black tracking-tighter font-headline uppercase">Platform Intel</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-md rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest">Est. Lifetime Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats?.totalRevenue}</div>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">+12% vs last month</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest">Active Learners</CardTitle>
                        <Users className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">+{stats?.activeUsers}</div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Verified profiles</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest">Credentials Issued</CardTitle>
                        <BookCheck className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats?.completions}</div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Certified completion</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest">Trajectory Health</CardTitle>
                        <Clock className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats?.avgEngagement}</div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Average retention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-xl rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            Growth Performance
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold">Revenue vs. Trajectory</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" hide />
                                <YAxis yAxisId="right" orientation="right" hide />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} name="Revenue (XAF)" />
                                <Line yAxisId="right" type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} name="Admissions" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card className="border-none shadow-xl rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">High Impact Content</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold">Top tracks by enrollment volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/30">
                                    <TableHead className="font-black text-[10px] uppercase">Curriculum</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase">Learners</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase">LTV (Est.)</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {topCourses.map((course: any) => (
                                    <TableRow key={course.id} className="hover:bg-accent/5">
                                        <TableCell className="font-black text-sm tracking-tighter uppercase">{course.title}</TableCell>
                                        <TableCell className="font-bold text-accent">{course.enrolledCount || 0}</TableCell>
                                        <TableCell className="font-mono text-xs">{((course.price || 0) * (course.enrolledCount || 0)).toLocaleString()} <span className="text-[8px]">XAF</span></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </div>
             <Card className="border-none shadow-xl rounded-[2rem]">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Acquisition Queue</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold">Latest platform participants</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/30">
                                <TableHead className="font-black text-[10px] uppercase">Identity</TableHead>
                                <TableHead className="font-black text-[10px] uppercase">Protocol</TableHead>
                                <TableHead className="font-black text-[10px] uppercase">Vetting Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentSignups.map((user: any) => (
                                <TableRow key={user.id} className="hover:bg-accent/5 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3 py-2">
                                            <Avatar className="h-8 w-8 ring-2 ring-accent/10">
                                                <AvatarImage src={user.photoURL} />
                                                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-black text-sm tracking-tighter uppercase leading-none">{user.displayName}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono mt-1">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">{user.role}</Badge></TableCell>
                                    <TableCell>
                                        {user.approved ? <Badge className="bg-green-600 border-none text-[8px] font-black uppercase">Verified</Badge> : <Badge variant="secondary" className="text-[8px] font-black uppercase animate-pulse">Pending</Badge>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
