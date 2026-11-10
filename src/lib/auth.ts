import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn('Aviso: VITE_NEON_AUTH_URL não configurada no ambiente.');
}

export const auth = createAuthClient(authUrl || '', {
  adapter: BetterAuthReactAdapter(),
});

export const { useSession } = auth;
