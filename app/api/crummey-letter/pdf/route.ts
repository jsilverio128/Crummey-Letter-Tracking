import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

// Type definition inline
interface ILITPolicyRecord {
  id: string;
  ilitName: string;
  insuredName?: string;
  trustees?: string;
  premiumAmount?: number;
  giftDate?: string;
  crummeyLetterSendDate?: string | null;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = body as ILITPolicyRecord;

    // Validate required fields
    if (!record.ilitName) {
      return NextResponse.json({ error: 'ILIT name is required' }, { status: 400 });
    }

    // Create PDF in memory
    const doc = new PDFDocument({
      bufferPages: true,
      margin: 50,
    });

    // Collect PDF data
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Helper for adding sections
    const addSection = (title: string, y: number): number => {
      doc.fontSize(12).font('Helvetica-Bold').text(title, 50, y);
      return y + 20;
    };

    // Helper for adding content lines
    const addContent = (label: string, value: string, y: number): number => {
      doc.fontSize(11).font('Helvetica-Bold').text(label + ':', 50, y);
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(value, 200, y, { width: 300 });
      return y + 18;
    };

    // Header with date
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('CRUMMEY LETTER OF WITHDRAWAL RIGHTS', 50, 50, { align: 'center' });

    let y = 90;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.fontSize(10).font('Helvetica').text(`Date: ${currentDate}`, 50, y);

    // Recipient section
    y += 30;
    y = addContent('Trustee(s)', record.trustees || 'N/A', y);

    // Trust/ILIT section
    y += 5;
    y = addContent('Trust/ILIT Name', record.ilitName, y);

    // Insured section
    if (record.insuredName) {
      y += 5;
      y = addContent('Insured', record.insuredName, y);
    }

    // Gift information section
    y += 15;
    doc.fontSize(12).font('Helvetica-Bold').text('GIFT INFORMATION', 50, y);
    y += 20;

    if (record.giftDate) {
      y = addContent('Gift Date', formatDate(record.giftDate), y);
    }

    if (record.premiumAmount !== undefined) {
      y += 5;
      y = addContent('Gift Amount', formatCurrency(record.premiumAmount), y);
    }

    // Rights and conditions
    y += 20;
    doc.fontSize(12).font('Helvetica-Bold').text('WITHDRAWAL RIGHTS', 50, y);
    y += 20;

    const rightText = `This letter is to inform you of your withdrawal rights with respect to the gift 
mentioned above made to the ${record.ilitName || 'Trust'}. 

As a beneficiary of the above-named Trust, you are hereby notified that you have 
the right to withdraw, free of trust, that portion of any contribution to the Trust 
in an amount not in excess of the lesser of: (a) the amount of such contribution, or 
(b) the maximum amount allowable under applicable federal law.

This withdrawal right is limited to a period of ${record.crummeyLetterSendDate ? '30 days' : 'a specified period'} 
following delivery of this notice. If you wish to exercise this withdrawal right, you 
must make written demand upon the Trustee within this period.

This right of withdrawal applies only to gifts included in your taxable estate under 
the gift tax provisions of the Internal Revenue Code.

Unless you exercise this withdrawal right within the specified time period, your right 
to withdraw shall lapse, and the property shall continue to be held in the Trust subject 
to its terms.`;

    doc.fontSize(10).font('Helvetica').text(rightText, 50, y, {
      width: 495,
      align: 'left',
      lineGap: 3,
    });

    // Footer
    y = doc.y + 20;
    doc.fontSize(9).font('Helvetica-Italic').text('This is a notification of withdrawal rights. Please consult with your tax advisor.', 50, y, {
      width: 495,
      align: 'center',
    });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be fully written
    await new Promise((resolve) => {
      doc.on('finish', resolve);
    });

    // Combine chunks into single buffer
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Crummey-Letter-${record.ilitName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
