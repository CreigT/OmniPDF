import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates a realistic sample PDF with multiple pages, text, and graphics.
 */
export async function createSamplePDF(title: string = 'OmniPDF Business Report', pageCount: number = 3): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { width, height } = page.getSize();

    // Top Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: rgb(0.08, 0.12, 0.22),
    });

    page.drawText(title, {
      x: 40,
      y: height - 48,
      size: 20,
      font: timesRomanFont,
      color: rgb(0.95, 0.95, 1.0),
    });

    page.drawText(`Page ${i} of ${pageCount} • Confidential Document`, {
      x: 40,
      y: height - 68,
      size: 10,
      font: regularFont,
      color: rgb(0.6, 0.7, 0.85),
    });

    // Content section
    page.drawText(`Section ${i}: Executive Analysis & Metrics`, {
      x: 40,
      y: height - 120,
      size: 14,
      font: timesRomanFont,
      color: rgb(0.12, 0.15, 0.25),
    });

    const bodyParagraphs = [
      `This document was generated for demonstration and testing within the OmniPDF SaaS Suite.`,
      `OmniPDF provides client-side, zero-leak processing for enterprise documents.`,
      `Performance benchmarks indicate sub-second processing speeds for merge, split, compress, and conversion operations.`,
      `Key highlights of this section:`,
      ` • Daily Free Tier: 3 conversions per day for all registered users.`,
      ` • Pro Tier: Unlimited high-throughput conversions with advanced OCR & compression.`,
      ` • Security: Zero server uploads required; all operations execute within your browser sandbox.`,
    ];

    let currentY = height - 150;
    for (const paragraph of bodyParagraphs) {
      page.drawText(paragraph, {
        x: 40,
        y: currentY,
        size: 11,
        font: regularFont,
        color: rgb(0.2, 0.25, 0.35),
      });
      currentY -= 22;
    }

    // Visual decorative diagram box
    page.drawRectangle({
      x: 40,
      y: currentY - 140,
      width: width - 80,
      height: 120,
      color: rgb(0.94, 0.96, 0.99),
      borderColor: rgb(0.75, 0.82, 0.92),
      borderWidth: 1,
    });

    page.drawText(`Metric Chart Simulation [Page ${i}]`, {
      x: 60,
      y: currentY - 50,
      size: 12,
      font: timesRomanFont,
      color: rgb(0.1, 0.3, 0.6),
    });

    page.drawText(`Conversion Efficiency: 99.8% | Compression Rate: 65% | Latency: 120ms`, {
      x: 60,
      y: currentY - 80,
      size: 10,
      font: regularFont,
      color: rgb(0.3, 0.4, 0.5),
    });

    // Footer
    page.drawLine({
      start: { x: 40, y: 50 },
      end: { x: width - 40, y: 50 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    page.drawText(`Generated with OmniPDF Pro • https://omnypdf.io`, {
      x: 40,
      y: 35,
      size: 9,
      font: regularFont,
      color: rgb(0.5, 0.55, 0.65),
    });

    page.drawText(`Page ${i}`, {
      x: width - 75,
      y: 35,
      size: 9,
      font: regularFont,
      color: rgb(0.5, 0.55, 0.65),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-sample.pdf`;
  return new File([blob], filename, { type: 'application/pdf' });
}

/**
 * Generates sample images for testing Image to PDF or Image Converter.
 */
export function createSampleImage(label: string = 'Invoice Snapshot', color: string = '#2563eb'): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const blob = new Blob([], { type: 'image/png' });
      resolve(new File([blob], `${label.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' }));
      return;
    }

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 600);

    // Header bar
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 800, 100);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(label, 40, 62);

    // Content details
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Sample Document / Image Asset', 40, 160);

    ctx.fillStyle = '#475569';
    ctx.font = '16px sans-serif';
    ctx.fillText('High-resolution graphic for testing PDF conversion & Image transformations.', 40, 200);
    ctx.fillText(`Timestamp: ${new Date().toLocaleTimeString()} • Resolution: 800x600 px`, 40, 230);

    // Box
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 270, 720, 260, 12);
    ctx.fill();
    ctx.stroke();

    // Chart representation inside
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(80, 420, 80, 80);
    ctx.fillRect(200, 360, 80, 140);
    ctx.fillRect(320, 320, 80, 180);
    ctx.fillRect(440, 380, 80, 120);
    ctx.fillRect(560, 300, 80, 200);
    ctx.globalAlpha = 1.0;

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], `${label.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' }));
      }
    }, 'image/png');
  });
}
