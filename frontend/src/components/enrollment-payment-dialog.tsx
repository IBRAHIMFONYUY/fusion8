
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
import { Loader2, ShieldCheck } from 'lucide-react';
import { paymentService } from '@/services/payment-service';
import { useRouter } from 'next/navigation';

const PAYMENT_NUMBER = '680548673';

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
  const [email, setEmail] = useState('');
  const [network, setNetwork] = useState<'MTN' | 'Orange'>('MTN');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length < 9) {
      toast({ variant: 'destructive', title: 'Invalid Phone Number', description: 'Enter the Cameroon number you paid from.' });
      return;
    }
    if (!email || !email.includes('@')) {
      toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
      return;
    }

    setIsProcessing(true);
    try {
      await paymentService.initiatePayment({
        amount: price,
        phone,
        email,
        network,
        studentId,
        courseId,
      });

      toast({ title: 'Enrollment Confirmed!', description: 'Payment verified. Your course is now unlocked.' });
      onClose();
      router.push(`/student/courses/${courseId}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'There was an issue processing your payment. Try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const dialCode = network === 'MTN' ? '*126#' : '#150*50#';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handlePayment}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Enrollment & Payment</DialogTitle>
            <DialogDescription>
              Complete registration for <strong>{courseTitle}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">

            {/* Fee summary */}
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
              <div className="flex justify-between items-center pb-3 border-b border-accent/10 mb-3">
                <span className="font-bold text-accent">Total Course Fee</span>
                <span className="text-2xl font-black text-accent">{price.toLocaleString()} XAF</span>
              </div>

              {/* Network selector */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Your Network</p>
                <RadioGroup
                  value={network}
                  onValueChange={(v) => setNetwork(v as 'MTN' | 'Orange')}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label
                    htmlFor="pay-mtn"
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${network === 'MTN' ? 'border-yellow-400 bg-yellow-50' : 'border-border bg-background'}`}
                  >
                    <RadioGroupItem value="MTN" id="pay-mtn" />
                    <div>
                      <p className="font-black text-xs">MTN MoMo</p>
                      <p className="text-[10px] text-muted-foreground">Dial {network === 'MTN' ? dialCode : '*126#'}</p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="pay-orange"
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${network === 'Orange' ? 'border-orange-400 bg-orange-50' : 'border-border bg-background'}`}
                  >
                    <RadioGroupItem value="Orange" id="pay-orange" />
                    <div>
                      <p className="font-black text-xs">Orange Money</p>
                      <p className="text-[10px] text-muted-foreground">Dial {network === 'Orange' ? dialCode : '#150*50#'}</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-xs shrink-0">1</span>
                  Dial <span className="font-mono bg-background px-2 py-0.5 rounded text-accent mx-1">{dialCode}</span> to open {network} Mobile Money.
                </p>
                <p className="text-sm font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-xs shrink-0">2</span>
                  Send <span className="font-black mx-1">{price.toLocaleString()} XAF</span> to{' '}
                  <span className="font-black text-accent text-base tracking-widest mx-1">{PAYMENT_NUMBER}</span>
                </p>
                <p className="text-sm font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-xs shrink-0">3</span>
                  Enter the phone number and email below to verify.
                </p>
              </div>
            </div>

            {/* Phone number */}
            <div className="space-y-2">
              <Label htmlFor="pay-phone" className="font-bold text-sm">Phone Number Used to Pay</Label>
              <Input
                id="pay-phone"
                type="tel"
                placeholder="e.g. 67XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-12 text-lg font-bold tracking-widest"
              />
              <p className="text-[11px] text-muted-foreground">The exact {network} number you sent money from.</p>
            </div>

            {/* Email address */}
            <div className="space-y-2">
              <Label htmlFor="pay-email" className="font-bold text-sm">Your Email Address</Label>
              <Input
                id="pay-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
              <p className="text-[11px] text-muted-foreground">Your enrollment receipt will be sent here.</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/50 p-3 rounded-lg border">
              <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
              Your enrollment is activated immediately after payment verification.
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 font-bold" disabled={isProcessing}>
              {isProcessing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                'Confirm & Enroll'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
