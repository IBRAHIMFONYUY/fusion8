import Link from 'next/link';
import { Rocket, Twitter, Github, Linkedin, Mail, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
              <Rocket className="h-8 w-8 text-accent" />
              <span className="font-headline tracking-tighter">FUSION8</span>
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Accelerating the next generation of African engineering talent through project-based learning and collaborative innovation.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href="#" className="text-neutral-400 hover:text-accent transition-colors"><Twitter className="h-5 w-5" /></Link>
              <Link href="#" className="text-neutral-400 hover:text-accent transition-colors"><Github className="h-5 w-5" /></Link>
              <Link href="#" className="text-neutral-400 hover:text-accent transition-colors"><Linkedin className="h-5 w-5" /></Link>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold font-headline uppercase tracking-widest text-xs text-accent">For Students</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/courses" className="hover:text-white transition-colors">Course Catalog</Link></li>
              <li><Link href="/projects" className="hover:text-white transition-colors">Innovation Hub</Link></li>
              <li><Link href="/student/assignments" className="hover:text-white transition-colors">My Dashboard</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Student Portfolio</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold font-headline uppercase tracking-widest text-xs text-accent">For Partners</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/become-instructor" className="hover:text-white transition-colors">Teach on Fusion8</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Investor Relations</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sponsorships</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Corporate Training</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold font-headline uppercase tracking-widest text-xs text-accent">Contact</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@fusion8.com</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> Yaoundé, Cameroon</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500 text-xs">
          <p>© {new Date().getFullYear()} Fusion8 Engineering Accelerator. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
