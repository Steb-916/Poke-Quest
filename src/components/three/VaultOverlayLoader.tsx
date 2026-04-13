'use client';

import dynamic from 'next/dynamic';

const VaultOverlay = dynamic(
  () => import('./VaultOverlay').then(mod => mod.VaultOverlay),
  { ssr: false }
);

export function VaultOverlayLoader() {
  return <VaultOverlay />;
}
