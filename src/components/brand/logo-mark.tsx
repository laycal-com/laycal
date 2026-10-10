import Image from 'next/image';

import { cn } from '@/lib/utils';

/**
 * The Laycal symbol (phone and waveform), without the wordmark. Decorative by
 * default: every place it appears has the word "Laycal" or a labelled link
 * beside it, so it carries no alt text of its own.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/assets/logo.png"
      alt=""
      width={516}
      height={482}
      sizes="32px"
      priority
      className={cn('h-7 w-auto shrink-0', className)}
    />
  );
}
