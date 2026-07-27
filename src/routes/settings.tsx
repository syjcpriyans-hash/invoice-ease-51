import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { businessSettingsSchema, type BusinessSettingsValues } from "@/lib/schemas";
import { settingsService } from "@/services/settingsService";
import { formatInvoiceNumber } from "@/lib/format";
import { toast } from "sonner";
import { RequireAuth } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/services/seedData";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — InvoiceFlow" },
      { name: "description", content: "Business details, invoice defaults, branding and email template." },
      { property: "og:title", content: "Settings — InvoiceFlow" },
      {
        property: "og:description",
        content: "Business details, invoice defaults, branding and email template.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-xs">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function SettingsPage() {
  const form = useForm<BusinessSettingsValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  });

  useEffect(() => {
    let active = true;
    settingsService
      .get()
      .then((settings) => {
        if (active) form.reset(settings);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load settings");
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const values = form.watch();
  const errors = form.formState.errors;

  function field(
    name: keyof BusinessSettingsValues,
    label: string,
    options?: { type?: string; area?: boolean; span?: boolean },
  ) {
    const message = errors[name]?.message as string | undefined;
    return (
      <div className={`space-y-1.5 ${options?.span ? "sm:col-span-2" : ""}`} key={name}>
        <Label htmlFor={name}>{label}</Label>
        {options?.area ? (
          <Textarea id={name} rows={3} {...form.register(name)} />
        ) : (
          <Input
            id={name}
            type={options?.type ?? "text"}
            {...form.register(name, options?.type === "number" ? { valueAsNumber: true } : {})}
          />
        )}
        {message ? (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  async function onSubmit(data: BusinessSettingsValues) {
    try {
      await settingsService.save(data);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    }
  }

  return (
    <AppShell>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <PageHeader
          title="Settings"
          description="These defaults are applied to new orders and generated invoices."
          actions={
            <Button type="submit" size="sm">
              Save settings
            </Button>
          }
        />

        <Section title="Business information">
          {field("legalBusinessName", "Legal business name")}
          {field("displayName", "Display name")}
          {field("businessEmail", "Business email", { type: "email" })}
          {field("phone", "Phone number")}
          {field("address", "Address", { area: true, span: true })}
          {field("taxId", "Tax identification number")}
        </Section>

        <Section title="Invoice settings">
          {field("invoicePrefix", "Invoice prefix")}
          {field("nextInvoiceNumber", "Next invoice number", { type: "number" })}
          {field("defaultCurrency", "Default currency")}
          {field("defaultTaxRate", "Default tax rate (%)", { type: "number" })}
          {field("defaultPaymentTerms", "Default payment terms (days)", { type: "number" })}
          {field("paymentInstructions", "Payment instructions", { area: true, span: true })}
          {field("footerNotes", "Footer notes", { area: true, span: true })}
        </Section>

        <Section title="Branding">
          <div className="space-y-1.5">
            <Label htmlFor="logo">Logo upload</Label>
            <div
              id="logo"
              className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
            >
              Logo upload available once storage is connected
            </div>
          </div>
          {field("primaryColor", "Primary colour (hex)")}
          <div className="rounded-md border border-border p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice preview</p>
            <div className="mt-3 space-y-1">
              <p
                className="text-base font-semibold"
                style={{ color: values.primaryColor || "#1e3a5f" }}
              >
                {values.displayName || "Your business"}
              </p>
              <p className="text-sm text-muted-foreground">
                Invoice{" "}
                {formatInvoiceNumber(values.invoicePrefix || "INV", values.nextInvoiceNumber || 1)} ·{" "}
                {values.defaultCurrency || "USD"} · Net {values.defaultPaymentTerms ?? 30}
              </p>
            </div>
          </div>
        </Section>

        <Section title="Email template">
          {field("emailSubject", "Email subject", { span: true })}
          {field("emailGreeting", "Email greeting", { span: true })}
          {field("emailBody", "Email body", { area: true, span: true })}
          {field("emailClosing", "Email closing", { area: true, span: true })}
        </Section>

        <div className="flex justify-end">
          <Button type="submit">Save settings</Button>
        </div>
      </form>
    </AppShell>
  );
}