export const APP_CONFIG = {
  name: 'Invoice Ease',
  description:
    'Turn confirmed orders into invoice-ready workflows with one customer link.',
  defaultCurrency: 'USD',
  defaultTaxRate: 8.25,
  waitlistCta: 'Join the waitlist',
} as const;

export const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP'] as const;
