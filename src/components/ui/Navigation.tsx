'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 md:px-6 flex items-center justify-between h-16">
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
            'relative text-sm tracking-wide transition-colors duration-200 py-1',
            pathname === '/hunt'
              ? 'text-[var(--color-accent)] font-medium'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          The Hunt
          <span
            className={cn(
              'absolute bottom-0 left-0 h-px bg-[var(--color-accent)] transition-all duration-300',
              pathname === '/hunt' ? 'w-full' : 'w-0 group-hover:w-full'
            )}
            style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </Link>
      </div>

      <style>{`
        nav a:not(:first-child):hover span {
          width: 100% !important;
        }
      `}</style>
    </nav>
  );
}
