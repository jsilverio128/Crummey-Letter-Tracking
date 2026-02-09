import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Main data sheet
    const worksheet = workbook.addWorksheet('ILIT Template');

    // Column definitions matching the core fields
    const columns = [
      { header: 'ilitName', key: 'ilitName', width: 20 },
      { header: 'insuredName', key: 'insuredName', width: 20 },
      { header: 'trustees', key: 'trustees', width: 25 },
      { header: 'policyNumber', key: 'policyNumber', width: 15 },
      { header: 'insuranceCompany', key: 'insuranceCompany', width: 20 },
      { header: 'paymentFrequency', key: 'paymentFrequency', width: 15 },
      { header: 'premiumDueDate', key: 'premiumDueDate', width: 15 },
      { header: 'premiumAmount', key: 'premiumAmount', width: 15 },
      { header: 'giftDate', key: 'giftDate', width: 15 },
      { header: 'crummeyLetterSendDate', key: 'crummeyLetterSendDate', width: 22 },
      { header: 'crummeyLetterSentDate', key: 'crummeyLetterSentDate', width: 22 },
    ];

    worksheet.columns = columns;

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    // Add example rows with realistic fake data
    // Note: giftDate will be set with formulas (premiumDueDate - 1)
    const exampleRows = [
      {
        ilitName: 'Smith Family ILIT',
        insuredName: 'John Smith',
        trustees: 'Jane Smith; Robert Smith',
        policyNumber: 'UL-2024-001',
        insuranceCompany: 'MetLife',
        paymentFrequency: 'Annual',
        premiumDueDate: '03/15/2026',
        premiumAmount: 2500,
        giftDate: -1, // Will be replaced with formula
        crummeyLetterSendDate: '02/08/2026',
        crummeyLetterSentDate: '',
      },
      {
        ilitName: 'Johnson Estate ILIT',
        insuredName: 'Mary Johnson',
        trustees: 'David Johnson',
        policyNumber: 'WL-2023-042',
        insuranceCompany: 'Northwestern Mutual',
        paymentFrequency: 'Monthly',
        premiumDueDate: '02/28/2026',
        premiumAmount: 450,
        giftDate: -1, // Will be replaced with formula
        crummeyLetterSendDate: '01/24/2026',
        crummeyLetterSentDate: '01/25/2026',
      },
    ];

    // Add rows and then set formulas for giftDate
    let rowNum = 2;
    exampleRows.forEach((row) => {
      const addRow: Record<string, any> = { ...row };
      delete addRow.giftDate; // Don't add the placeholder value
      worksheet.addRow(row);
      worksheet.addRow(addRow);
      
      // Set giftDate formula: =G2-1 (where G is premiumDueDate column)
      // premiumDueDate is column G (7th column)
      const giftDateCell = worksheet.getCell(`I${rowNum}`); // I is the 9th column (giftDate)
      giftDateCell.value = { formula: `=G${rowNum}-1` };
      giftDateCell.numFmt = 'mm/dd/yyyy';
      
      rowNum++;
    });

    // Format data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
                  // Format date columns (D=premiumDueDate, I=giftDate, J=crummeyLetterSendDate, K=crummeyLetterSentDate)
                  if ([7, 9, 10, 11].includes(colNumber)) {
                    cell.numFmt = 'mm/dd/yyyy';
                  }
                  // Format amount column (H=premiumAmount)
                  if (colNumber === 8) {
                    cell.numFmt = '#,##0.00';
                  }
        });
      }
    });

    // Add notes/instructions sheet
    const notesSheet = workbook.addWorksheet('Notes');
    notesSheet.columns = [{ width: 80 }];
    
    const notes = [
      'EXCEL TEMPLATE - FORMAT INSTRUCTIONS',
      '',
      'COLUMNS IN THIS TEMPLATE:',
      '• ilitName: Name of the ILIT or Trust (REQUIRED)',
      '• insuredName: Name of the insured person',
      '• trustees: Names of trustees (separate multiple with ; or ,)',
      '• policyNumber: Policy number from insurance company',
      '• insuranceCompany: Insurance company name',
      '• paymentFrequency: How often premium is due (Annual, Monthly, Quarterly, etc.)',
      '• premiumDueDate: When the next premium is due',
      '• premiumAmount: Amount of the premium payment',
      '• giftDate: Date the policy was gifted (auto-calculated as 1 day before premium due date)',
      '• crummeyLetterSendDate: When to send the Crummey letter',
      '• crummeyLetterSentDate: When the Crummey letter was actually sent',
      '',
      'DATE FORMAT:',
      '• Dates should be in MM/DD/YYYY format (e.g., 03/15/2026)',
      '• Alternatively, you can use Excel date values',
      '• Empty date cells will be skipped',
      '',
      'AMOUNT FORMAT:',
      '• Premiums should be entered as numbers (e.g., 2500 or 2500.50)',
      '• Do NOT include $ signs or commas',
      '',
      'GIFT DATE:',
      '• The example rows use a formula to calculate Gift Date',
      '• Gift Date = Premium Due Date - 1 day',
      '• You can delete the example rows and add your own',
      '',
      'TRUSTEES:',
      '• Separate multiple trustees with semicolons (;) or commas (,)',
      '• Example: Jane Smith; Robert Smith',
      '',
      'PAYMENT FREQUENCY:',
      '• Examples: Annual, Semi-Annual, Quarterly, Monthly, Bi-Weekly, Weekly',
      '',
      'IMPORT:',
      '• All fields except ilitName are optional',
      '• Download this template, fill in your data, and upload to the app',
      '• You can also upload older spreadsheets with different column names',
      '',
      'TIPS:',
      '• You can copy/paste data from your existing spreadsheets',
      '• Delete the example rows and add your own data',
      '• The app will auto-calculate "crummeyLetterSendDate" if not provided',
      '  using your configured reminder lead time (default 35 days)',
    ];

    notes.forEach((line) => {
      const row = notesSheet.addRow([line]);
      if (line.includes(':') && !line.startsWith(' ') && line !== '') {
        row.font = { bold: true };
      }
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ILIT-Template.xlsx"',
      },
    });

    return response;
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
