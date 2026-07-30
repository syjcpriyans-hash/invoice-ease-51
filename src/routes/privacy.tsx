import { createFileRoute } from "@tanstack/react-router";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/legal-page-layout";
import { LEGAL_CONFIG } from "@/config/legal";

const sections = [
  { id: "scope", label: "Scope and roles" },
  { id: "information", label: "Information we collect" },
  { id: "uses", label: "How we use information" },
  { id: "sharing", label: "How we share information" },
  { id: "transfers", label: "International processing" },
  { id: "retention", label: "Retention" },
  { id: "security", label: "Security" },
  { id: "rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Billantra" },
      {
        name: "description",
        content:
          "Learn how Billantra collects, uses, safeguards, and shares personal information.",
      },
      { property: "og:title", content: "Privacy Policy | Billantra" },
      {
        property: "og:description",
        content:
          "How Billantra handles account, order, customer, invoice, and technical information.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This policy explains how Billantra handles personal information when businesses use the service, customers submit billing information, or visitors interact with the website."
      effectiveDate={LEGAL_CONFIG.effectiveDate}
      sections={sections}
    >
      <LegalSection id="scope" title="1. Scope and roles">
        <p>
          This Privacy Policy applies to the Billantra website, application,
          customer billing forms, waitlist, communications, and related
          services.
        </p>
        <p>
          Billantra provides invoice-workflow software to businesses. When a
          business uses Billantra to collect information from its customer,
          that business generally determines why the information is collected
          and how it will be used. Billantra processes that information to
          provide the service. The business may have its own privacy policy
          that also applies.
        </p>
      </LegalSection>

      <LegalSection id="information" title="2. Information we collect">
        <p>Depending on how you interact with Billantra, we may collect:</p>
        <ul>
          <li>
            <strong>Account information:</strong> email address,
            authentication information, workspace settings, and business
            profile details.
          </li>
          <li>
            <strong>Order and invoice information:</strong> order numbers,
            products or services, quantities, prices, discounts, taxes,
            shipping charges, payment terms, notes, invoice records, and PDF
            files.
          </li>
          <li>
            <strong>Customer billing information:</strong> contact name,
            email address, phone number, legal and operating business names,
            purchase-order number, and billing and shipping addresses.
          </li>
          <li>
            <strong>Waitlist and communication information:</strong> email
            address and information included in messages or support requests.
          </li>
          <li>
            <strong>Technical and security information:</strong> IP address,
            browser and device information, request timestamps, session
            information, error logs, security-verification results, and
            rate-limit records.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="uses" title="3. How we use information">
        <p>We use information to:</p>
        <ul>
          <li>operate, maintain, secure, and improve Billantra;</li>
          <li>authenticate users and manage workspaces;</li>
          <li>create orders, collect customer details, generate invoice PDFs, and send transactional emails;</li>
          <li>record delivery, bounce, failure, and retry information;</li>
          <li>prevent fraud, abuse, unauthorized access, and automated attacks;</li>
          <li>provide support and communicate about the service;</li>
          <li>maintain business, accounting, security, and legal records; and</li>
          <li>comply with applicable law and enforce our agreements.</li>
        </ul>
        <p>
          Depending on the jurisdiction and context, processing may be based
          on consent, performance of a contract, legitimate business
          interests, or legal obligations.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="4. How we share information">
        <p>We may share information with:</p>
        <ul>
          <li>
            <strong>The business using Billantra:</strong> customer
            information, order details, invoices, and delivery status are
            available to the business that initiated the workflow.
          </li>
          <li>
            <strong>Service providers:</strong> providers that support
            hosting, databases, authentication, email delivery, security,
            storage, and infrastructure. Current providers may include
            Supabase, Vercel, Resend, and Cloudflare Turnstile.
          </li>
          <li>
            <strong>Professional advisers:</strong> legal, accounting,
            security, insurance, or other advisers when reasonably necessary.
          </li>
          <li>
            <strong>Authorities or other parties:</strong> when required by
            law, needed to protect rights or safety, or necessary to
            investigate fraud or misuse.
          </li>
          <li>
            <strong>Business transaction participants:</strong> in connection
            with a financing, merger, acquisition, reorganization, or sale of
            assets, subject to appropriate safeguards.
          </li>
        </ul>
        <p>
          Billantra does not sell personal information or use customer
          billing information for third-party behavioural advertising.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="5. International processing">
        <p>
          Billantra and its service providers may process or store information
          in countries other than the country where it was collected.
          Privacy and government-access laws may differ between jurisdictions.
          We use contractual, technical, and organizational measures intended
          to protect information when it is transferred.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="6. Data retention">
        <p>
          We retain information for as long as reasonably necessary to provide
          the service, maintain invoice and transaction records, comply with
          legal obligations, resolve disputes, prevent abuse, and enforce
          agreements.
        </p>
        <p>
          Retention periods vary based on the type of information, the
          business customer's instructions, legal requirements, security
          needs, and whether an account or order remains active. Information
          may remain in backups for a limited period after deletion from
          active systems.
        </p>
      </LegalSection>

      <LegalSection id="security" title="7. Security">
        <p>
          We use administrative, technical, and organizational safeguards
          designed to protect information. These may include access controls,
          authenticated workspaces, private customer links, server-side
          validation, rate limiting, bot protection, encrypted network
          connections, logging, and restricted service credentials.
        </p>
        <p>
          No system is completely secure. Users are responsible for
          protecting account credentials and promptly reporting suspected
          unauthorized access.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="8. Your privacy rights and choices">
        <p>
          Depending on where you live, you may have the right to request
          access to, correction of, deletion of, or a copy of personal
          information, or to object to or restrict certain processing.
        </p>
        <p>
          When Billantra processes information on behalf of a business
          customer, we may direct the request to that business or assist it
          with responding. We may need to verify identity before completing a
          request, and some information may be retained where required or
          permitted by law.
        </p>
        <p>
          You may unsubscribe from non-transactional communications using the
          method provided in the message. Operational and invoice-related
          communications may still be sent when necessary to provide the
          service.
        </p>
      </LegalSection>

      <LegalSection id="children" title="9. Children">
        <p>
          Billantra is intended for businesses and authorized business
          representatives. It is not directed to children, and we do not
          knowingly collect personal information from children through the
          service.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy as Billantra develops or legal
          requirements change. The effective date at the top of the page will
          be updated when material revisions are published. Additional notice
          may be provided when required by law.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Privacy contact">
        <p>
          The person accountable for Billantra's privacy practices is:
        </p>
        <div className="rounded-md border border-[#071226]/10 bg-[#071226]/[0.025] p-4 text-[#071226]">
          <p className="font-semibold">{LEGAL_CONFIG.privacyOfficerTitle}</p>
          <p>{LEGAL_CONFIG.operatorLegalName}</p>
          <p>{LEGAL_CONFIG.businessAddress}</p>
          <p>{LEGAL_CONFIG.contactEmail}</p>
        </div>
        <p>
          Privacy questions, complaints, access requests, and correction
          requests should be directed to this contact.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
