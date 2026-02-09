import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

const DEFAULT_REMINDER_DAYS = 30;

/**
 * GET /api/settings/reminder-days
 * 
 * Fetches the current reminder_days_before setting.
 */
export async function GET(request: Request) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('reminder_days_before')
      .eq('id', 'primary')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reminderDaysBefore = data?.reminder_days_before || DEFAULT_REMINDER_DAYS;
    return NextResponse.json({ reminder_days_before: reminderDaysBefore }, { status: 200 });
  } catch (e: any) {
    console.error('Fetch error:', e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}

/**
 * POST /api/settings/reminder-days
 * 
 * Updates the reminder_days_before setting.
 * Body: { reminder_days_before: number }
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    let reminderDaysBefore = body.reminder_days_before;

    // Validate input
    if (typeof reminderDaysBefore !== 'number' || reminderDaysBefore < 1) {
      return NextResponse.json(
        { error: 'reminder_days_before must be a number >= 1' },
        { status: 400 }
      );
    }

    reminderDaysBefore = Math.max(1, Math.floor(reminderDaysBefore));

    // Upsert the setting (use 'primary' as ID)
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(
        {
          id: 'primary',
          reminder_days_before: reminderDaysBefore,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reminder_days_before: data.reminder_days_before }, { status: 200 });
  } catch (e: any) {
    console.error('Update error:', e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
