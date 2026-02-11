import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../../lib/supabase/admin';

/**
 * GET /api/ilit/clients/get
 *
 * Fetches all distinct clients (insured names)
 * Groups policies by insured_name and returns count
 */
export async function GET() {
  try {
    console.log('[CLIENTS] Fetching all clients');

    const admin = getAdminClient();
    
    // Fetch clients table (already upserted during imports)
    const res = await admin
      .from('clients')
      .select('name')
      .order('name', { ascending: true });

    if (res.error) {
      console.error('[CLIENTS] Error fetching clients:', res.error);
      return NextResponse.json(
        { ok: false, error: res.error.message },
        { status: 500 }
      );
    }

    const clients = (res.data || []).map((row: any) => ({
      name: row.name,
    }));

    console.log('[CLIENTS] Returning', clients.length, 'clients');

    return NextResponse.json({
      ok: true,
      clients,
    });
  } catch (err: any) {
    console.error('[CLIENTS] Unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
