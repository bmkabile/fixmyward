'use client';
import { cn } from '@/lib/utils';
export const Button = ({ children, variant = 'primary', className, ...props }) => {
  const variants = { primary: 'bg-[#FFD100] text-black font-bold hover:bg-yellow-400', secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300', danger: 'bg-red-500 text-white hover:bg-red-600' };
  return <button className={cn('px-4 py-2 rounded-md transition-colors', variants[variant], className)} {...props}>{children}</button>;
};
