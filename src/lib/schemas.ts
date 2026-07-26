import { z } from "zod";

export const addressSchema = z.object({
  line1: z.string().trim().min(1, "Address line 1 is required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  region: z.string().trim().min(1, "Province or state is required").max(100),
  postalCode: z.string().trim().min(2, "Postal or ZIP code is required").max(20),
  country: z.string().trim().min(1, "Country is required").max(100),
});

export const customerInformationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").max(120),
    email: z.string().trim().email("Enter a valid email address").max(255),
    phone: z.string().trim().min(7, "Phone number is required").max(40),
    legalBusinessName: z.string().trim().min(2, "Legal business name is required").max(200),
    operatingName: z.string().trim().max(200).optional().or(z.literal("")),
    poNumber: z.string().trim().max(60).optional().or(z.literal("")),
    billingAddress: addressSchema,
    shippingSameAsBilling: z.boolean(),
    shippingAddress: addressSchema.partial().optional(),
    confirmedAccurate: z.literal(true, {
      errorMap: () => ({ message: "Please confirm the information is accurate" }),
    }),
    confirmedAuthorized: z.literal(true, {
      errorMap: () => ({ message: "Please confirm you are authorized to provide these details" }),
    }),
  })
  .superRefine((values, ctx) => {
    if (values.shippingSameAsBilling) return;
    const parsed = addressSchema.safeParse(values.shippingAddress ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["shippingAddress", ...issue.path],
          message: issue.message,
        });
      }
    }
  });

export type CustomerFormValues = z.infer<typeof customerInformationSchema>;

export const orderItemSchema = z.object({
  id: z.string(),
  description: z.string().trim().min(1, "Description is required").max(200),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitPrice: z.number().min(0, "Unit price must be zero or greater"),
  taxable: z.boolean(),
});

export const createOrderSchema = z.object({
  orderNumber: z.string().trim().min(3, "Order number is required").max(60),
  customerEmail: z.string().trim().email("Enter a valid email address").max(255),
  currency: z.string().min(3).max(3),
  dueInDays: z.number().int().min(1, "Due in days must be at least 1").max(365),
  internalNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  discountType: z.enum(["fixed", "percentage"]),
  discountValue: z.number().min(0, "Discount cannot be negative"),
  taxRate: z.number().min(0, "Tax must be between 0 and 100").max(100, "Tax must be between 0 and 100"),
  shipping: z.number().min(0, "Shipping cannot be negative"),
});

export type CreateOrderValues = z.infer<typeof createOrderSchema>;

export const businessSettingsSchema = z.object({
  legalBusinessName: z.string().trim().min(2, "Legal business name is required").max(200),
  displayName: z.string().trim().min(2, "Display name is required").max(200),
  businessEmail: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Phone number is required").max(40),
  address: z.string().trim().min(5, "Address is required").max(500),
  taxId: z.string().trim().max(60),
  invoicePrefix: z.string().trim().min(1, "Invoice prefix is required").max(12),
  nextInvoiceNumber: z.number().int().min(1, "Next invoice number must be at least 1"),
  defaultCurrency: z.string().min(3).max(3),
  defaultTaxRate: z.number().min(0, "Tax must be between 0 and 100").max(100, "Tax must be between 0 and 100"),
  defaultPaymentTerms: z.number().int().min(0).max(365),
  paymentInstructions: z.string().trim().max(1000),
  footerNotes: z.string().trim().max(1000),
  primaryColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour such as #1e3a5f"),
  emailSubject: z.string().trim().min(3, "Email subject is required").max(200),
  emailGreeting: z.string().trim().max(200),
  emailBody: z.string().trim().max(2000),
  emailClosing: z.string().trim().max(500),
});

export type BusinessSettingsValues = z.infer<typeof businessSettingsSchema>;