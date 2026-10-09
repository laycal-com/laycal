import { cn } from '@/lib/utils';

/** Content column shared by every redesigned portal page. */
export function PortalPage({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8', className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Classes applied to anything Radix portals to <body>, which sits outside the page's dark scope. */
export const DARK_OVERLAY = 'dark border-border bg-popover text-popover-foreground';
