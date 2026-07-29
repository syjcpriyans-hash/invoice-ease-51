export type ParsedEmailItem = {
  description: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
};

export type ParsedOrderEmail = {
  orderNumber?: string;
  customerEmail?: string;
  currency?: string;
  dueInDays?: number;
  internalNotes?: string;
  discountType?: "fixed" | "percentage";
  discountValue?: number;
  taxRate?: number;
  shipping?: number;
  items: ParsedEmailItem[];
};

const ignoredItemLabels = [
  "subtotal",
  "total",
  "tax",
  "hst",
  "gst",
  "vat",
  "shipping",
  "delivery",
  "discount",
  "balance",
  "amount due",
  "grand total",
];

function cleanLine(line: string): string {
  return line
    .replace(/^\s*>+\s?/, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseMoneyFromLine(line: string): number | undefined {
  const matches = Array.from(
    line.matchAll(/(?:CAD|USD|EUR|GBP|AUD|US\$|C\$)?\s*\$?\s*(-?\d[\d,]*(?:\.\d{1,2})?)/gi),
  );

  if (matches.length === 0) return undefined;
  return parseNumber(matches[matches.length - 1]?.[1]);
}

function valueAfterLabel(lines: string[], labels: RegExp[]): string | undefined {
  for (const line of lines) {
    for (const label of labels) {
      const match = line.match(label);
      const value = match?.[1]?.trim();
      if (value) return value;
    }
  }
  return undefined;
}

function isIgnoredItemLine(line: string): boolean {
  const lower = line.toLowerCase();
  return ignoredItemLabels.some(
    (label) =>
      lower === label ||
      lower.startsWith(`${label}:`) ||
      lower.startsWith(`${label} `) ||
      lower.startsWith(`${label}\t`) ||
      lower.startsWith(`${label}|`),
  );
}

function itemFromDelimitedLine(line: string): ParsedEmailItem | undefined {
  const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : undefined;
  if (!delimiter) return undefined;

  const parts = line
    .split(delimiter)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3 || isIgnoredItemLine(parts[0])) return undefined;

  const last = parseMoneyFromLine(parts[parts.length - 1]);
  const previous = parseNumber(parts[parts.length - 2]?.replace(/[^\d.,-]/g, ""));

  if (last === undefined || previous === undefined || previous <= 0) return undefined;

  const headerText = parts.join(" ").toLowerCase();
  if (
    headerText.includes("description") &&
    headerText.includes("qty") &&
    (headerText.includes("price") || headerText.includes("amount"))
  ) {
    return undefined;
  }

  return {
    description: parts[0],
    sku: parts.length >= 4 ? parts.slice(1, -2).join(" ") || undefined : undefined,
    quantity: previous,
    unitPrice: last,
    taxable: true,
  };
}

function itemFromQuantityAtPrice(line: string): ParsedEmailItem | undefined {
  const match = line.match(
    /^(?:[-*•]\s*)?(\d+(?:\.\d+)?)\s*[x×]\s+(.+?)\s+(?:@|at)\s+(?:CAD|USD|EUR|GBP|AUD|US\$|C\$)?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i,
  );

  if (!match) return undefined;

  const quantity = parseNumber(match[1]);
  const unitPrice = parseNumber(match[3]);
  const description = match[2]?.trim();

  if (!description || quantity === undefined || unitPrice === undefined) return undefined;

  return {
    description,
    quantity,
    unitPrice,
    taxable: true,
  };
}

function itemFromDescriptionQuantityPrice(line: string): ParsedEmailItem | undefined {
  const match = line.match(
    /^(?:[-*•]\s*)?(.+?)\s+(?:-|–|—)\s*(?:qty(?:uantity)?\s*[:=]?\s*)?(\d+(?:\.\d+)?)\s*(?:-|–|—|@)\s*(?:unit\s+price|price)?\s*[:=]?\s*(?:CAD|USD|EUR|GBP|AUD|US\$|C\$)?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i,
  );

  if (!match || isIgnoredItemLine(match[1] ?? "")) return undefined;

  const quantity = parseNumber(match[2]);
  const unitPrice = parseNumber(match[3]);
  const description = match[1]?.trim();

  if (!description || quantity === undefined || unitPrice === undefined) return undefined;

  return {
    description,
    quantity,
    unitPrice,
    taxable: true,
  };
}

function itemFromLabelledLine(line: string): ParsedEmailItem | undefined {
  if (!/\bqty|quantity\b/i.test(line) || !/\bprice|unit price\b/i.test(line)) {
    return undefined;
  }

  const quantityMatch = line.match(/\b(?:qty|quantity)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  const priceMatch = line.match(
    /\b(?:unit\s+price|price)\s*[:=]?\s*(?:CAD|USD|EUR|GBP|AUD|US\$|C\$)?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i,
  );
  const skuMatch = line.match(/\bsku\s*[:=]?\s*([A-Za-z0-9._/-]+)/i);

  const quantity = parseNumber(quantityMatch?.[1]);
  const unitPrice = parseNumber(priceMatch?.[1]);

  if (quantity === undefined || unitPrice === undefined) return undefined;

  const description = line
    .replace(/\bsku\s*[:=]?\s*[A-Za-z0-9._/-]+/i, "")
    .replace(/\b(?:qty|quantity)\s*[:=]?\s*\d+(?:\.\d+)?/i, "")
    .replace(
      /\b(?:unit\s+price|price)\s*[:=]?\s*(?:CAD|USD|EUR|GBP|AUD|US\$|C\$)?\s*\$?\s*[\d,]+(?:\.\d{1,2})?/i,
      "",
    )
    .replace(/[-|;,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!description || isIgnoredItemLine(description)) return undefined;

  return {
    description,
    sku: skuMatch?.[1],
    quantity,
    unitPrice,
    taxable: true,
  };
}

function parseItem(line: string): ParsedEmailItem | undefined {
  if (!line || isIgnoredItemLine(line)) return undefined;

  return (
    itemFromDelimitedLine(line) ??
    itemFromQuantityAtPrice(line) ??
    itemFromDescriptionQuantityPrice(line) ??
    itemFromLabelledLine(line)
  );
}

function deduplicateItems(items: ParsedEmailItem[]): ParsedEmailItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = [
      item.description.toLowerCase(),
      item.sku?.toLowerCase() ?? "",
      item.quantity,
      item.unitPrice,
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseOrderEmail(rawText: string): ParsedOrderEmail {
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const labelledEmail = valueAfterLabel(lines, [
    /^(?:customer\s+email|email\s+address|bill\s+to\s+email|invoice\s+email)\s*[:=-]\s*(.+)$/i,
  ]);

  const customerEmail =
    labelledEmail?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ??
    rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();

  const orderNumber = valueAfterLabel(lines, [
    /^(?:order\s*(?:number|no\.?|#)|sales\s+order|reference\s*(?:number|no\.?|#))\s*[:=-]\s*(.+)$/i,
    /^(?:purchase\s+order|po\s*(?:number|no\.?|#))\s*[:=-]\s*(.+)$/i,
  ])?.replace(/\s+/g, " ");

  const currencyMatch = rawText.match(/\b(CAD|USD|EUR|GBP|AUD)\b/i);
  const currency = currencyMatch?.[1]?.toUpperCase() ??
    (/\bC\$\s*\d/i.test(rawText) ? "CAD" : /\bUS\$\s*\d/i.test(rawText) ? "USD" : undefined);

  const dueMatch =
    rawText.match(/\bnet\s*(\d{1,3})\b/i) ??
    rawText.match(/\bdue\s+(?:in|within)\s+(\d{1,3})\s+days?\b/i);
  const dueInDays = dueMatch ? parseNumber(dueMatch[1]) : undefined;

  const taxLine = lines.find((line) =>
    /^(?:tax|hst|gst|vat)(?:\s+rate)?\s*[:=-]/i.test(line),
  );
  const taxRate = taxLine
    ? parseNumber(taxLine.match(/(\d+(?:\.\d+)?)\s*%/)?.[1])
    : undefined;

  const shippingLine = lines.find((line) =>
    /^(?:shipping|delivery|freight)(?:\s+(?:charge|fee))?\s*[:=-]/i.test(line),
  );
  const shipping = shippingLine ? parseMoneyFromLine(shippingLine) : undefined;

  const percentageDiscountLine = lines.find(
    (line) => /^discount\s*[:=-]/i.test(line) && /%/.test(line),
  );
  const fixedDiscountLine = lines.find(
    (line) => /^discount\s*[:=-]/i.test(line) && !/%/.test(line),
  );

  const percentageDiscount = percentageDiscountLine
    ? parseNumber(percentageDiscountLine.match(/(\d+(?:\.\d+)?)\s*%/)?.[1])
    : undefined;
  const fixedDiscount =
    percentageDiscount === undefined && fixedDiscountLine
      ? parseMoneyFromLine(fixedDiscountLine)
      : undefined;

  const notes = valueAfterLabel(lines, [
    /^(?:notes?|comments?|special\s+instructions?)\s*[:=-]\s*(.+)$/i,
  ]);

  const items = deduplicateItems(
    lines
      .map(parseItem)
      .filter((item): item is ParsedEmailItem => Boolean(item)),
  );

  return {
    orderNumber,
    customerEmail,
    currency,
    dueInDays,
    internalNotes: notes,
    discountType:
      percentageDiscount !== undefined
        ? "percentage"
        : fixedDiscount !== undefined
          ? "fixed"
          : undefined,
    discountValue: percentageDiscount ?? fixedDiscount,
    taxRate,
    shipping,
    items,
  };
}
