import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

/**
 * For pages that only make sense signed in. Once Firebase has answered and
 * there is no user, send the visitor to the login dialog on `/` instead of
 * leaving them on a spinner that never resolves.
 */
export function useRequireAuth() {
  const authState = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authState.loading && !authState.user) {
      router.replace('/#login');
    }
  }, [authState.loading, authState.user, router]);

  return authState;
}
