import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full border-collapse', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('bg-neutral-50 dark:bg-neutral-800', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr
      className={cn(
        'border-b border-neutral-200 dark:border-neutral-800',
        'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: TableProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: TableProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100',
        className
      )}
    >
      {children}
    </td>
  );
}
