import { createFileRoute } from "@tanstack/react-router";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/legal-page-layout";
import { LEGAL_CONFIG } from "@/config/legal";

const sections = [
  { id: "acceptance", label: "Acceptance" },
  { id: "service", label: "The service" },
  { id: "accounts", label: "Accounts" },
  { id: "customer-data", label: "Customer data" },
  { id: "invoices", label: "Invoice responsibility" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "beta", label: "Beta and availability" },
  { id: "fees", label: "Fees" },
  { id: "ownership", label: "Ownership" },
  { id: "third-party", label: "Third-party services" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Liability" },
  { id: "termination", label: "Termination" },
  { id: "law", label: "Governing law" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Billantra" },
      {
        name: "description",
        content:
          "Terms governing access to and use of the Billantra invoice automation service.",
      },
      { property: "og:title", content: "Terms of Service | Billantra" },
      {
        property: "og:description",
        content:
          "The terms governing business use of Billantra.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These Terms govern access to and use of Billantra. They form an agreement between the organization using the service and the Billantra operator identified below."
      effectiveDate={LEGAL_CONFIG.effectiveDate}
      sections={sections}
    >
      <LegalSection id="acceptance" title="1. Acceptance of these Terms">
        <p>
          By creating an account, accessing a workspace, requesting early
          access, or using Billantra, you agree to these Terms. If you use the
          service for a company or other organization, you represent that you
          have authority to bind that organization, and “you” includes that
          organization.
        </p>
        <p>
          Do not use Billantra if you do not agree to these Terms or are not
          legally able to enter into them.
        </p>
      </LegalSection>

      <LegalSection id="service" title="2. The Billantra service">
        <p>
          Billantra provides tools for creating and managing orders,
          collecting customer billing information, generating invoice PDFs,
          sending transactional emails, and monitoring workflow and delivery
          status.
        </p>
        <p>
          Billantra is a software tool and is not an accounting firm, tax
          adviser, law firm, payment processor, collection agency, or bank.
          The service does not replace professional advice or your internal
          review and approval procedures.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts and security">
        <p>
          You must provide accurate account information, keep credentials
          confidential, and use reasonable security measures. You are
          responsible for activity performed through your account and for
          promptly notifying Billantra of suspected unauthorized access.
        </p>
        <p>
          Accounts may be limited to authorized business representatives.
          You may not share credentials in a way that bypasses account,
          workspace, role, or usage controls.
        </p>
      </LegalSection>

      <LegalSection id="customer-data" title="4. Customer data and authority">
        <p>
          You retain ownership of information submitted to Billantra,
          including customer data, order information, invoice content, and
          business records.
        </p>
        <p>
          You represent that you have the authority and lawful basis needed
          to collect, use, upload, and instruct Billantra to process this
          information. You are responsible for providing any notices and
          obtaining any consents required for your customers, staff, and
          other individuals.
        </p>
        <p>
          You grant Billantra a limited right to host, process, reproduce,
          transmit, and format submitted information solely as needed to
          provide, secure, support, and improve the service and comply with
          law.
        </p>
      </LegalSection>

      <LegalSection id="invoices" title="5. Invoice, tax, and record responsibility">
        <p>
          You are responsible for reviewing order details, customer
          information, prices, tax rates, discounts, shipping charges,
          payment terms, invoice numbering, legal disclosures, and payment
          instructions before relying on an invoice.
        </p>
        <p>
          Billantra may automate calculations and document generation, but
          you remain responsible for determining whether invoices and records
          comply with applicable tax, accounting, consumer, commercial, and
          industry requirements.
        </p>
        <p>
          Email status and automated delivery signals may be incomplete or
          delayed. A “sent” or “delivered” status does not guarantee that the
          intended recipient reviewed, accepted, or paid an invoice.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="6. Acceptable use">
        <p>You must not use Billantra to:</p>
        <ul>
          <li>violate law, regulation, court order, or third-party rights;</li>
          <li>send spam, deceptive messages, malware, or unauthorized communications;</li>
          <li>process information you are not authorized to collect or use;</li>
          <li>attempt to access another user's account, workspace, customer link, or data;</li>
          <li>bypass rate limits, security controls, authentication, or usage restrictions;</li>
          <li>interfere with the service, probe vulnerabilities, or introduce harmful code;</li>
          <li>reverse engineer the service except where law expressly permits it; or</li>
          <li>use Billantra for unlawful, fraudulent, abusive, or misleading invoicing.</li>
        </ul>
      </LegalSection>

      <LegalSection id="beta" title="7. Beta features and service availability">
        <p>
          Billantra may be offered as an early-access, pilot, preview, or beta
          service. Features may be incomplete, changed, suspended, or removed.
          Data formats and workflows may change as the product develops.
        </p>
        <p>
          We aim to operate the service reliably but do not guarantee
          uninterrupted availability, delivery times, error-free operation,
          or compatibility with every browser, email provider, device, tax
          system, or business process.
        </p>
      </LegalSection>

      <LegalSection id="fees" title="8. Fees and plan changes">
        <p>
          Some versions of Billantra may be offered without charge during
          testing or early access. Billantra may introduce paid plans, usage
          limits, taxes, or additional charges in the future.
        </p>
        <p>
          You will receive notice before a new recurring fee applies to your
          continued use. Unless otherwise stated, fees are non-refundable to
          the extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection id="ownership" title="9. Billantra ownership">
        <p>
          Billantra and its licensors retain all rights in the service,
          software, interfaces, branding, documentation, templates, and
          underlying technology, excluding customer data and third-party
          materials.
        </p>
        <p>
          Subject to these Terms, you receive a limited, revocable,
          non-exclusive, non-transferable right to use the service for your
          internal business operations.
        </p>
        <p>
          Feedback may be used to improve Billantra without restriction or
          payment, provided it does not identify you or disclose confidential
          customer information without permission.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="10. Third-party services">
        <p>
          Billantra relies on third-party infrastructure and services,
          including hosting, database, authentication, email, security, and
          storage providers. Those services may have their own terms and
          privacy practices.
        </p>
        <p>
          Billantra is not responsible for failures caused by third-party
          systems, internet providers, email providers, customer mailboxes,
          domain configuration, or services outside Billantra's reasonable
          control.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="11. Disclaimers">
        <p>
          To the maximum extent permitted by law, Billantra is provided “as
          is” and “as available.” We disclaim implied warranties of
          merchantability, fitness for a particular purpose, title,
          non-infringement, accuracy, and uninterrupted availability.
        </p>
        <p>
          Nothing in these Terms excludes warranties or rights that cannot be
          excluded under applicable law.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="12. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Billantra and its owners,
          personnel, affiliates, and suppliers will not be liable for
          indirect, incidental, special, consequential, exemplary, or
          punitive damages, or for lost profits, revenue, business,
          goodwill, data, or opportunities.
        </p>
        <p>
          To the maximum extent permitted by law, total aggregate liability
          arising from or related to the service will not exceed the greater
          of the amount you paid for Billantra during the 12 months before the
          event giving rise to the claim or CAD $100.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="13. Suspension and termination">
        <p>
          You may stop using Billantra at any time. We may suspend or
          terminate access when reasonably necessary to protect the service,
          users, customers, or third parties; respond to security or legal
          risks; address non-payment; or enforce these Terms.
        </p>
        <p>
          Following termination, access may end immediately. Data may be
          retained or deleted according to the Privacy Policy, legal
          obligations, backup schedules, and any applicable written
          agreement.
        </p>
      </LegalSection>

      <LegalSection id="law" title="14. Governing law">
        <p>
          These Terms are governed by the laws of{" "}
          {LEGAL_CONFIG.governingLaw}, without regard to conflict-of-law
          principles. Courts located in Ontario will have exclusive
          jurisdiction, except where applicable law requires another forum.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="15. Changes to these Terms">
        <p>
          We may update these Terms as the service develops. The effective
          date will be revised when updated Terms are published. Continued
          use after the effective date of revised Terms constitutes
          acceptance where permitted by law. Additional notice will be
          provided when required.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="16. Contact">
        <div className="rounded-md border border-[#071226]/10 bg-[#071226]/[0.025] p-4 text-[#071226]">
          <p className="font-semibold">{LEGAL_CONFIG.operatorLegalName}</p>
          <p>{LEGAL_CONFIG.businessAddress}</p>
          <p>{LEGAL_CONFIG.contactEmail}</p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
