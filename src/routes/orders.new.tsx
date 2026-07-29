import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import {
  OrderItemsEditor,
  createEmptyItem,
} from "@/components/order-items-editor";
import { OrderSummary } from "@/components/order-summary";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createOrderSchema,
  orderItemSchema,
  type CreateOrderValues,
} from "@/lib/schemas";
import { calculateTotals, customerUrl } from "@/lib/format";
import { parseOrderEmail } from "@/lib/order-email-parser";
import { orderService } from "@/services/orderService";
import { settingsService } from "@/services/settingsService";
import { APP_CONFIG, CURRENCIES } from "@/config/app";
import type { Order, OrderItem } from "@/types";
import { toast } from "sonner";
import { RequireAuth } from "@/lib/auth";

export const Route = createFileRoute("/orders/new")({
  head: () => ({
    meta: [
      { title: "Create order | Billantra" },
      {
        name: "description",
        content:
          "Create a locked order and send a secure customer information link.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CreateOrderPage />
    </RequireAuth>
  ),
});

function CreateOrderPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<OrderItem[]>([
    createEmptyItem(),
  ]);
  const [itemsError, setItemsError] = useState<string>();
  const [createdOrder, setCreatedOrder] =
    useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderEmailText, setOrderEmailText] = useState("");

  const form = useForm<CreateOrderValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      orderNumber: "",
      customerEmail: "",
      currency: APP_CONFIG.defaultCurrency,
      dueInDays: 30,
      internalNotes: "",
      discountType: "fixed",
      discountValue: 0,
      taxRate: APP_CONFIG.defaultTaxRate,
      shipping: 0,
    },
  });

  useEffect(() => {
    let active = true;

    Promise.all([
      settingsService.get(),
      orderService.suggestOrderNumber(),
    ])
      .then(([settings, orderNumber]) => {
        if (!active) return;

        form.reset({
          ...form.getValues(),
          orderNumber,
          currency: settings.defaultCurrency,
          taxRate: settings.defaultTaxRate,
          dueInDays: settings.defaultPaymentTerms || 30,
        });
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load order defaults",
        );
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watched = form.watch();

  const totals = useMemo(
    () =>
      calculateTotals({
        items,
        discountType: watched.discountType,
        discountValue: Number(watched.discountValue) || 0,
        taxRate: Number(watched.taxRate) || 0,
        shipping: Number(watched.shipping) || 0,
      }),
    [
      items,
      watched.discountType,
      watched.discountValue,
      watched.taxRate,
      watched.shipping,
    ],
  );

  function importOrderEmail() {
    const parsed = parseOrderEmail(orderEmailText);
    let imported = 0;

    if (parsed.orderNumber) {
      form.setValue("orderNumber", parsed.orderNumber, {
        shouldDirty: true,
        shouldValidate: true,
      });
      imported += 1;
    }

    if (parsed.customerEmail) {
      form.setValue("customerEmail", parsed.customerEmail, {
        shouldDirty: true,
        shouldValidate: true,
      });
      imported += 1;
    }

    if (
      parsed.currency &&
      CURRENCIES.includes(parsed.currency)
    ) {
      form.setValue("currency", parsed.currency, {
        shouldDirty: true,
        shouldValidate: true,
      });
      imported += 1;
    }

    if (
      parsed.dueInDays !== undefined &&
      parsed.dueInDays >= 1 &&
      parsed.dueInDays <= 365
    ) {
      form.setValue("dueInDays", parsed.dueInDays, {
        shouldDirty: true,
        shouldValidate: true,
      });
      imported += 1;
    }

    if (parsed.internalNotes) {
      form.setValue("internalNotes", parsed.internalNotes, {
        shouldDirty: true,
        shouldValidate: true,
      });
      imported += 1;
    }

    if (
      parsed.discountType &&
      parsed.discountValue !== undefined
    ) {
      form.setValue("discountType", parsed.discountType, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("discountValue", parsed.discountValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
      imported += 1;
    }

    if (
      parsed.taxRate !== undefined &&
      parsed.taxRate >= 0 &&
      parsed.taxRate <= 100
    ) {
      form.setValue("taxRate", parsed.taxRate, {
        shouldDirty: true,
        shouldValidate: true,
      });
      imported += 1;
    }

    if (
      parsed.shipping !== undefined &&
      parsed.shipping >= 0
    ) {
      form.setValue("shipping", parsed.shipping, {
        shouldDirty: true,
        shouldValidate: true,
      });
      imported += 1;
    }

    if (parsed.items.length > 0) {
      setItems(
        parsed.items.map((item) => ({
          ...createEmptyItem(),
          description: item.description,
          sku: item.sku ?? "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxable: item.taxable,
        })),
      );
      setItemsError(undefined);
      imported += parsed.items.length;
    }

    if (imported === 0) {
      toast.error(
        "No order details were detected. Check the email format and try again.",
      );
      return;
    }

    toast.success(
      "Order details imported. Review every field before creating the order.",
    );
  }

  function validateItems(values: CreateOrderValues) {
    if (items.length === 0) {
      setItemsError("Add at least one line item.");
      return false;
    }

    for (const item of items) {
      const parsed = orderItemSchema.safeParse(item);
      if (!parsed.success) {
        setItemsError(
          parsed.error.issues[0]?.message ??
            "Check the line items.",
        );
        return false;
      }
    }

    const subtotal = calculateTotals({
      items,
      discountType: values.discountType,
      discountValue: 0,
      taxRate: 0,
      shipping: 0,
    }).subtotal;

    const rawDiscount =
      values.discountType === "percentage"
        ? (subtotal * values.discountValue) / 100
        : values.discountValue;

    if (rawDiscount > subtotal) {
      setItemsError("Discount cannot exceed the subtotal.");
      return false;
    }

    setItemsError(undefined);
    return true;
  }

  async function onSubmit(values: CreateOrderValues) {
    if (!validateItems(values)) return;

    setSubmitting(true);

    try {
      const order = await orderService.create({
        orderNumber: values.orderNumber,
        customerEmail: values.customerEmail,
        currency: values.currency,
        dueInDays: values.dueInDays,
        internalNotes: values.internalNotes,
        items,
        discountType: values.discountType,
        discountValue: values.discountValue,
        taxRate: values.taxRate,
        shipping: values.shipping,
      });

      setCreatedOrder(order);

      try {
        const delivery =
          await orderService.sendCustomerLink(order.id);
        setCreatedOrder(delivery.order ?? order);

        if (delivery.emailStatus === "sent") {
          toast.success(
            `Customer link emailed to ${order.customerEmail}`,
          );
        } else {
          toast.error(
            delivery.error ||
              "The order was created, but the customer-link email failed.",
          );
        }
      } catch (emailError) {
        const refreshed = await orderService
          .getById(order.id)
          .catch(() => undefined);

        setCreatedOrder(refreshed ?? order);
        toast.error(
          emailError instanceof Error
            ? `Order created, but the customer-link email failed: ${emailError.message}`
            : "Order created, but the customer-link email failed.",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create the order",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const errors = form.formState.errors;
  const link = createdOrder
    ? customerUrl(createdOrder.token)
    : "";

  const panel =
    "rounded-md border border-[#071226]/10 bg-[#FAF7F4]";

  return (
    <AppShell>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <PageHeader
          title="Create order"
          description="Enter the order manually or import details from an email."
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-4">
            <section className={panel}>
              <div className="border-b border-[#071226]/10 px-4 py-3">
                <h2 className="text-[13px] font-semibold text-[#071226]">
                  Order details
                </h2>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="orderNumber">Order number</Label>
                  <Input
                    id="orderNumber"
                    {...form.register("orderNumber")}
                  />
                  {errors.orderNumber ? (
                    <p className="text-xs text-[#071226]">
                      {errors.orderNumber.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="customerEmail">
                    Customer email
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...form.register("customerEmail")}
                  />
                  {errors.customerEmail ? (
                    <p className="text-xs text-[#071226]">
                      {errors.customerEmail.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={watched.currency}
                    onValueChange={(value) =>
                      form.setValue("currency", value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem
                          key={currency}
                          value={currency}
                        >
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dueInDays">
                    Invoice due in
                  </Label>
                  <Input
                    id="dueInDays"
                    type="number"
                    min={1}
                    {...form.register("dueInDays", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="internalNotes">
                    Internal notes
                  </Label>
                  <Textarea
                    id="internalNotes"
                    rows={3}
                    {...form.register("internalNotes")}
                  />
                </div>
              </div>
            </section>

            <OrderItemsEditor
              items={items}
              currency={watched.currency}
              onChange={setItems}
              error={itemsError}
            />

            <section className={panel}>
              <div className="border-b border-[#071226]/10 px-4 py-3">
                <h2 className="text-[13px] font-semibold text-[#071226]">
                  Pricing adjustments
                </h2>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="discountType">
                    Discount type
                  </Label>
                  <Select
                    value={watched.discountType}
                    onValueChange={(value) =>
                      form.setValue(
                        "discountType",
                        value as CreateOrderValues["discountType"],
                        { shouldValidate: true },
                      )
                    }
                  >
                    <SelectTrigger id="discountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">
                        Fixed amount
                      </SelectItem>
                      <SelectItem value="percentage">
                        Percentage
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="discountValue">
                    Discount value
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register("discountValue", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="taxRate">Tax rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    {...form.register("taxRate", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="shipping">
                    Shipping charge
                  </Label>
                  <Input
                    id="shipping"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register("shipping", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-3 xl:sticky xl:top-[72px] xl:self-start">
            <section className={panel}>
              <div className="flex items-center justify-between border-b border-[#071226]/10 px-3 py-2.5">
                <div>
                  <h2 className="text-[12px] font-semibold text-[#071226]">
                    Import email
                  </h2>
                  <p className="text-[10px] text-[#071226]/45">
                    Paste and auto-fill
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!orderEmailText.trim()}
                  onClick={importOrderEmail}
                >
                  Auto-fill
                </Button>
              </div>
              <div className="p-3">
                <Textarea
                  id="orderEmailText"
                  rows={9}
                  value={orderEmailText}
                  onChange={(event) =>
                    setOrderEmailText(event.target.value)
                  }
                  placeholder={`Order Number: PO-1048
Customer Email: customer@example.com
Currency: CAD
Net 30

2 x Pharmacy Refrigerator @ 2499.00
HST: 13%
Shipping: 125.00`}
                />
              </div>
            </section>

            <OrderSummary
              totals={totals}
              currency={watched.currency}
              taxRate={Number(watched.taxRate) || 0}
            />

            <div className="grid gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Creating and emailing…"
                  : "Create order and email link"}
              </Button>
              <Button
                asChild
                type="button"
                variant="outline"
              >
                <Link to="/orders">Cancel</Link>
              </Button>
            </div>
          </aside>
        </div>
      </form>

      <Dialog
        open={!!createdOrder}
        onOpenChange={(open) => {
          if (!open && createdOrder) {
            const id = createdOrder.id;
            setCreatedOrder(null);
            navigate({
              to: "/orders/$id",
              params: { id },
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createdOrder?.customerLinkEmailStatus === "sent"
                ? "Customer link emailed"
                : "Order created — email needs attention"}
            </DialogTitle>
            <DialogDescription>
              {createdOrder?.customerLinkEmailStatus === "sent"
                ? `The secure billing-information link was automatically emailed to ${createdOrder.customerEmail}.`
                : "The order was saved, but the automatic email was not confirmed. Use the fallback link or retry from the order page."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-[#071226]/12 bg-[#071226]/4 px-3 py-2">
            <p className="break-all text-xs text-[#071226]">
              {link}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <CopyLinkButton
              value={link}
              label="Copy link"
              size="default"
            />
            {createdOrder ? (
              <Button asChild>
                <Link
                  to="/customer/$token"
                  params={{ token: createdOrder.token }}
                  target="_blank"
                >
                  Open customer form
                </Link>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
