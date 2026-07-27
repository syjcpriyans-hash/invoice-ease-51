import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { OrderItemsEditor, createEmptyItem } from "@/components/order-items-editor";
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
import { createOrderSchema, orderItemSchema, type CreateOrderValues } from "@/lib/schemas";
import { calculateTotals, customerUrl } from "@/lib/format";
import { orderService } from "@/services/orderService";
import { settingsService } from "@/services/settingsService";
import { APP_CONFIG, CURRENCIES } from "@/config/app";
import type { Order, OrderItem } from "@/types";
import { toast } from "sonner";
import { RequireAuth } from "@/lib/auth";

export const Route = createFileRoute("/orders/new")({
  head: () => ({
    meta: [
      { title: "Create Order — InvoiceFlow" },
      {
        name: "description",
        content: "Build a locked order with line items, discounts and tax, then generate a customer link.",
      },
      { property: "og:title", content: "Create Order — InvoiceFlow" },
      {
        property: "og:description",
        content: "Build a locked order and generate a secure customer information link.",
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
  const [items, setItems] = useState<OrderItem[]>([createEmptyItem()]);
  const [itemsError, setItemsError] = useState<string | undefined>();
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    Promise.all([settingsService.get(), orderService.suggestOrderNumber()])
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
        toast.error(error instanceof Error ? error.message : "Could not load order defaults");
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
    [items, watched.discountType, watched.discountValue, watched.taxRate, watched.shipping],
  );

  function validateItems(values: CreateOrderValues): boolean {
    if (items.length === 0) {
      setItemsError("Add at least one line item.");
      return false;
    }
    for (const item of items) {
      const parsed = orderItemSchema.safeParse(item);
      if (!parsed.success) {
        setItemsError(parsed.error.issues[0]?.message ?? "Check the line items.");
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
      toast.success("Customer link created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the order");
    } finally {
      setSubmitting(false);
    }
  }

  const errors = form.formState.errors;
  const link = createdOrder ? customerUrl(createdOrder.token) : "";

  return (
    <AppShell>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <PageHeader
          title="Create order"
          description="Line items, pricing and tax are locked once the customer link is generated."
          actions={
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating…" : "Create Customer Link"}
            </Button>
          }
        />

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-xs sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="orderNumber">Order number</Label>
            <Input id="orderNumber" {...form.register("orderNumber")} />
            {errors.orderNumber ? (
              <p role="alert" className="text-sm text-destructive">{errors.orderNumber.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customerEmail">Customer email</Label>
            <Input id="customerEmail" type="email" {...form.register("customerEmail")} />
            {errors.customerEmail ? (
              <p role="alert" className="text-sm text-destructive">{errors.customerEmail.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={watched.currency}
              onValueChange={(v) => form.setValue("currency", v, { shouldValidate: true })}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueInDays">Invoice due in (days)</Label>
            <Input
              id="dueInDays"
              type="number"
              min={1}
              {...form.register("dueInDays", { valueAsNumber: true })}
            />
            {errors.dueInDays ? (
              <p role="alert" className="text-sm text-destructive">{errors.dueInDays.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea id="internalNotes" rows={3} {...form.register("internalNotes")} />
          </div>
        </section>

        <OrderItemsEditor
          items={items}
          currency={watched.currency}
          onChange={setItems}
          error={itemsError}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-xs sm:grid-cols-2">
            <h2 className="text-sm font-semibold text-foreground sm:col-span-2">
              Discounts, tax and shipping
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="discountType">Discount type</Label>
              <Select
                value={watched.discountType}
                onValueChange={(v) =>
                  form.setValue("discountType", v as CreateOrderValues["discountType"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountValue">Discount value</Label>
              <Input
                id="discountValue"
                type="number"
                min={0}
                step="0.01"
                {...form.register("discountValue", { valueAsNumber: true })}
              />
              {errors.discountValue ? (
                <p role="alert" className="text-sm text-destructive">{errors.discountValue.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Tax rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min={0}
                max={100}
                step="0.01"
                {...form.register("taxRate", { valueAsNumber: true })}
              />
              {errors.taxRate ? (
                <p role="alert" className="text-sm text-destructive">{errors.taxRate.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shipping">Shipping charge</Label>
              <Input
                id="shipping"
                type="number"
                min={0}
                step="0.01"
                {...form.register("shipping", { valueAsNumber: true })}
              />
              {errors.shipping ? (
                <p role="alert" className="text-sm text-destructive">{errors.shipping.message}</p>
              ) : null}
            </div>
          </section>

          <OrderSummary
            totals={totals}
            currency={watched.currency}
            taxRate={Number(watched.taxRate) || 0}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="outline">
            <Link to="/orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create Customer Link"}
          </Button>
        </div>
      </form>

      <Dialog
        open={!!createdOrder}
        onOpenChange={(open) => {
          if (!open && createdOrder) {
            const id = createdOrder.id;
            setCreatedOrder(null);
            navigate({ to: "/orders/$id", params: { id } });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer link created</DialogTitle>
            <DialogDescription>
              Send this link to {createdOrder?.customerEmail}. The order is locked and the customer can
              only add billing information.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
            <p className="break-all text-sm text-foreground">{link}</p>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <CopyLinkButton value={link} label="Copy Link" size="default" />
            {createdOrder ? (
              <Button asChild size="default">
                <Link to="/customer/$token" params={{ token: createdOrder.token }} target="_blank">
                  Open Customer Form
                </Link>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}