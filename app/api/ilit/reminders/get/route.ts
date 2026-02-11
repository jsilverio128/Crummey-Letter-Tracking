import { NextResponse } from 'next/server';
import { getAdminClient } from '../../../../../lib/supabase/admin';

/**
 * GET /api/ilit/reminders/get
 *
 * Fetches policies where Crummey letters are due
 * Criteria:
 * - crummey_letter_send_date <= today
 * - crummey_letter_sent_date IS NULL
 */
export async function GET() {
  try {
    console.log('[REMINDERS] Fetching pending reminders');

    const admin = getAdminClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const res = await admin
      .from('ilit_policies')
      .select('*')
      .lte('crummey_letter_send_date', today)
      .is('crummey_letter_sent_date', null)
      .order('crummey_letter_send_date', { ascending: true });

    if (res.error) {
      console.error('[REMINDERS] Error fetching reminders:', res.error);
      return NextResponse.json(
        { ok: false, error: res.error.message },
        { status: 500 }
      );
    }

    const reminders = (res.data || []).map((row: any) => ({
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

    console.log('[REMINDERS] Returning', reminders.length, 'pending reminders');

    return NextResponse.json({
      ok: true,
      reminders,
    });
  } catch (err: any) {
    console.error('[REMINDERS] Unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
