import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { AddressForm } from "@/components/address-form";
import { LockedOrderItems } from "@/components/locked-order-items";
import { OrderSummary } from "@/components/order-summary";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerInformationSchema, type CustomerFormValues } from "@/lib/schemas";
import { orderService } from "@/services/orderService";
import { settingsService } from "@/services/settingsService";
import { orderTotals } from "@/lib/format";
import { APP_CONFIG } from "@/config/app";
import type { Address, Order } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/$token/")({
  head: () => ({
    meta: [
      { title: "Confirm your billing information — InvoiceFlow" },
      {
        name: "description",
        content: "Review your locked order and submit billing details so your invoice can be issued.",
      },
      { property: "og:title", content: "Confirm your billing information — InvoiceFlow" },
      {
        property: "og:description",
        content: "Review your locked order and submit billing details so your invoice can be issued.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerFormPage,
});

const emptyAddress: Address = {
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
};

export function CustomerHeader({ sellerName }: { sellerName: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            IF
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{sellerName}</p>
            <p className="text-xs text-muted-foreground">Secure billing information request</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Powered by {APP_CONFIG.name}
        </span>
      </div>
    </header>
  );
}

function CustomerFormPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const sellerName = typeof window === "undefined" ? "" : settingsService.get().displayName;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerInformationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      legalBusinessName: "",
      operatingName: "",
      poNumber: "",
      billingAddress: { ...emptyAddress },
      shippingSameAsBilling: true,
      shippingAddress: { ...emptyAddress },
      confirmedAccurate: undefined as unknown as true,
      confirmedAuthorized: undefined as unknown as true,
    },
  });

  useEffect(() => {
    const found = orderService.getByToken(token);
    if (!found) {
      setOrder(null);
      return;
    }
    const opened = orderService.markFormOpened(token) ?? found;
    setOrder(opened);
    form.setValue("email", opened.customerEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-background p-6">
        <LoadingState label="Loading your order…" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ErrorState
          title="This link is not valid"
          description="The customer information link may have expired or been replaced. Please contact the seller."
        />
      </div>
    );
  }

  const totals = orderTotals(order);
  const alreadySubmitted = !!order.customerInformation;
  const sameAsBilling = form.watch("shippingSameAsBilling");
  const errors = form.formState.errors;

  function onSubmit(values: CustomerFormValues) {
    const billing = values.billingAddress as Address;
    const shipping = values.shippingSameAsBilling
      ? billing
      : ({ ...emptyAddress, ...values.shippingAddress } as Address);

    const result = orderService.submitCustomerInformation(token, {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      legalBusinessName: values.legalBusinessName,
      operatingName: values.operatingName,
      poNumber: values.poNumber,
      billingAddress: billing,
      shippingAddress: shipping,
      shippingSameAsBilling: values.shippingSameAsBilling,
      confirmedAccurate: true,
      confirmedAuthorized: true,
      submittedAt: new Date().toISOString(),
    });

    if (!result.ok) {
      toast.error(result.error ?? "Submission failed");
      return;
    }
    navigate({ to: "/customer/$token/success", params: { token } });
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader sellerName={sellerName || "Seller"} />

      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <section className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Confirm your billing information
          </h1>
          <p className="text-sm text-muted-foreground">
            Order {order.orderNumber} from {sellerName}. The order details below are final and cannot
            be changed here.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Your order (read-only)
          </h2>
          <LockedOrderItems items={order.items} currency={order.currency} />
          <OrderSummary totals={totals} currency={order.currency} taxRate={order.taxRate} />
        </section>

        {alreadySubmitted ? (
          <ErrorState
            title="Information already submitted"
            description="We have received your billing details for this order. Your invoice is being prepared."
          />
        ) : (
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <fieldset className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-xs">
              <legend className="text-sm font-semibold text-foreground">Contact details</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Contact person&apos;s full name</Label>
                  <Input id="fullName" {...form.register("fullName")} />
                  {errors.fullName ? (
                    <p role="alert" className="text-sm text-destructive">{errors.fullName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" {...form.register("email")} />
                  {errors.email ? (
                    <p role="alert" className="text-sm text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" type="tel" {...form.register("phone")} />
                  {errors.phone ? (
                    <p role="alert" className="text-sm text-destructive">{errors.phone.message}</p>
                  ) : null}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-xs">
              <legend className="text-sm font-semibold text-foreground">Business details</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="legalBusinessName">Legal business name</Label>
                  <Input id="legalBusinessName" {...form.register("legalBusinessName")} />
                  {errors.legalBusinessName ? (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.legalBusinessName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="operatingName">Operating or pharmacy name (optional)</Label>
                  <Input id="operatingName" {...form.register("operatingName")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="poNumber">Purchase-order number (optional)</Label>
                  <Input id="poNumber" {...form.register("poNumber")} />
                </div>
              </div>
            </fieldset>

            <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
              <AddressForm
                name="billingAddress"
                legend="Billing address"
                register={form.register}
                errors={errors}
              />
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="shippingSameAsBilling"
                  checked={sameAsBilling}
                  onCheckedChange={(checked) =>
                    form.setValue("shippingSameAsBilling", checked === true)
                  }
                />
                <Label htmlFor="shippingSameAsBilling">Shipping address same as billing address</Label>
              </div>
              {!sameAsBilling ? (
                <AddressForm
                  name="shippingAddress"
                  legend="Shipping address"
                  register={form.register}
                  errors={errors}
                />
              ) : null}
            </div>

            <fieldset className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-xs">
              <legend className="text-sm font-semibold text-foreground">Confirmation</legend>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="confirmedAccurate"
                  checked={form.watch("confirmedAccurate") === true}
                  onCheckedChange={(checked) =>
                    form.setValue("confirmedAccurate", (checked === true) as true, {
                      shouldValidate: true,
                    })
                  }
                />
                <Label htmlFor="confirmedAccurate" className="text-sm font-normal leading-snug">
                  I confirm the information provided above is accurate and complete.
                </Label>
              </div>
              {errors.confirmedAccurate ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.confirmedAccurate.message}
                </p>
              ) : null}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="confirmedAuthorized"
                  checked={form.watch("confirmedAuthorized") === true}
                  onCheckedChange={(checked) =>
                    form.setValue("confirmedAuthorized", (checked === true) as true, {
                      shouldValidate: true,
                    })
                  }
                />
                <Label htmlFor="confirmedAuthorized" className="text-sm font-normal leading-snug">
                  I am authorized to provide billing information on behalf of this business.
                </Label>
              </div>
              {errors.confirmedAuthorized ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.confirmedAuthorized.message}
                </p>
              ) : null}
            </fieldset>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Confirm Information and Generate Invoice
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}