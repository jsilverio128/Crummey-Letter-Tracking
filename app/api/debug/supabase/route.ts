import { NextResponse } from 'next/server';
import { getAdminClient, assertEnv } from '../../../../lib/supabase/admin';

/**
 * GET /api/debug/supabase
 * 
 * Health check endpoint for development.
 * Validates environment and tests basic Supabase connectivity.
 * 
 * REMOVE THIS ENDPOINT BEFORE PRODUCTION
 */
export async function GET(request: Request) {
  try {
    // Check environment variables
    let urlPresent = false;
    let anonPresent = false;
    let serviceRolePresent = false;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) urlPresent = true;
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) anonPresent = true;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) serviceRolePresent = true;

    // Get admin client and test query
    const admin = getAdminClient();

    const { data, error } = await admin
      .from('ilit_policies')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[DEBUG] Supabase query error:', error);
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          env: { urlPresent, anonPresent, serviceRolePresent },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      policiesCount: data?.length || 0,
      env: { urlPresent, anonPresent, serviceRolePresent },
      message: 'Supabase is connected and healthy',
    });
  } catch (err: any) {
    console.error('[DEBUG] Health check error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Unknown error',
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}
