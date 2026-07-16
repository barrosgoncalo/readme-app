// packages/shared/src/hooks/useUserRole.js
//
// Extracted from the admin AppRouter's inline role-resolution effect.
// Centralizing it here means both the merged web AppRouter (and anything
// else that needs to know "is this user an admin?") share one source of
// truth instead of duplicating the fallback chain.
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext/web';
import { DB } from '../services/DB';

// Only two roles exist today: 'admin' and 'user'. Keep this list in sync
// with the roles setAdminStatus (Cloud Function) is willing to assign.
const VALID_ROLES = new Set(['admin', 'user']);

/**
 * Resolves the current user's role, prioritizing the ID token's custom
 * claim over Firestore.
 *
 * Why the token first: setAdminStatus (Cloud Function) bakes the role into
 * the user's Auth token via setCustomUserClaims, so it's cryptographically
 * signed and can't be tampered with client-side. The users/{uid}.role field
 * in Firestore is only a denormalized copy kept in sync for UI queries (e.g.
 * filtering/sorting the admin Users table) — it should never be treated as
 * the source of truth for access control.
 *
 * Firestore is only consulted as a fallback, for accounts whose token
 * predates any role ever being explicitly set on them.
 *
 * Returns { role, resolvingRole, refreshRole }.
 * - `role` is null until resolved, or if logged out.
 * - `resolvingRole` is true while the lookup is in flight.
 * - `refreshRole()` forces a token refresh + re-check. Custom claims only
 *   appear in getIdTokenResult() after the token refreshes (normally on the
 *   next ~hourly refresh, or on next login) — so call this right after an
 *   admin mutation like setAdminStatus if the affected user is in-session
 *   and needs to see the new role immediately.
 */
export function useUserRole() {
    const authContext = useAuth();
    const { currentUser, userLoggedIn } = authContext;

    const [role, setRole] = useState(null);
    const [resolvingRole, setResolvingRole] = useState(true);
    const [refreshTick, setRefreshTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const determineRole = async () => {
            if (!userLoggedIn || !currentUser) {
                if (!cancelled) {
                    setRole(null);
                    setResolvingRole(false);
                }
                return;
            }

            // 1. Token claim — authoritative, signed, tamper-proof.
            try {
                const forceRefresh = refreshTick > 0;
                const tokenResult = await currentUser.getIdTokenResult(forceRefresh);
                const tokenRole = tokenResult.claims?.role;
                if (VALID_ROLES.has(tokenRole)) {
                    if (!cancelled) {
                        setRole(tokenRole);
                        setResolvingRole(false);
                    }
                    return;
                }
            } catch (err) {
                console.warn('Failed to read role from ID token claims:', err);
            }

            // 2. Firestore fallback — only reached if the token has no role
            //    claim at all (e.g. a legacy account setAdminStatus never
            //    touched). Treat anything other than 'admin' as 'user'.
            try {
                const dbProfile = await DB.get('users', currentUser.uid);
                if (!cancelled) {
                    setRole(dbProfile?.role === 'admin' ? 'admin' : 'user');
                }
            } catch (err) {
                console.error('Firestore role fallback failed:', err);
                if (!cancelled) setRole('user');
            } finally {
                if (!cancelled) setResolvingRole(false);
            }
        };

        setResolvingRole(true);
        determineRole();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, userLoggedIn, refreshTick]);

    const refreshRole = () => setRefreshTick((t) => t + 1);

    return { role, resolvingRole, refreshRole };
}
