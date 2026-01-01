/**
 * Global type definitions for externally injected libraries
 */

interface SupabaseAuthSession {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: {
        id: string;
        email?: string;
        [key: string]: unknown;
    };
}

interface SupabaseAuth {
    getSession(): Promise<{
        data: {
            session: SupabaseAuthSession | null;
        };
        error: unknown;
    }>;
    onAuthStateChange(
        callback: (event: string, session: SupabaseAuthSession | null) => void
    ): {
        data: {
            subscription: {
                unsubscribe: () => void;
            };
        };
    };
    signOut(): Promise<{ error: unknown }>;
}

interface SupabaseClient {
    auth: SupabaseAuth;
}

declare global {
    interface Window {
        supabase: SupabaseClient;
        datavizSupabase: SupabaseClient;
        datavizApiUrl: string;
    }
}

export { };
