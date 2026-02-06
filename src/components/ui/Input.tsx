'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-poker-brown mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 border-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-colors',
            error ? 'border-poker-red' : 'border-poker-brown/30',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-poker-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
