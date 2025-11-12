'use client';
import { cn } from '@/lib/utils';
export const Input = ({ label, id, className, ...props }) => (
  <div>
    {label && <label htmlFor={id} className='block text-sm font-medium text-gray-700 mb-1'>{label}</label>}
    <input id={id} className={cn('block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#007A33] focus:border-[#007A33] sm:text-sm', className)} {...props} />
  </div>
);
