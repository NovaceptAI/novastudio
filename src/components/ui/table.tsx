import { cn } from '@/lib/utils';

export function TableWrap({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('scrollbar-thin w-full overflow-x-auto', className)} {...props} />;
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-sm', className)} {...props} />;
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-border bg-subtle/60 px-3 py-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-border px-3 py-2.5 align-middle', className)} {...props} />;
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-subtle/50', className)} {...props} />;
}

interface SortableThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  active: boolean;
  direction: 'asc' | 'desc';
  onSort: () => void;
}

export function SortableTh({ active, direction, onSort, children, className, ...props }: SortableThProps) {
  return (
    <Th
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('p-0', className)}
      {...props}
    >
      <button
        type="button"
        onClick={onSort}
        className="flex w-full items-center gap-1 px-3 py-2 text-left uppercase transition-colors hover:text-foreground"
      >
        {children}
        <span aria-hidden className={cn('text-[9px]', active ? 'text-primary' : 'text-transparent')}>
          {direction === 'asc' ? '▲' : '▼'}
        </span>
      </button>
    </Th>
  );
}
