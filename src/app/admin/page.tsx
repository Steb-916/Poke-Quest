import Link from 'next/link';
import { CARDS } from '@/lib/utils/cardData';
import { AdminClient } from '@/components/admin/AdminClient';

export default function AdminPage() {
  const cardOptions = CARDS.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="min-h-screen pt-16">
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <span className="text-lg">&larr;</span>
            <span className="tracking-wide">Back to Vault</span>
          </Link>
        </div>

        <h1 className="font-[var(--font-display)] text-sm uppercase tracking-[0.3em] text-[var(--color-accent)] mb-2">
          Admin Panel
        </h1>
        <div className="h-px bg-[var(--color-accent)]/20 mb-8" />

        <AdminClient cardOptions={cardOptions} />
      </div>
    </div>
  );
}
