import type { CustomerInformation, Order, OrderStatus } from "@/types";
import { readJson, writeJson, STORAGE_KEYS } from "./storage";
import { SEED_ORDERS } from "./seedData";
import { generateId, generateToken, orderTotals, suggestOrderNumber } from "@/lib/format";

function ensureSeeded(): Order[] {
  const seeded = readJson<boolean>(STORAGE_KEYS.seeded, false);
  const existing = readJson<Order[] | null>(STORAGE_KEYS.orders, null);
  if (!seeded || existing === null) {
    writeJson(STORAGE_KEYS.orders, SEED_ORDERS);
    writeJson(STORAGE_KEYS.seeded, true);
    return SEED_ORDERS;
  }
  return existing;
}

function persist(orders: Order[]): void {
  writeJson(STORAGE_KEYS.orders, orders);
}

export interface CreateOrderInput {
  orderNumber: string;
  customerEmail: string;
  currency: string;
  dueInDays: number;
  internalNotes?: string;
  items: Order["items"];
  discountType: Order["discountType"];
  discountValue: number;
  taxRate: number;
  shipping: number;
}

export const orderService = {
  list(): Order[] {
    return [...ensureSeeded()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  getById(id: string): Order | undefined {
    return ensureSeeded().find((o) => o.id === id);
  },

  getByToken(token: string): Order | undefined {
    return ensureSeeded().find((o) => o.token === token);
  },

  suggestOrderNumber(): string {
    return suggestOrderNumber(ensureSeeded().length);
  },

  create(input: CreateOrderInput): Order {
    const now = new Date().toISOString();
    const order: Order = {
      id: generateId("ord"),
      ...input,
      status: "link_sent",
      token: generateToken(40),
      createdAt: now,
      updatedAt: now,
      timeline: [
        { status: "draft", at: now },
        { status: "link_sent", at: now, note: "Customer information link generated." },
      ],
    };
    persist([order, ...ensureSeeded()]);
    return order;
  },

  updateStatus(id: string, status: OrderStatus, note?: string): Order | undefined {
    const orders = ensureSeeded();
    let updated: Order | undefined;
    const next = orders.map((o) => {
      if (o.id !== id) return o;
      const at = new Date().toISOString();
      updated = {
        ...o,
        status,
        updatedAt: at,
        timeline: [...o.timeline, { status, at, note }],
      };
      return updated;
    });
    persist(next);
    return updated;
  },

  markFormOpened(token: string): Order | undefined {
    const order = orderService.getByToken(token);
    if (!order) return undefined;
    if (order.status !== "link_sent") return order;
    return orderService.updateStatus(order.id, "form_opened", "Customer opened the form.");
  },

  submitCustomerInformation(
    token: string,
    info: CustomerInformation,
  ): { ok: boolean; order?: Order; error?: string } {
    const orders = ensureSeeded();
    const order = orders.find((o) => o.token === token);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.customerInformation) {
      return { ok: false, error: "This order has already been submitted.", order };
    }
    const at = new Date().toISOString();
    const updated: Order = {
      ...order,
      customerInformation: info,
      status: "submitted",
      updatedAt: at,
      timeline: [
        ...order.timeline,
        { status: "submitted", at, note: "Customer submitted billing information." },
      ],
    };
    persist(orders.map((o) => (o.id === order.id ? updated : o)));
    return { ok: true, order: updated };
  },

  totals(order: Order) {
    return orderTotals(order);
  },
};