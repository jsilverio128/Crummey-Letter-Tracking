import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '../../../../../lib/supabase/server';
import { snakeToCamel } from '../../../../../lib/types';

/**
 * PATCH /api/ilit/policies/[id]
 * 
 * Updates a single policy record.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Policy ID required' }, { status: 400 });
    }

    const body = await request.json();

    // Convert camelCase to snake_case for database
    const dbUpdate: Record<string, any> = {};
    if (body.ilitName !== undefined) dbUpdate.ilit_name = body.ilitName;
    if (body.insuredName !== undefined) dbUpdate.insured_name = body.insuredName;
    if (body.trustees !== undefined) dbUpdate.trustees = body.trustees;
    if (body.insuranceCompany !== undefined) dbUpdate.insurance_company = body.insuranceCompany;
    if (body.policyNumber !== undefined) dbUpdate.policy_number = body.policyNumber;
    if (body.premiumDueDate !== undefined) dbUpdate.premium_due_date = body.premiumDueDate;
    if (body.premiumAmount !== undefined) dbUpdate.premium_amount = body.premiumAmount;
    if (body.frequency !== undefined) dbUpdate.frequency = body.frequency;
    if (body.giftDate !== undefined) dbUpdate.gift_date = body.giftDate;
    if (body.crummeyLetterSendDate !== undefined) dbUpdate.crummey_letter_send_date = body.crummeyLetterSendDate;
    if (body.crummeyLetterSentDate !== undefined) dbUpdate.crummey_letter_sent_date = body.crummeyLetterSentDate;
    if (body.status !== undefined) dbUpdate.status = body.status;

    dbUpdate.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('ilit_policies')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const camelCaseData = snakeToCamel(data);
    return NextResponse.json(camelCaseData, { status: 200 });
  } catch (e: any) {
    console.error('Update error:', e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
