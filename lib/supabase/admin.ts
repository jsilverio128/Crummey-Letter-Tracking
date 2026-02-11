import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase admin client using service role key.
 * Use this for all backend operations that need elevated privileges.
 */

function assertEnv(): { url: string; serviceRoleKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `These must be set in .env.local or deployment environment.`
    );
    console.error(error);
    throw error;
  }

  return { url: url as string, serviceRoleKey: serviceRoleKey as string };
}

let adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (adminClient) return adminClient;

  const { url, serviceRoleKey } = assertEnv();
  adminClient = createClient(url, serviceRoleKey);
  return adminClient;
}

export { assertEnv };
