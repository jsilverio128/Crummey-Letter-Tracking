import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { snakeToCamel } from '../../../../lib/types';

/**
 * GET /api/ilit/policies
 * 
 * Fetches all policies from ilit_policies table.
 * Converts from Supabase snake_case to camelCase for client use.
 */
export async function GET(request: Request) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('ilit_policies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert snake_case to camelCase for client
    const camelCaseData = (data || []).map(policy => snakeToCamel(policy));

    return NextResponse.json(camelCaseData, { status: 200 });
  } catch (e: any) {
    console.error('Fetch error:', e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
