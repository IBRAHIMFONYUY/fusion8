
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { paymentService } from '@/services/payment-service';
import { useRouter } from 'next/navigation';

interface EnrollmentPaymentDialogProps {
  courseId: string;
  courseTitle: string;
  price: number;
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EnrollmentPaymentDialog({
  courseId,
  courseTitle,
  price,
  studentId,
  isOpen,
  onClose,
}: EnrollmentPaymentDialogProps) {
  const [phone, setPhone] = useState('');
  const network = 'MTN';
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 9) {
      toast({
        variant: 'destructive',
        title: 'Invalid Phone Number',
        description: 'Please enter a valid Cameroon phone number.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      await paymentService.initiatePayment({
        amount: price,
        phone,
        network,
        studentId,
        courseId,
      });

      toast({
        title: 'Success!',
        description: 'Payment verified. You are now enrolled.',
      });
      
      onClose();
      router.push(`/student/courses/${courseId}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'There was an issue processing your payment.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handlePayment}>
          <DialogHeader>
            <DialogTitle>Enrollment & Payment</DialogTitle>
            <DialogDescription>
              Complete your registration for <strong>{courseTitle}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="p-4 bg-accent/10 border-accent/20 border rounded-xl space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-accent/10">
                <span className="font-bold text-accent">Total Course Fee</span>
                <span className="text-2xl font-black text-accent">{price.toLocaleString()} XAF</span>
              </div>
              
              <div className="space-y-2 pt-2">
                 <p className="text-sm font-bold flex items-center gap-2">
                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-xs">1</span>
                     Dial <span className="font-mono bg-secondary px-2 py-0.5 rounded text-accent">*126#</span> to access MTN Mobile Money.
                 </p>
                 <p className="text-sm font-bold flex items-center gap-2">
                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-xs">2</span>
                     Send <span className="font-black">{price.toLocaleString()} XAF</span> to <span className="font-black text-lg text-accent tracking-widest pl-1">680548673</span>
                 </p>
                 <p className="text-sm font-bold flex items-center gap-2">
                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-xs">3</span>
                     Enter the MTN number you paid from below to verify.
                 </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-bold text-sm">Your Payment Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 67XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-12 text-lg font-bold tracking-widest"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/50 p-3 rounded-lg border">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Your enrollment will be activated immediately after verifying the transaction.
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Pay & Enroll Now'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
