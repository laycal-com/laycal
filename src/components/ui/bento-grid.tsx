import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 transition duration-200 hover:shadow-xl dark:border-white/[0.08] dark:bg-neutral-950 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:border-white/[0.16]",
        className,
      )}
    >
      {header}
      <div className="px-2 pb-2 transition duration-200 group-hover/bento:translate-x-1">
        {icon}
        <div className="mt-2 mb-1.5 font-sans text-[17px] font-semibold tracking-tight text-neutral-600 dark:text-neutral-50">
          {title}
        </div>
        <div className="font-sans text-sm leading-relaxed font-normal text-neutral-600 dark:text-neutral-400">
          {description}
        </div>
      </div>
    </div>
  );
};
