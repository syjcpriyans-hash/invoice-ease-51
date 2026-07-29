export const APP_CONFIG = {
  name: "Billantra",
  description:
    "Automated invoice operations for businesses that confirm orders outside an online checkout.",
  defaultCurrency: "USD",
  defaultTaxRate: 8.25,
  waitlistCta: "Request early access",
} as const;

export const CURRENCIES = ["USD", "CAD", "EUR", "GBP"] as const;
