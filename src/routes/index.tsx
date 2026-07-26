import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "InvoiceFlow — Automated order to invoice workflow" },
      {
        name: "description",
        content:
          "InvoiceFlow locks orders, collects customer billing information and prepares invoices automatically.",
      },
      { property: "og:title", content: "InvoiceFlow — Automated order to invoice workflow" },
      {
        property: "og:description",
        content: "Lock an order, send a customer link, collect billing details, invoice automatically.",
      },
    ],
  }),
});
