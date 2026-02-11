import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getAdminClient } from '../../../../lib/supabase/admin';

/**
 * POST /api/ilit/import
 *
 * Handles Excel file uploads end-to-end:
 * 1. Parse Excel file with ExcelJS
 * 2. Map columns by header name (case-insensitive)
 * 3. Normalize dates and amounts
 * 4. Fetch or create default app_settings
 * 5. Compute derived fields (gift_date, crummey_letter_send_date)
 * 6. Insert policies into ilit_policies
 * 7. Upsert clients from distinct insured_name values
 */
export async function POST(request: Request) {
  try {
    console.log('[IMPORT] Starting Excel import');

    const admin: any = getAdminClient();
    const fd = await request.formData();
    const file = fd.get('file') as File | null;

    if (!file) {
      console.error('[IMPORT] No file provided');
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      console.error('[IMPORT] Invalid file type:', file.name);
      return NextResponse.json({ ok: false, error: 'Only .xlsx files are supported' }, { status: 400 });
    }

    console.log('[IMPORT] Processing file:', file.name);

    // Parse Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      console.error('[IMPORT] No worksheet found');
      return NextResponse.json({ ok: false, error: 'Excel file is empty' }, { status: 400 });
    }

    // Read headers (first row, case-insensitive, trimmed)
    const headerRow = worksheet.getRow(1);
    const headers: Record<string, number> = {}; // normalized name -> column index
    headerRow.eachCell((cell, colNumber) => {
      const headerName = String(cell.value ?? '').trim().toLowerCase();
      if (headerName) {
        headers[headerName] = colNumber;
      }
    });

    console.log('[IMPORT] Headers found:', Object.keys(headers));

    // Verify required headers
    const requiredHeaders = ['ilitname', 'premiumduedate', 'premiumamount'];
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    if (missingHeaders.length > 0) {
      console.error('[IMPORT] Missing required headers:', missingHeaders);
      return NextResponse.json(
        { ok: false, error: `Missing required headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch or create default app_settings
    console.log('[IMPORT] Fetching app settings');
    const settingsResult: any = await admin
      .from('app_settings')
      .select('reminder_days_before')
      .eq('id', 'primary')
      .single();

    let reminderDaysBefore = 30; // default
    if (settingsResult.data) {
      reminderDaysBefore = settingsResult.data.reminder_days_before;
      console.log('[IMPORT] Settings found: reminder_days_before =', reminderDaysBefore);
    } else if (settingsResult.error?.code === 'PGRST116') {
      // Not found - create default
      console.log('[IMPORT] No settings found, creating default');
      const createRes = await admin.from('app_settings').insert({
        id: 'primary',
        reminder_days_before: 30,
      });
      if (createRes.error) {
        console.error('[IMPORT] Failed to create settings:', createRes.error);
      } else {
        console.log('[IMPORT] Default settings created');
      }
    } else if (settingsResult.error) {
      console.error('[IMPORT] Error fetching settings:', settingsResult.error);
    }

    // Parse data rows
    const policies: Record<string, any>[] = [];
    const clientNames = new Set<string>();

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      // Check if row is empty
      let hasData = false;
      row.eachCell(cell => {
        if (cell.value) hasData = true;
      });
      if (!hasData) return;

      try {
        // Extract values by normalized header name
        const getValue = (headerNames: string[]) => {
          for (const name of headerNames) {
            const colNum = headers[name];
            if (colNum) {
              const cell = row.getCell(colNum);
              return cell.value;
            }
          }
          return null;
        };

        // Parse fields
        const ilitName = String(getValue(['ilitname', 'ilit.name', 'ilit name']) ?? '').trim();
        const insuredName = String(getValue(['insuredname', 'insured.name', 'insured name', 'insured']) ?? '').trim();
        const trustees = String(getValue(['trustees', 'trustee']) ?? '').trim();
        const insuranceCompany = String(getValue(['insurancecompany', 'insurance.company', 'insurance company', 'company']) ?? '').trim();
        const policyNumber = String(getValue(['policynumber', 'policy.number', 'policy number', 'policy#']) ?? '').trim();
        const frequency = String(getValue(['frequency', 'paymentfrequency', 'payment.frequency', 'payment frequency']) ?? '').trim();
        const premiumDueDateRaw = getValue(['premiumduedate', 'premium.due.date', 'premium due date', 'duedate', 'due date']);
        const premiumAmountRaw = getValue(['premiumamount', 'premium.amount', 'premium amount', 'amount', 'premium']);

        if (!ilitName) {
          console.warn('[IMPORT] Row', rowNumber, 'skipped: no ilitName');
          return;
        }

        // Parse premium due date
        let premiumDueDate: string | null = null;
        if (premiumDueDateRaw) {
          if (premiumDueDateRaw instanceof Date) {
            premiumDueDate = premiumDueDateRaw.toISOString().split('T')[0];
          } else if (typeof premiumDueDateRaw === 'number') {
            // Excel serial number
            const date = new Date((premiumDueDateRaw - 25569) * 86400 * 1000);
            premiumDueDate = date.toISOString().split('T')[0];
          } else {
            // String
            const parsed = new Date(String(premiumDueDateRaw));
            if (!isNaN(parsed.getTime())) {
              premiumDueDate = parsed.toISOString().split('T')[0];
            }
          }
        }

        // Parse premium amount
        let premiumAmount: number | null = null;
        if (premiumAmountRaw) {
          const num = parseFloat(String(premiumAmountRaw).replace(/[$,]/g, ''));
          if (!isNaN(num)) {
            premiumAmount = num;
          }
        }

        // Compute derived fields
        let giftDate: string | null = null;
        let crummeyLetterSendDate: string | null = null;

        if (premiumDueDate) {
          // gift_date = premium_due_date - 1 day
          const giftDateObj = new Date(premiumDueDate + 'T00:00:00');
          giftDateObj.setDate(giftDateObj.getDate() - 1);
          giftDate = giftDateObj.toISOString().split('T')[0];

          // crummey_letter_send_date = premium_due_date - reminder_days_before
          const crummeyDateObj = new Date(premiumDueDate + 'T00:00:00');
          crummeyDateObj.setDate(crummeyDateObj.getDate() - reminderDaysBefore);
          crummeyLetterSendDate = crummeyDateObj.toISOString().split('T')[0];
        }

        const policy = {
          ilit_name: ilitName,
          insured_name: insuredName || null,
          trustees: trustees || null,
          insurance_company: insuranceCompany || null,
          policy_number: policyNumber || null,
          frequency: frequency || null,
          premium_due_date: premiumDueDate,
          premium_amount: premiumAmount,
          gift_date: giftDate,
          crummey_letter_send_date: crummeyLetterSendDate,
          crummey_letter_sent_date: null,
          status: 'Pending',
        };

        policies.push(policy);

        if (insuredName) {
          clientNames.add(insuredName);
        }

        console.log('[IMPORT] Row', rowNumber, 'parsed:', { ilitName, insuredName, premiumDueDate });
      } catch (err) {
        console.error('[IMPORT] Error parsing row', rowNumber, ':', err);
      }
    });

    if (policies.length === 0) {
      console.error('[IMPORT] No valid policies found in Excel');
      return NextResponse.json(
        { ok: false, error: 'No valid policies found in Excel file' },
        { status: 400 }
      );
    }

    console.log('[IMPORT] Inserting', policies.length, 'policies');

    // Insert policies
    const insertRes = await admin.from('ilit_policies').insert(policies);
    if (insertRes.error) {
      console.error('[IMPORT] Insert error:', insertRes.error);
      return NextResponse.json(
        { ok: false, error: `Failed to insert policies: ${insertRes.error.message}` },
        { status: 500 }
      );
    }

    console.log('[IMPORT] Policies inserted successfully');

    // Upsert clients
    if (clientNames.size > 0) {
      console.log('[IMPORT] Upserting', clientNames.size, 'clients');
      const clientsData = Array.from(clientNames).map(name => ({ name }));
      const clientRes = await admin.from('clients').upsert(clientsData, { onConflict: 'name' });
      if (clientRes.error) {
        console.error('[IMPORT] Client upsert error:', clientRes.error);
        // Don't fail the whole operation
      } else {
        console.log('[IMPORT] Clients upserted successfully');
      }
    }

    console.log('[IMPORT] Import completed successfully');

    return NextResponse.json({
      ok: true,
      insertedCount: policies.length,
      clientsCount: clientNames.size,
    });
  } catch (err: any) {
    console.error('[IMPORT] Unexpected error:', err);
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
