export type OrderStatus =
  | "draft"
  | "link_sent"
  | "form_opened"
  | "submitted"
  | "invoice_generating"
  | "invoice_generated"
  | "email_queued"
  | "email_sent"
  | "delivered"
  | "failed";

export type EmailStatus =
  | "not_generated"
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed";

export type DiscountType = "fixed" | "percentage";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  unitPrice: number;
  taxable: boolean;
}

export interface OrderItem {
  id: string;
  description: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
}

export interface CustomerInformation {
  fullName: string;
  email: string;
  phone: string;
  legalBusinessName: string;
  operatingName?: string;
  poNumber?: string;
  billingAddress: Address;
  shippingAddress: Address;
  shippingSameAsBilling: boolean;
  confirmedAccurate: boolean;
  confirmedAuthorized: boolean;
  submittedAt: string;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  currency: string;
  dueInDays: number;
  internalNotes?: string;
  items: OrderItem[];
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  shipping: number;
  status: OrderStatus;
  token: string;
  createdAt: string;
  updatedAt: string;
  timeline: OrderStatusEvent[];
  customerInformation?: CustomerInformation;
  sellerName?: string;
  sellerPrimaryColor?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  emailStatus: EmailStatus;
  pdfPath?: string;
}

export interface BusinessSettings {
  legalBusinessName: string;
  displayName: string;
  businessEmail: string;
  phone: string;
  address: string;
  taxId: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultCurrency: string;
  defaultTaxRate: number;
  defaultPaymentTerms: number;
  paymentInstructions: string;
  footerNotes: string;
  logoUrl?: string;
  primaryColor: string;
  emailSubject: string;
  emailGreeting: string;
  emailBody: string;
  emailClosing: string;
}