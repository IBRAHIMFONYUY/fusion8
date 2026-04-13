'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: 'fade-up' | 'fade-in' | 'slide-in-right' | 'slide-in-left';
  duration?: number;
  delay?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  animation = 'fade-up',
  duration = 700,
  delay = 0,
  className = '',
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const getAnimationClass = () => {
    if (!isVisible) return '';
    switch (animation) {
      case 'fade-up':
        return 'opacity-100 translate-y-0';
      case 'fade-in':
        return 'opacity-100';
      case 'slide-in-right':
        return 'opacity-100 translate-x-0';
      case 'slide-in-left':
        return 'opacity-100 translate-x-0';
      default:
        return 'opacity-100 translate-y-0';
    }
  };

  const getInitialClass = () => {
    if (isVisible) return '';
    switch (animation) {
      case 'fade-up':
        return 'opacity-0 translate-y-8';
      case 'fade-in':
        return 'opacity-0';
      case 'slide-in-right':
        return 'opacity-0 translate-x-8';
      case 'slide-in-left':
        return 'opacity-0 -translate-x-8';
      default:
        return 'opacity-0 translate-y-8';
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all ${getInitialClass()} ${getAnimationClass()} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
}
