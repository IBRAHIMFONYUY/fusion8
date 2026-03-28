
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
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
  const [network, setNetwork] = useState<'MTN' | 'ORANGE'>('MTN');
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
            <div className="p-4 bg-secondary/50 rounded-lg border flex justify-between items-center">
              <span className="font-medium text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold text-accent">{price.toLocaleString()} XAF</span>
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup 
                value={network} 
                onValueChange={(v) => setNetwork(v as any)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="MTN" id="mtn" className="peer sr-only" />
                  <Label
                    htmlFor="mtn"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="font-bold">MTN</span>
                    <span className="text-xs text-muted-foreground uppercase">MoMo</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="ORANGE" id="orange" className="peer sr-only" />
                  <Label
                    htmlFor="orange"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="font-bold">Orange</span>
                    <span className="text-xs text-muted-foreground uppercase">Money</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Cameroon)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="67xxxxxxx / 69xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Secure payment processed by Fapshi.
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
