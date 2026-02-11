import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../../lib/supabase/admin';

/**
 * GET /api/ilit/policies/get
 *
 * Fetches all ILIT policies ordered by premium_due_date
 * Returns all policies with their computed fields
 */
export async function GET() {
  try {
    console.log('[POLICIES] Fetching all policies');

    const admin = getAdminClient();
    const res = await admin
      .from('ilit_policies')
      .select('*')
      .order('premium_due_date', { ascending: true });

    if (res.error) {
      console.error('[POLICIES] Error fetching policies:', res.error);
      return NextResponse.json(
        { ok: false, error: res.error.message },
        { status: 500 }
      );
    }

    const policies = (res.data || []).map((row: any) => ({
      id: row.id,
      ilitName: row.ilit_name,
      insuredName: row.insured_name,
      trustees: row.trustees,
      insuranceCompany: row.insurance_company,
      policyNumber: row.policy_number,
      premiumDueDate: row.premium_due_date,
      premiumAmount: row.premium_amount,
      frequency: row.frequency,
      giftDate: row.gift_date,
      crummeyLetterSendDate: row.crummey_letter_send_date,
      crummeyLetterSentDate: row.crummey_letter_sent_date,
      status: row.status || 'Pending',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    console.log('[POLICIES] Returning', policies.length, 'policies');

    return NextResponse.json({
      ok: true,
      policies,
    });
  } catch (err: any) {
    console.error('[POLICIES] Unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
