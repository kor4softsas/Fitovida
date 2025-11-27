'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function SSOCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)] mx-auto mb-4" />
        <p className="text-[var(--muted)]">Completando inicio de sesion...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
