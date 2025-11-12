'use client';
import { Status } from '@/types';
import { cn } from '@/lib/utils';
export const StatusBadge = ({ status }) => {
  const colors = { [Status.Reported]: 'bg-red-100 text-red-800', [Status.InProgress]: 'bg-yellow-100 text-yellow-800', [Status.Fixed]: 'bg-green-100 text-green-800' };
  return <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', colors[status])}>{status}</span>;
};
