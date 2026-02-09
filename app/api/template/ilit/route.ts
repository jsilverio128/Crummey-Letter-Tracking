import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Main data sheet
    const worksheet = workbook.addWorksheet('ILIT Template');

    // Column definitions - ONLY required/standard fields for Supabase
    // Gift date is computed (premium_due_date - 1), so not needed as user input
    // Status is computed, crummey dates are optional/computed
    const columns = [
      { header: 'ilitName', key: 'ilitName', width: 20 },
      { header: 'insuredName', key: 'insuredName', width: 20 },
      { header: 'trustees', key: 'trustees', width: 25 },
      { header: 'insuranceCompany', key: 'insuranceCompany', width: 20 },
      { header: 'policyNumber', key: 'policyNumber', width: 15 },
      { header: 'frequency', key: 'frequency', width: 15 },
      { header: 'premiumDueDate', key: 'premiumDueDate', width: 15 },
      { header: 'premiumAmount', key: 'premiumAmount', width: 15 },
    ];

    worksheet.columns = columns;

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    // Add example rows with realistic fake data
    const exampleRows = [
      {
        ilitName: 'Smith Family ILIT',
        insuredName: 'John Smith',
        trustees: 'Jane Smith; Robert Smith',
        insuranceCompany: 'MetLife',
        policyNumber: 'UL-2024-001',
        frequency: 'Annual',
        premiumDueDate: '03/15/2026',
        premiumAmount: 2500,
      },
      {
        ilitName: 'Johnson Estate ILIT',
        insuredName: 'Mary Johnson',
        trustees: 'David Johnson',
        insuranceCompany: 'Northwestern Mutual',
        policyNumber: 'WL-2023-042',
        frequency: 'Monthly',
        premiumDueDate: '02/28/2026',
        premiumAmount: 450,
      },
      {
        ilitName: '',
        insuredName: '',
        trustees: '',
        insuranceCompany: '',
        policyNumber: '',
        frequency: '',
        premiumDueDate: '',
        premiumAmount: '',
      },
    ];

    // Add rows and format them
    exampleRows.forEach((row, idx) => {
      worksheet.addRow(row);
      
      const rowNum = idx + 2; // +2 because row 1 is header and arrays are 0-indexed
      const currentRow = worksheet.getRow(rowNum);
      
      currentRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
        
        // Format date columns (G = premiumDueDate)
        if (colNumber === 7) {
          cell.numFmt = 'mm/dd/yyyy';
        }
        // Format amount column (H = premiumAmount)
        if (colNumber === 8) {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    // Add instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.columns = [{ width: 80 }];
    
    const instructions = [
      'ILIT POLICY TEMPLATE - INSTRUCTIONS',
      '',
      'REQUIRED FIELDS:',
      '• ilitName - Name of the ILIT/Trust (REQUIRED)',
      '',
      'OPTIONAL FIELDS:',
      '• insuredName - Name of the insured person',
      '• trustees - Names of trustees, separated by semicolons (;)',
      '  Example: Jane Smith; Robert Smith',
      '• insuranceCompany - Name of the insurance company',
      '• policyNumber - Policy number or identifier',
      '• frequency - Payment frequency (Annual, Monthly, Quarterly, etc.)',
      '• premiumDueDate - Date the premium is due (mm/dd/yyyy format)',
      '• premiumAmount - Premium amount in dollars (do NOT include $ signs)',
      '',
      'AUTO-CALCULATED FIELDS:',
      '• giftDate - Automatically calculated as one day before premium due date',
      '• crummeyLetterSendDate - Automatically calculated based on reminder settings',
      '  (Default: 30 days before premium due date)',
      '',
      'HOW TO USE:',
      '1. Download this template',
      '2. Fill in your ILIT policy information',
      '3. Delete the example rows (rows 2-3) when done',
      '4. Save the file as .xlsx format',
      '5. Upload to the app through the Dashboard',
      '',
      'DATE FORMAT:',
      '• Use MM/DD/YYYY format (e.g., 03/15/2026)',
      '• Or paste dates from Excel (will be auto-formatted)',
      '',
      'TIPS:',
      '• You can copy/paste data from existing spreadsheets',
      '• All fields except ilitName are optional',
      '• The app is flexible with column names and will map them automatically',
      '• Changing reminder settings will recalculate crummey letter dates',
    ];

    instructions.forEach((line) => {
      const row = instructionsSheet.addRow([line]);
      if (line.includes(':') && !line.startsWith(' ') && line !== '') {
        row.font = { bold: true, size: 11 };
      }
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ILIT-Template.xlsx"',
      },
    });
  } catch (e: any) {
    console.error('Template generation error:', e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
