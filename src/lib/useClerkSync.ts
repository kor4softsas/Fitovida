'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from './auth';

/**
 * Hook para sincronizar el usuario de Clerk con el store local y la base de datos
 */
export function useClerkSync() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { user: localUser, setClerkUser, logout } = useAuthStore();
  const lastSyncedIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || isSyncingRef.current) return;

    if (isSignedIn && clerkUser) {
      // Solo sincronizar si el usuario cambió
      if (lastSyncedIdRef.current === clerkUser.id && localUser?.id === clerkUser.id) {
        return;
      }

      lastSyncedIdRef.current = clerkUser.id;
      isSyncingRef.current = true;

      // Sincronizar con la base de datos
      const syncUser = async () => {
        try {
          const userData = {
            clerk_id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            first_name: clerkUser.firstName || '',
            last_name: clerkUser.lastName || '',
          };

          // Guardar/actualizar usuario en MySQL
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          // Sincronizar datos al store local
          const syncedUser = {
            id: clerkUser.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
            addresses: localUser?.addresses || [],
          };

          setClerkUser(syncedUser);
        } catch (error) {
          console.error('Error sincronizando usuario:', error);
        } finally {
          isSyncingRef.current = false;
        }
      };

      syncUser();
    } else if (!isSignedIn && localUser) {
      lastSyncedIdRef.current = null;
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser?.id, isLoaded, isSignedIn]);

  return { isLoaded, isSignedIn, clerkUser };
}
