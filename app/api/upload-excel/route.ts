import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: Request) {
  try {
    const fd = await request.formData();
    const file = fd.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });
    const name = String((file as any).name || '');
    if (!name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Please upload .xlsx files only' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(uint8 as any);
    const worksheet = workbook.worksheets.find(ws => ws.actualRowCount > 0) || workbook.worksheets[0];
    if (!worksheet) return NextResponse.json({ headers: [], rawData: [] });

    // read header row (first row)
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const raw = cell.text ?? (cell.value ?? '');
      const h = String(raw ?? '').trim();
      headers.push(h);
    });

    const rawData: Record<string, any>[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      // check if row is completely empty
      const values = row.values ?? [];
      const empty = (values as any[]).every((v: any) => v === null || v === undefined || v === '');
      if (empty) return;
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const cell = row.getCell(idx + 1);
        let val: any = cell.value;
        if (val === null || val === undefined) val = '';
        else if (val instanceof Date) val = val.toISOString().slice(0,10);
        else if (typeof val === 'object') {
          if ((val as any).text) val = String((val as any).text);
          else if ((val as any).richText) val = (val as any).richText.map((t:any)=>t.text).join('');
          else if ((val as any).formula) val = (val as any).result ?? '';
          else val = String(val);
        }
        obj[h] = val;
      });
      rawData.push(obj);
    });

    return NextResponse.json({ headers, rawData });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
