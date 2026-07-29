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
import {
  businessSettingsSchema,
  type BusinessSettingsValues,
} from "@/lib/schemas";
import { settingsService } from "@/services/settingsService";
import { formatInvoiceNumber } from "@/lib/format";
import { toast } from "sonner";
import { RequireAuth } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/services/seedData";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Billantra" },
      {
        name: "description",
        content:
          "Business details, invoice defaults, branding, and email templates.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});

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
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load settings",
        );
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
    options?: {
      type?: string;
      area?: boolean;
      span?: boolean;
    },
  ) {
    const message = errors[name]?.message as string | undefined;

    return (
      <div
        className={`space-y-1 ${
          options?.span ? "sm:col-span-2" : ""
        }`}
        key={name}
      >
        <Label htmlFor={name}>{label}</Label>
        {options?.area ? (
          <Textarea
            id={name}
            rows={3}
            {...form.register(name)}
          />
        ) : (
          <Input
            id={name}
            type={options?.type ?? "text"}
            {...form.register(
              name,
              options?.type === "number"
                ? { valueAsNumber: true }
                : {},
            )}
          />
        )}
        {message ? (
          <p className="text-xs text-[#071226]">{message}</p>
        ) : null}
      </div>
    );
  }

  async function onSubmit(data: BusinessSettingsValues) {
    try {
      await settingsService.save(data);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save settings",
      );
    }
  }

  const sectionClass =
    "overflow-hidden rounded-md border border-[#071226]/10 bg-[#FAF7F4]";
  const sectionHeader =
    "border-b border-[#071226]/10 px-4 py-2.5 text-[12px] font-semibold text-[#071226]";
  const sectionBody = "grid gap-3 p-4 sm:grid-cols-2";

  return (
    <AppShell>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <PageHeader
          title="Settings"
          description="Business identity, invoice defaults, and customer-facing email content."
          actions={
            <Button type="submit" size="sm">
              Save settings
            </Button>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <section className={sectionClass}>
              <h2 className={sectionHeader}>
                Business information
              </h2>
              <div className={sectionBody}>
                {field(
                  "legalBusinessName",
                  "Legal business name",
                )}
                {field("displayName", "Display name")}
                {field("businessEmail", "Business email", {
                  type: "email",
                })}
                {field("phone", "Phone number")}
                {field("address", "Address", {
                  area: true,
                  span: true,
                })}
                {field(
                  "taxId",
                  "Tax identification number",
                )}
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className={sectionHeader}>
                Invoice defaults
              </h2>
              <div className={sectionBody}>
                {field("invoicePrefix", "Invoice prefix")}
                {field(
                  "nextInvoiceNumber",
                  "Next invoice number",
                  { type: "number" },
                )}
                {field(
                  "defaultCurrency",
                  "Default currency",
                )}
                {field(
                  "defaultTaxRate",
                  "Default tax rate (%)",
                  { type: "number" },
                )}
                {field(
                  "defaultPaymentTerms",
                  "Payment terms (days)",
                  { type: "number" },
                )}
                {field(
                  "paymentInstructions",
                  "Payment instructions",
                  { area: true, span: true },
                )}
                {field("footerNotes", "Footer notes", {
                  area: true,
                  span: true,
                })}
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className={sectionHeader}>
                Email template
              </h2>
              <div className={sectionBody}>
                {field("emailSubject", "Email subject", {
                  span: true,
                })}
                {field("emailGreeting", "Email greeting", {
                  span: true,
                })}
                {field("emailBody", "Email body", {
                  area: true,
                  span: true,
                })}
                {field("emailClosing", "Email closing", {
                  area: true,
                  span: true,
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-3 xl:sticky xl:top-[72px] xl:self-start">
            <section className="dark-surface rounded-md bg-[#071226] p-4 text-white">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                Invoice preview
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {values.displayName || "Your business"}
              </p>
              <p className="mt-1 text-xs text-white">
                Invoice{" "}
                {formatInvoiceNumber(
                  values.invoicePrefix || "INV",
                  values.nextInvoiceNumber || 1,
                )}
              </p>
              <dl className="mt-4 divide-y divide-white/18 text-xs">
                <div className="flex justify-between py-2 text-white">
                  <dt className="text-white">Currency</dt>
                  <dd className="font-semibold text-white">
                    {values.defaultCurrency || "USD"}
                  </dd>
                </div>
                <div className="flex justify-between py-2 text-white">
                  <dt className="text-white">Terms</dt>
                  <dd className="font-semibold text-white">
                    Net {values.defaultPaymentTerms ?? 30}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-md border border-[#071226]/10 bg-[#FAF7F4] p-3">
              <h2 className="text-[12px] font-semibold text-[#071226]">
                Brand settings
              </h2>
              <div className="mt-3 space-y-1">
                <Label htmlFor="primaryColor">
                  Invoice accent colour
                </Label>
                <Input
                  id="primaryColor"
                  {...form.register("primaryColor")}
                />
              </div>
              <div className="mt-3 rounded-md border border-dashed border-[#071226]/16 px-3 py-5 text-center text-[11px] text-[#071226]/45">
                Logo upload becomes available after storage is connected.
              </div>
            </section>

            <Button type="submit" className="w-full">
              Save settings
            </Button>
          </aside>
        </div>
      </form>
    </AppShell>
  );
}
