export const APP_CONFIG = {
  name: "InvoiceFlow",
  description:
    "Automated order-to-invoice workflow: lock an order, collect billing details, generate the invoice.",
  defaultCurrency: "USD",
  defaultTaxRate: 8.25,
} as const;

export const CURRENCIES = ["USD", "CAD", "EUR", "GBP"] as const;