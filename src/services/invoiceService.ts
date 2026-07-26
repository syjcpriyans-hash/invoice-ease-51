import type { Invoice, Order } from "@/types";
import { readJson, writeJson, STORAGE_KEYS } from "./storage";
import { SEED_INVOICES } from "./seedData";
import { formatInvoiceNumber, generateId, orderTotals } from "@/lib/format";
import { settingsService } from "./settingsService";
import { orderService } from "./orderService";

function ensureSeeded(): Invoice[] {
  const existing = readJson<Invoice[] | null>(STORAGE_KEYS.invoices, null);
  if (existing === null) {
    writeJson(STORAGE_KEYS.invoices, SEED_INVOICES);
    return SEED_INVOICES;
  }
  return existing;
}

function invoiceFromSubmittedOrder(order: Order, index: number): Invoice {
  const settings = settingsService.get();
  const totals = orderTotals(order);
  return {
    id: `pending_${order.id}`,
    invoiceNumber: formatInvoiceNumber(settings.invoicePrefix, settings.nextInvoiceNumber + index),
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerInformation?.legalBusinessName ?? "—",
    amount: totals.total,
    currency: order.currency,
    invoiceDate: order.customerInformation?.submittedAt ?? order.updatedAt,
    emailStatus: order.status === "failed" ? "failed" : "queued",
  };
}

export const invoiceService = {
  list(): Invoice[] {
    const stored = ensureSeeded();
    const storedOrderIds = new Set(stored.map((i) => i.orderId));
    const pending = orderService
      .list()
      .filter((o) => !!o.customerInformation && !storedOrderIds.has(o.id))
      .map(invoiceFromSubmittedOrder);
    return [...stored, ...pending].sort(
      (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime(),
    );
  },

  getById(id: string): Invoice | undefined {
    return invoiceService.list().find((i) => i.id === id);
  },

  getByOrderId(orderId: string): Invoice | undefined {
    return invoiceService.list().find((i) => i.orderId === orderId);
  },

  create(order: Order): Invoice {
    const settings = settingsService.get();
    const invoice: Invoice = {
      ...invoiceFromSubmittedOrder(order, 0),
      id: generateId("inv"),
    };
    writeJson(STORAGE_KEYS.invoices, [invoice, ...ensureSeeded()]);
    settingsService.update({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 });
    return invoice;
  },
};