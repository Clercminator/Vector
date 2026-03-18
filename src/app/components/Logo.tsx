import React from 'react';
import { cn } from '@/app/components/ui/utils';

interface LogoProps {
  className?: string; // Container className
  imgClassName?: string; // Image className
  size?: number | string; // Size prop for compatibility with Lucide icons
}

export function Logo({ className, imgClassName = "object-contain", size }: LogoProps) {
  // If size is provided, we can apply it to width and height style or class
  // Lucide icons behave effectively as block/inline-block with size.
  // We'll prioritize className if provided, but use size as fallback/style.
  
  const style = size ? { width: size, height: size } : {};
  // Default size if neither className nor size is provided could be w-8 h-8 (32px) or whatever.
  // But let's act like an icon: if no size/class, maybe default to 24px (w-6 h-6).
  // However, previous usages were w-8 h-8.
  
  // If className is provided, we assume it handles size, OR we merge.
  // With cn, we can merge.
  
  return (
    <div 
      className={cn("flex items-center justify-center overflow-hidden rounded-lg", className)}
      style={style}
    >
      <img 
        src="/images/Logos/logo.png" 
        alt="Vector Logo" 
        className={cn("w-full h-full", imgClassName)}
      />
    </div>
  );
}
