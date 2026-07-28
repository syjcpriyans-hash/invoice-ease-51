import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

type AddressValue = {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

type InvoicePdfItem = {
  description: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoicePdfInput = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  orderNumber: string;
  seller: {
    legalBusinessName: string;
    displayName: string;
    businessEmail: string;
    phone: string;
    address: string;
    taxId: string;
    paymentInstructions: string;
    footerNotes: string;
  };
  customer: {
    fullName: string;
    email: string;
    phone: string;
    legalBusinessName: string;
    operatingName?: string;
    poNumber?: string;
    billingAddress: AddressValue;
    shippingAddress: AddressValue;
  };
  items: InvoicePdfItem[];
  subtotal: number;
  discountAmount: number;
  shipping: number;
  taxRate: number;
  taxAmount: number;
  total: number;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 44;
const NAVY = rgb(0.08, 0.20, 0.34);
const TEAL = rgb(0.04, 0.55, 0.62);
const DARK = rgb(0.12, 0.14, 0.17);
const MUTED = rgb(0.38, 0.42, 0.47);
const BORDER = rgb(0.86, 0.88, 0.90);
const SOFT = rgb(0.96, 0.97, 0.98);
const WHITE = rgb(1, 1, 1);


function pdfSafeText(value: string): string {
  return value
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("\u2013", '-')
    .replaceAll("\u2014", '-')
    .replace(/[^\x20-\xFF]/g, '?');
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function addressLines(address: AddressValue): string[] {
  const cityLine = [address.city, address.region, address.postalCode].filter(Boolean).join(', ');
  return [address.line1, address.line2, cityLine, address.country]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = pdfSafeText(text).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }

    if (current) lines.push(current);

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
      continue;
    }

    let segment = '';
    for (const character of word) {
      const candidate = `${segment}${character}`;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && segment) {
        lines.push(segment);
        segment = character;
      } else {
        segment = candidate;
      }
    }
    current = segment;
  }

  if (current) lines.push(current);
  return lines;
}

function drawTextLines(
  page: PDFPage,
  lines: string[],
  options: {
    x: number;
    y: number;
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
    lineHeight?: number;
  },
): number {
  const lineHeight = options.lineHeight ?? options.size * 1.35;
  let y = options.y;
  for (const line of lines) {
    page.drawText(pdfSafeText(line), {
      x: options.x,
      y,
      font: options.font,
      size: options.size,
      color: options.color ?? DARK,
    });
    y -= lineHeight;
  }
  return y;
}

function drawRightText(
  page: PDFPage,
  text: string,
  xRight: number,
  y: number,
  font: PDFFont,
  size: number,
  color = DARK,
) {
  const safeText = pdfSafeText(text);
  page.drawText(safeText, {
    x: xRight - font.widthOfTextAtSize(safeText, size),
    y,
    font,
    size,
    color,
  });
}

function drawSectionLabel(page: PDFPage, text: string, x: number, y: number, font: PDFFont) {
  page.drawText(text.toUpperCase(), {
    x,
    y,
    size: 8,
    font,
    color: MUTED,
  });
}

export async function createInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${input.invoiceNumber}`);
  pdf.setSubject(`Invoice for order ${input.orderNumber}`);
  pdf.setAuthor(input.seller.displayName || input.seller.legalBusinessName || 'Invoice Ease');
  pdf.setCreator('Invoice Ease');
  pdf.setProducer('Invoice Ease');

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const businessName = input.seller.displayName || input.seller.legalBusinessName || 'Business';

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 116,
    width: PAGE_WIDTH,
    height: 116,
    color: NAVY,
  });
  page.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - 87, width: 32, height: 32, color: TEAL });
  page.drawText('IE', { x: MARGIN + 8.5, y: PAGE_HEIGHT - 77, font: bold, size: 12, color: WHITE });
  page.drawText(pdfSafeText(businessName), {
    x: MARGIN + 44,
    y: PAGE_HEIGHT - 68,
    font: bold,
    size: 18,
    color: WHITE,
  });
  page.drawText('INVOICE', {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize('INVOICE', 24),
    y: PAGE_HEIGHT - 67,
    font: bold,
    size: 24,
    color: WHITE,
  });
  drawRightText(page, input.invoiceNumber, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 89, regular, 10, WHITE);

  y = PAGE_HEIGHT - 144;
  const leftWidth = 240;
  const rightX = 350;

  drawSectionLabel(page, 'From', MARGIN, y, bold);
  drawSectionLabel(page, 'Invoice details', rightX, y, bold);
  y -= 18;

  const sellerLines = [
    input.seller.legalBusinessName || businessName,
    ...input.seller.address.split('\n').map((line) => line.trim()).filter(Boolean),
    input.seller.businessEmail,
    input.seller.phone,
    input.seller.taxId ? `Tax ID: ${input.seller.taxId}` : '',
  ].filter(Boolean);

  const sellerEndY = drawTextLines(page, sellerLines, {
    x: MARGIN,
    y,
    font: regular,
    size: 9.5,
    color: DARK,
    lineHeight: 14,
  });

  const details = [
    ['Invoice date', formatDate(input.invoiceDate)],
    ['Due date', formatDate(input.dueDate)],
    ['Order number', input.orderNumber],
    ['PO number', input.customer.poNumber || '-'],
  ];
  let detailsY = y;
  for (const [label, value] of details) {
    page.drawText(label, { x: rightX, y: detailsY, font: regular, size: 9, color: MUTED });
    drawRightText(page, value, PAGE_WIDTH - MARGIN, detailsY, bold, 9, DARK);
    detailsY -= 17;
  }

  y = Math.min(sellerEndY, detailsY) - 14;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: BORDER });
  y -= 24;

  const columnGap = 30;
  const columnWidth = (PAGE_WIDTH - MARGIN * 2 - columnGap) / 2;
  drawSectionLabel(page, 'Bill to', MARGIN, y, bold);
  drawSectionLabel(page, 'Ship to', MARGIN + columnWidth + columnGap, y, bold);
  y -= 18;

  const billLines = [
    input.customer.legalBusinessName,
    input.customer.operatingName || '',
    input.customer.fullName,
    ...addressLines(input.customer.billingAddress),
    input.customer.email,
    input.customer.phone,
  ].filter(Boolean);
  const shipLines = [
    input.customer.legalBusinessName,
    input.customer.fullName,
    ...addressLines(input.customer.shippingAddress),
  ].filter(Boolean);

  const billEndY = drawTextLines(page, billLines, {
    x: MARGIN,
    y,
    font: regular,
    size: 9.5,
    lineHeight: 14,
  });
  const shipEndY = drawTextLines(page, shipLines, {
    x: MARGIN + columnWidth + columnGap,
    y,
    font: regular,
    size: 9.5,
    lineHeight: 14,
  });

  y = Math.min(billEndY, shipEndY) - 18;

  const tableHeaderHeight = 28;
  const descX = MARGIN + 8;
  const skuX = 305;
  const qtyRight = 414;
  const unitRight = 492;
  const amountRight = PAGE_WIDTH - MARGIN - 8;

  function drawTableHeader(targetPage: PDFPage, headerY: number) {
    targetPage.drawRectangle({
      x: MARGIN,
      y: headerY - tableHeaderHeight + 7,
      width: PAGE_WIDTH - MARGIN * 2,
      height: tableHeaderHeight,
      color: SOFT,
      borderColor: BORDER,
      borderWidth: 0.8,
    });
    targetPage.drawText('DESCRIPTION', { x: descX, y: headerY - 10, font: bold, size: 7.5, color: MUTED });
    targetPage.drawText('SKU', { x: skuX, y: headerY - 10, font: bold, size: 7.5, color: MUTED });
    drawRightText(targetPage, 'QTY', qtyRight, headerY - 10, bold, 7.5, MUTED);
    drawRightText(targetPage, 'UNIT PRICE', unitRight, headerY - 10, bold, 7.5, MUTED);
    drawRightText(targetPage, 'AMOUNT', amountRight, headerY - 10, bold, 7.5, MUTED);
  }

  drawTableHeader(page, y);
  y -= tableHeaderHeight + 2;

  for (const item of input.items) {
    const descriptionLines = wrapText(item.description, regular, 9, 200);
    const rowHeight = Math.max(30, descriptionLines.length * 13 + 12);

    if (y - rowHeight < 215) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      page.drawText(`Invoice ${input.invoiceNumber}`, {
        x: MARGIN,
        y,
        font: bold,
        size: 12,
        color: NAVY,
      });
      drawRightText(page, 'Continued', PAGE_WIDTH - MARGIN, y, regular, 9, MUTED);
      y -= 25;
      drawTableHeader(page, y);
      y -= tableHeaderHeight + 2;
    }

    page.drawRectangle({
      x: MARGIN,
      y: y - rowHeight + 8,
      width: PAGE_WIDTH - MARGIN * 2,
      height: rowHeight,
      borderColor: BORDER,
      borderWidth: 0.6,
      color: WHITE,
    });

    drawTextLines(page, descriptionLines, {
      x: descX,
      y: y - 8,
      font: regular,
      size: 9,
      lineHeight: 13,
    });
    page.drawText(pdfSafeText(item.sku || '-'), { x: skuX, y: y - 8, font: regular, size: 8.5, color: MUTED });
    drawRightText(page, String(item.quantity), qtyRight, y - 8, regular, 9, DARK);
    drawRightText(page, money(item.unitPrice, input.currency), unitRight, y - 8, regular, 9, DARK);
    drawRightText(page, money(item.lineTotal, input.currency), amountRight, y - 8, bold, 9, DARK);
    y -= rowHeight;
  }

  y -= 18;
  if (y < 250) {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  const totalsX = 365;
  const totalsRight = PAGE_WIDTH - MARGIN;
  const totalRows: Array<[string, string, boolean]> = [
    ['Subtotal', money(input.subtotal, input.currency), false],
    ['Discount', `- ${money(input.discountAmount, input.currency)}`, false],
    ['Shipping', money(input.shipping, input.currency), false],
    [`Tax (${input.taxRate.toFixed(2)}%)`, money(input.taxAmount, input.currency), false],
    ['Total', money(input.total, input.currency), true],
  ];

  for (const [label, value, important] of totalRows) {
    if (important) {
      page.drawLine({
        start: { x: totalsX, y: y + 7 },
        end: { x: totalsRight, y: y + 7 },
        thickness: 1.2,
        color: NAVY,
      });
    }
    page.drawText(label, {
      x: totalsX,
      y,
      font: important ? bold : regular,
      size: important ? 11 : 9.5,
      color: important ? NAVY : MUTED,
    });
    drawRightText(page, value, totalsRight, y, important ? bold : regular, important ? 11 : 9.5, important ? NAVY : DARK);
    y -= important ? 24 : 18;
  }

  const notesTop = y - 6;
  const notesWidth = 285;
  if (input.seller.paymentInstructions.trim()) {
    drawSectionLabel(page, 'Payment instructions', MARGIN, notesTop, bold);
    drawTextLines(page, wrapText(input.seller.paymentInstructions, regular, 9, notesWidth), {
      x: MARGIN,
      y: notesTop - 18,
      font: regular,
      size: 9,
      color: DARK,
      lineHeight: 13,
    });
  }

  const footerText = input.seller.footerNotes.trim() || 'Thank you for your business.';
  page.drawLine({
    start: { x: MARGIN, y: 58 },
    end: { x: PAGE_WIDTH - MARGIN, y: 58 },
    thickness: 0.8,
    color: BORDER,
  });
  const footerLines = wrapText(footerText, regular, 8, PAGE_WIDTH - MARGIN * 2);
  drawTextLines(page, footerLines.slice(0, 2), {
    x: MARGIN,
    y: 43,
    font: regular,
    size: 8,
    color: MUTED,
    lineHeight: 11,
  });

  const pages = pdf.getPages();
  pages.forEach((currentPage, index) => {
    drawRightText(
      currentPage,
      `Page ${index + 1} of ${pages.length}`,
      PAGE_WIDTH - MARGIN,
      28,
      regular,
      7.5,
      MUTED,
    );
  });

  return pdf.save();
}
