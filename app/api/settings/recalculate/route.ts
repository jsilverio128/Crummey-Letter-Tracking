import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

/**
 * POST /api/settings/recalculate
 * 
 * Recalculates crummey_letter_send_date for all policies when reminder_days_before changes.
 * This ensures that changing the reminder preference updates all existing policies.
 * 
 * Query params:
 * - reminderDaysBefore: number - the new reminder days setting
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const url = new URL(request.url);
    const reminderDaysBefore = parseInt(url.searchParams.get('reminderDaysBefore') || '30', 10);

    if (reminderDaysBefore < 1) {
      return NextResponse.json(
        { error: 'reminderDaysBefore must be >= 1' },
        { status: 400 }
      );
    }

    // Fetch all policies with premium_due_date
    const { data: policies, error: fetchError } = await supabase
      .from('ilit_policies')
      .select('id, premium_due_date')
      .not('premium_due_date', 'is', null);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!policies || policies.length === 0) {
      return NextResponse.json({ updated: 0 }, { status: 200 });
    }

    // Calculate new crummey_letter_send_date for each policy
    const updates = policies.map(policy => {
      const premiumDueDate = new Date(policy.premium_due_date + 'T00:00:00');
      premiumDueDate.setDate(premiumDueDate.getDate() - reminderDaysBefore);
      const newSendDate = premiumDueDate.toISOString().split('T')[0];

      return {
        id: policy.id,
        crummey_letter_send_date: newSendDate,
        updated_at: new Date().toISOString()
      };
    });

    // Perform batch update
    let updatedCount = 0;
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('ilit_policies')
        .update({
          crummey_letter_send_date: update.crummey_letter_send_date,
          updated_at: update.updated_at
        })
        .eq('id', update.id);

      if (!updateError) {
        updatedCount++;
      } else {
        console.error(`Failed to update policy ${update.id}:`, updateError);
      }
    }

    return NextResponse.json({ updated: updatedCount }, { status: 200 });
  } catch (e: any) {
    console.error('Recalculate error:', e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
