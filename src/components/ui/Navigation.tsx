'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const navLinks = [
  { href: '/', label: 'The Vault' },
  { href: '/collection', label: 'Collection' },
  { href: '/hunt', label: 'The Hunt' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm tracking-wide transition-colors duration-200',
                pathname === link.href
                  ? 'text-[var(--color-accent)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                link.href === '/' && 'font-[var(--font-display)] text-base font-bold tracking-wider uppercase'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: Portfolio Value */}
        <div className="font-[var(--font-mono)] text-sm text-[var(--color-text-secondary)]">
          <span className="text-[var(--color-text-primary)]">$47,850</span>
          <span className="ml-1 text-[var(--color-text-tertiary)]">.99</span>
        </div>
      </div>
    </nav>
  );
}
