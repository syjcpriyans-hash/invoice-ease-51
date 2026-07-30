import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { SiteLogo } from "@/components/site-logo";
import { TurnstileWidget } from "@/components/turnstile-widget";
import {
  customerInformationSchema,
  type CustomerFormValues,
} from "@/lib/schemas";
import { orderService } from "@/services/orderService";
import { orderTotals } from "@/lib/format";
import type { Address, Order } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/$token/")({
  head: () => ({
    meta: [
      {
        title: "Confirm your billing information | Billantra",
      },
      {
        name: "description",
        content:
          "Review your order and submit the billing information required to issue your invoice.",
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

export function CustomerHeader({
  sellerName,
}: {
  sellerName: string;
}) {
  return (
    <header className="dark-surface border-b border-white/10 bg-[#071226]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-[#FAF7F4]">
            {sellerName}
          </p>
          <p className="mt-0.5 text-xs text-[#FAF7F4]/52">
            Secure billing information request
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 text-xs text-[#FAF7F4]/52 sm:flex">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Protected form
          </span>
          <SiteLogo inverse />
        </div>
      </div>
    </header>
  );
}

function CustomerFormPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null | undefined>(
    undefined,
  );
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const sellerName = order?.sellerName ?? "Seller";

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
      shippingAddress: undefined,
      confirmedAccurate: undefined as unknown as true,
      confirmedAuthorized: undefined as unknown as true,
    },
  });

  useEffect(() => {
    let active = true;

    orderService
      .getByToken(token)
      .then(async (found) => {
        if (!active) return;

        if (!found) {
          setOrder(null);
          return;
        }

        setOrder(found);
        form.setValue("email", found.customerEmail);
        await orderService.markFormOpened(token);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load this order",
        );
        if (active) setOrder(null);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-[#FAF7F4] p-6">
        <LoadingState label="Loading your order…" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-[#FAF7F4] p-6">
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

  function onInvalid() {
    toast.error(
      "Please complete all required fields. The first incomplete field is highlighted.",
    );

    window.setTimeout(() => {
      const firstInvalid = document.querySelector<HTMLElement>(
        '[aria-invalid="true"], [role="alert"]',
      );
      firstInvalid?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if ("focus" in (firstInvalid ?? {})) firstInvalid?.focus();
    }, 0);
  }

  async function onSubmit(values: CustomerFormValues) {
    const billing = values.billingAddress as Address;
    const shipping = values.shippingSameAsBilling
      ? billing
      : ({
          ...emptyAddress,
          ...values.shippingAddress,
        } as Address);

    if (!turnstileToken) {
      toast.error("Complete the security verification.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await orderService.submitCustomerInformation(
        token,
        {
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
        },
        turnstileToken,
      );

      window.sessionStorage.setItem(
        `invoice-ease-submission-${token}`,
        JSON.stringify(result),
      );
      navigate({
        to: "/customer/$token/success",
        params: { token },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Submission failed",
      );
    } finally {
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
      setSubmitting(false);
    }
  }

  const panelClass =
    "rounded-xl border border-[#071226]/10 bg-[#FAF7F4] p-5 shadow-[0_1px_2px_rgba(7,18,38,0.04)]";

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <CustomerHeader sellerName={sellerName || "Seller"} />

      <main className="mx-auto w-full max-w-5xl space-y-7 px-4 py-9 sm:px-6">
        <section className="rounded-xl bg-[#D5A125] px-6 py-7 text-[#071226]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#071226]/58">
            Secure customer form
          </p>
          <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.035em]">
            Confirm your billing information
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#071226]/68">
            Order {order.orderNumber} from {sellerName}. The commercial
            details below are final and cannot be changed from this form.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#071226]">
            <Lock className="h-4 w-4" aria-hidden="true" />
            Order summary
          </h2>
          <LockedOrderItems
            items={order.items}
            currency={order.currency}
          />
          <OrderSummary
            totals={totals}
            currency={order.currency}
            taxRate={order.taxRate}
          />
        </section>

        {alreadySubmitted ? (
          <ErrorState
            title="Information already submitted"
            description="We have received the billing details for this order. The invoice is being prepared."
          />
        ) : (
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            noValidate
          >
            <fieldset className={panelClass}>
              <legend className="px-1 text-sm font-semibold text-[#071226]">
                Contact details
              </legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">
                    Contact person&apos;s full name
                  </Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                  />
                  {errors.fullName ? (
                    <p
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errors.fullName.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                  />
                  {errors.email ? (
                    <p
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("phone")}
                  />
                  {errors.phone ? (
                    <p
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errors.phone.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </fieldset>

            <fieldset className={panelClass}>
              <legend className="px-1 text-sm font-semibold text-[#071226]">
                Business details
              </legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="legalBusinessName">
                    Legal business name
                  </Label>
                  <Input
                    id="legalBusinessName"
                    {...form.register("legalBusinessName")}
                  />
                  {errors.legalBusinessName ? (
                    <p
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {errors.legalBusinessName.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="operatingName">
                    Operating or pharmacy name
                  </Label>
                  <Input
                    id="operatingName"
                    {...form.register("operatingName")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="poNumber">
                    Purchase-order number
                  </Label>
                  <Input
                    id="poNumber"
                    {...form.register("poNumber")}
                  />
                </div>
              </div>
            </fieldset>

            <div className={panelClass}>
              <AddressForm
                name="billingAddress"
                legend="Billing address"
                register={form.register}
                errors={errors}
              />
            </div>

            <div className={`${panelClass} space-y-4`}>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="shippingSameAsBilling"
                  checked={sameAsBilling}
                  onCheckedChange={(checked) => {
                    const isSame = checked === true;
                    form.setValue(
                      "shippingSameAsBilling",
                      isSame,
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    );

                    if (isSame) {
                      form.setValue(
                        "shippingAddress",
                        undefined,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                      form.clearErrors("shippingAddress");
                    }
                  }}
                />
                <Label htmlFor="shippingSameAsBilling">
                  Shipping address same as billing address
                </Label>
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

            <fieldset className={`${panelClass} space-y-3`}>
              <legend className="px-1 text-sm font-semibold text-[#071226]">
                Confirmation
              </legend>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="confirmedAccurate"
                  checked={form.watch("confirmedAccurate") === true}
                  onCheckedChange={(checked) =>
                    form.setValue(
                      "confirmedAccurate",
                      (checked === true) as true,
                      {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      },
                    )
                  }
                />
                <Label
                  htmlFor="confirmedAccurate"
                  className="text-sm font-normal leading-snug"
                >
                  I confirm the information provided above is accurate
                  and complete.
                </Label>
              </div>

              {errors.confirmedAccurate ? (
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.confirmedAccurate.message}
                </p>
              ) : null}

              <div className="flex items-start gap-2">
                <Checkbox
                  id="confirmedAuthorized"
                  checked={form.watch("confirmedAuthorized") === true}
                  onCheckedChange={(checked) =>
                    form.setValue(
                      "confirmedAuthorized",
                      (checked === true) as true,
                      {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      },
                    )
                  }
                />
                <Label
                  htmlFor="confirmedAuthorized"
                  className="text-sm font-normal leading-snug"
                >
                  I am authorized to provide billing information on
                  behalf of this business.
                </Label>
              </div>

              {errors.confirmedAuthorized ? (
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.confirmedAuthorized.message}
                </p>
              ) : null}
            </fieldset>

            <div className={panelClass}>
              <TurnstileWidget
                action="customer_submit"
                onToken={setTurnstileToken}
                resetKey={turnstileResetKey}
              />
            </div>

            <div className="flex flex-col items-end gap-3">
              <p className="max-w-2xl text-right text-[10px] leading-5 text-[#071226]/48">
                By submitting this form, you confirm that you are authorized to
                provide this information and acknowledge Billantra&apos;s{" "}
                <Link to="/privacy" target="_blank" className="font-medium underline underline-offset-2">
                  Privacy Policy
                </Link>
                . The seller may also have its own privacy practices.
              </p>
              <Button
                type="submit"
                size="lg"
                disabled={submitting || !turnstileToken}
                className="min-w-[280px]"
              >
                {submitting
                  ? "Submitting…"
                  : "Confirm information and generate invoice"}
              </Button>
            </div>
          </form>
        )}
      </main>

      <footer className="border-t border-[#071226]/10">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-5 px-4 py-5 text-[10px] text-[#071226]/48 sm:px-6">
          <span>Powered by Billantra</span>
          <Link to="/privacy" target="_blank" className="ml-auto hover:text-[#071226]">
            Privacy
          </Link>
          <Link to="/terms" target="_blank" className="hover:text-[#071226]">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
