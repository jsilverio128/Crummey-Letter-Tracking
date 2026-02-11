import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../../lib/supabase/admin';

/**
 * GET /api/ilit/letters/get
 *
 * Fetches all Crummey letter records (pending and sent)
 * Criteria:
 * - crummey_letter_send_date is not null (has been scheduled)
 * Orders by send date, most recent first
 */
export async function GET() {
  try {
    console.log('[LETTERS] Fetching all Crummey letter records');

    const admin = getAdminClient();

    const res = await admin
      .from('ilit_policies')
      .select('*')
      .not('crummey_letter_send_date', 'is', null)
      .order('crummey_letter_send_date', { ascending: false });

    if (res.error) {
      console.error('[LETTERS] Error fetching letters:', res.error);
      return NextResponse.json(
        { ok: false, error: res.error.message },
        { status: 500 }
      );
    }

    const letters = (res.data || []).map((row: any) => ({
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
      status: row.crummey_letter_sent_date ? 'Letter Sent' : 'Letter Due',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    console.log('[LETTERS] Returning', letters.length, 'Crummey letter records');

    return NextResponse.json({
      ok: true,
      letters,
    });
  } catch (err: any) {
    console.error('[LETTERS] Unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
