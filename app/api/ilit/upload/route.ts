import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createServerClient } from '../../../../lib/supabase/server';
import { rowsToRecords, normalizeRowToRecord } from '../../../../lib/parse-utils';
import { camelToSnake } from '../../../../lib/types';

/**
 * POST /api/ilit/upload
 * 
 * Handles Excel file uploads:
 * 1. Parses Excel file
 * 2. Normalizes rows to ILITPolicyRecord objects
 * 3. Converts to Supabase snake_case format
 * 4. Inserts policies into ilit_policies table
 * 5. Upserts clients table with distinct insured_name values
 * 
 * Query params:
 * - leadDays: number (default 30) - days before premium due to send Crummey letter
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const url = new URL(request.url);
    const leadDays = parseInt(url.searchParams.get('leadDays') || '30', 10);

    // Parse form data
    const fd = await request.formData();
    const file = fd.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'no file' }, { status: 400 });
    }

    // Validate file extension
    const name = String((file as any).name || '');
    if (!name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Please upload .xlsx files only' }, { status: 400 });
    }

    // Parse Excel workbook
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(uint8 as any);

    // Get worksheet with data
    const worksheet = workbook.worksheets.find(ws => ws.actualRowCount > 0) || workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ data: [], inserted: 0, clients: 0 }, { status: 200 });
    }

    // Extract headers
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const raw = cell.text ?? (cell.value ?? '');
      const h = String(raw ?? '').trim();
      headers.push(h);
    });

    // Extract data rows
    const rawData: Record<string, any>[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const values = row.values ?? [];
      const empty = (values as any[]).every((v: any) => v === null || v === undefined || v === '');
      if (empty) return;

      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const cell = row.getCell(idx + 1);
        let val: any = cell.value;
        if (val === null || val === undefined) val = '';
        else if (val instanceof Date) val = val.toISOString().slice(0, 10);
        else if (typeof val === 'object') {
          if ((val as any).text) val = String((val as any).text);
          else if ((val as any).richText) val = (val as any).richText.map((t: any) => t.text).join('');
          else if ((val as any).formula) val = (val as any).result ?? '';
          else val = String(val);
        }
        obj[h] = val;
      });
      rawData.push(obj);
    });

    // Normalize rows to ILITPolicyRecord (camelCase)
    const records = rowsToRecords(rawData, leadDays);

    // Convert to Supabase format (snake_case) and remove temp IDs
    const supabaseRecords = records.map(record => {
      const dbRecord = camelToSnake(record);
      // Remove temp IDs so Supabase generates new UUIDs
      if (dbRecord.id?.startsWith('temp-')) {
        delete (dbRecord as any).id;
      }
      return dbRecord;
    });

    // Insert policies into Supabase
    const { data: insertedPolicies, error: insertError } = await supabase
      .from('ilit_policies')
      .insert(supabaseRecords)
      .select();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: `Failed to insert policies: ${insertError.message}` }, { status: 500 });
    }

    // Extract unique client names from insured_name
    const clientNames = new Set<string>();
    records.forEach(record => {
      if (record.insuredName && record.insuredName.trim()) {
        clientNames.add(record.insuredName.trim());
      }
    });

    // Upsert clients table
    let clientsInserted = 0;
    if (clientNames.size > 0) {
      const clientsData = Array.from(clientNames).map(name => ({
        name: name
      }));

      const { error: clientError } = await supabase
        .from('clients')
        .upsert(clientsData, { onConflict: 'name' });

      if (clientError) {
        console.error('Supabase client upsert error:', clientError);
        // Don't fail the whole operation if client upsert fails
      } else {
        clientsInserted = clientNames.size;
      }
    }

    return NextResponse.json({
      data: records,
      inserted: insertedPolicies?.length || 0,
      clients: clientsInserted
    }, { status: 200 });
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
