import type { BusinessSettings } from "@/types";
import { APP_CONFIG } from "@/config/app";

export const DEFAULT_SETTINGS: BusinessSettings = {
  legalBusinessName: "",
  displayName: "InvoiceFlow",
  businessEmail: "",
  phone: "",
  address: "",
  taxId: "",
  invoicePrefix: "INV-",
  nextInvoiceNumber: 1001,
  defaultCurrency: APP_CONFIG.defaultCurrency,
  defaultTaxRate: APP_CONFIG.defaultTaxRate,
  defaultPaymentTerms: 30,
  paymentInstructions: "",
  footerNotes: "Thank you for your business.",
  primaryColor: "#1e3a5f",
  emailSubject: "Invoice {{invoice_number}} from {{business_name}}",
  emailGreeting: "Hello {{customer_name}},",
  emailBody: "Please find your invoice attached.",
  emailClosing: "Regards,\n{{business_name}}",
};
