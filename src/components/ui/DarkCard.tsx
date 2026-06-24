import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function DarkCard({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('bg-slate-900 rounded-xl border border-slate-800', className)} {...props}>
      {children}
    </div>
  );
}

export function DarkCardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-800', className)} {...props}>
      {children}
    </div>
  );
}

export function DarkCardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}
