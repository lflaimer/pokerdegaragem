'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'owner' | 'admin' | 'member' | 'success' | 'warning' | 'danger' | 'secondary';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-poker-brown/10 text-poker-brown',
      owner: 'bg-poker-gold text-poker-brown-dark',
      admin: 'bg-poker-green text-white',
      member: 'bg-poker-brown/20 text-poker-brown',
      success: 'bg-poker-green/20 text-poker-green',
      warning: 'bg-poker-gold/20 text-poker-gold-dark',
      danger: 'bg-poker-red/20 text-poker-red',
      secondary: 'bg-poker-brown/10 text-poker-brown/60',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
