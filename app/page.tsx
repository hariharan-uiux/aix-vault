"use client";

import { VaultApp } from "@/components/vault-app";
import { VaultProvider } from "@/lib/vault/store";

export default function HomePage() {
  return (
    <VaultProvider>
      <VaultApp />
    </VaultProvider>
  );
}
