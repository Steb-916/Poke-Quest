'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        {/* Left: Logo */}
        <Link
          href="/"
          className="font-[var(--font-display)] text-base font-bold tracking-wider uppercase text-[var(--color-accent)] transition-colors duration-200 hover:text-[var(--color-text-primary)]"
        >
          The Vault
        </Link>

        {/* Right: The Hunt */}
        <Link
          href="/hunt"
          className={cn(
            'text-sm tracking-wide transition-colors duration-200',
            pathname === '/hunt'
              ? 'text-[var(--color-accent)] font-medium'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          The Hunt
        </Link>
      </div>
    </nav>
  );
}
