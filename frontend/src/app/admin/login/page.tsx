'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInUser, PLATFORM_ADMIN_EMAIL } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signInUser(email, password);
      
      if (result.success) {
        if (result.role !== 'admin' && email.toLowerCase() !== PLATFORM_ADMIN_EMAIL) {
            setError("Unauthorized: This portal requires Administrative credentials.");
            setLoading(false);
            return;
        }
        
        toast({ 
            title: "Identity Verified", 
            description: "Accessing platform governance dashboard..." 
        });
        
        // Wait for Firestore markers to propagate slightly
        setTimeout(() => {
            router.push('/admin/dashboard');
        }, 1000);
      } else if ('error' in result) {
        setError(result.error || "Invalid credentials.");
      }
    } catch (err) {
      setError("Critical: Gateway connection failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-theme min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-accent/10 rounded-full">
                <Shield className="h-10 w-10 text-accent" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter font-headline">GOVERNANCE PORTAL</CardTitle>
          <CardDescription>Enter administrative credentials to access platform control.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin ID</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="ceo@fusion8.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Security Key</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Authorize Access"}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-secondary/50 rounded-lg text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-center">
            Restricted Entry • All actions are logged under the CEO protocol
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
