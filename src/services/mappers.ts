import type { Address, BusinessSettings, CustomerInformation, Invoice, Order, OrderItem, OrderStatusEvent } from "@/types";

const numberValue = (value: unknown): number => Number(value ?? 0);
const asArray = <T,>(value: T | T[] | null | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

function mapAddress(value: unknown): Address {
  const address = (value ?? {}) as Record<string, unknown>;
  return {
    line1: String(address.line1 ?? ""),
    line2: String(address.line2 ?? "") || undefined,
    city: String(address.city ?? ""),
    region: String(address.region ?? ""),
    postalCode: String(address.postalCode ?? ""),
    country: String(address.country ?? ""),
  };
}

function mapCustomerInformation(row: any): CustomerInformation | undefined {
  if (!row) return undefined;
  return {
    fullName: String(row.fullName ?? row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    legalBusinessName: String(row.legalBusinessName ?? row.legal_business_name ?? ""),
    operatingName: String(row.operatingName ?? row.operating_name ?? "") || undefined,
    poNumber: String(row.poNumber ?? row.po_number ?? "") || undefined,
    billingAddress: mapAddress(row.billingAddress ?? row.billing_address),
    shippingAddress: mapAddress(row.shippingAddress ?? row.shipping_address),
    shippingSameAsBilling: Boolean(row.shippingSameAsBilling ?? row.shipping_same_as_billing),
    confirmedAccurate: Boolean(row.confirmedAccurate ?? row.confirmed_accurate),
    confirmedAuthorized: Boolean(row.confirmedAuthorized ?? row.confirmed_authorized),
    submittedAt: String(row.submittedAt ?? row.submitted_at ?? new Date().toISOString()),
  };
}

function mapOrderItem(row: any): OrderItem {
  return {
    id: String(row.id),
    description: String(row.description ?? ""),
    sku: String(row.sku ?? "") || undefined,
    quantity: numberValue(row.quantity),
    unitPrice: numberValue(row.unitPrice ?? row.unit_price),
    taxable: Boolean(row.taxable),
  };
}

export function mapOrder(row: any): Order {
  const rawItems = row.items ?? row.order_items;
  const rawTimeline = row.timeline ?? row.order_timeline;
  const rawCustomer = row.customerInformation ?? row.customer_information;
  const customer = Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer;

  const timeline: OrderStatusEvent[] = asArray<any>(rawTimeline)
    .map((event) => ({
      status: event.status,
      at: String(event.at ?? event.created_at),
      note: String(event.note ?? "") || undefined,
    }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const items = asArray<any>(rawItems)
    .sort((a, b) => numberValue(a.position) - numberValue(b.position))
    .map(mapOrderItem);

  return {
    id: String(row.id),
    orderNumber: String(row.orderNumber ?? row.order_number ?? ""),
    customerEmail: String(row.customerEmail ?? row.customer_email ?? ""),
    currency: String(row.currency ?? "USD"),
    dueInDays: numberValue(row.dueInDays ?? row.due_in_days),
    internalNotes: String(row.internalNotes ?? row.internal_notes ?? "") || undefined,
    items,
    discountType: row.discountType ?? row.discount_type ?? "fixed",
    discountValue: numberValue(row.discountValue ?? row.discount_value),
    taxRate: numberValue(row.taxRate ?? row.tax_rate),
    shipping: numberValue(row.shipping),
    status: row.status,
    token: String(row.token ?? row.public_token ?? ""),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? new Date().toISOString()),
    timeline,
    customerInformation: mapCustomerInformation(customer),
    sellerName: row.sellerName ? String(row.sellerName) : undefined,
    sellerPrimaryColor: row.sellerPrimaryColor ? String(row.sellerPrimaryColor) : undefined,
  };
}

export function mapSettings(row: any): BusinessSettings {
  return {
    legalBusinessName: String(row.legal_business_name ?? ""),
    displayName: String(row.display_name ?? "InvoiceFlow"),
    businessEmail: String(row.business_email ?? ""),
    phone: String(row.phone ?? ""),
    address: String(row.address ?? ""),
    taxId: String(row.tax_id ?? ""),
    invoicePrefix: String(row.invoice_prefix ?? "INV-"),
    nextInvoiceNumber: numberValue(row.next_invoice_number || 1001),
    defaultCurrency: String(row.default_currency ?? "USD"),
    defaultTaxRate: numberValue(row.default_tax_rate),
    defaultPaymentTerms: numberValue(row.default_payment_terms || 30),
    paymentInstructions: String(row.payment_instructions ?? ""),
    footerNotes: String(row.footer_notes ?? ""),
    primaryColor: String(row.primary_color ?? "#1e3a5f"),
    emailSubject: String(row.email_subject ?? "Your invoice {{invoice_number}}"),
    emailGreeting: String(row.email_greeting ?? "Hello {{customer_name}},"),
    emailBody: String(row.email_body ?? "Thank you for your order. Your invoice is attached."),
    emailClosing: String(row.email_closing ?? "Regards,\n{{business_name}}"),
  };
}

export function settingsToRow(settings: BusinessSettings, ownerId: string) {
  return {
    owner_id: ownerId,
    legal_business_name: settings.legalBusinessName,
    display_name: settings.displayName,
    business_email: settings.businessEmail,
    phone: settings.phone,
    address: settings.address,
    tax_id: settings.taxId,
    invoice_prefix: settings.invoicePrefix,
    next_invoice_number: settings.nextInvoiceNumber,
    default_currency: settings.defaultCurrency,
    default_tax_rate: settings.defaultTaxRate,
    default_payment_terms: settings.defaultPaymentTerms,
    payment_instructions: settings.paymentInstructions,
    footer_notes: settings.footerNotes,
    primary_color: settings.primaryColor,
    email_subject: settings.emailSubject,
    email_greeting: settings.emailGreeting,
    email_body: settings.emailBody,
    email_closing: settings.emailClosing,
  };
}

export function mapInvoice(row: any): Invoice {
  const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
  const customerRaw = order?.customer_information;
  const customer = Array.isArray(customerRaw) ? customerRaw[0] : customerRaw;
  return {
    id: String(row.id),
    invoiceNumber: String(row.invoice_number ?? ""),
    orderId: String(row.order_id ?? ""),
    orderNumber: String(order?.order_number ?? ""),
    customerEmail: String(customer?.email ?? order?.customer_email ?? ""),
    customerName: String(customer?.legal_business_name ?? "—"),
    amount: numberValue(row.total),
    currency: String(row.currency ?? "USD"),
    invoiceDate: String(row.invoice_date ?? row.created_at),
    emailStatus: row.email_status,
    pdfPath: row.pdf_path ? String(row.pdf_path) : undefined,
  };
}
