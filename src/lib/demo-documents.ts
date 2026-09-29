import type { Citation, DemoDocument, DocumentPage, PageBlock } from "@/lib/document-types";

function page(
  number: number,
  kicker: string,
  aside: string,
  blocks: PageBlock[],
): DocumentPage {
  return { number, kicker, aside, blocks };
}

const terminationQuote =
  "Either party may terminate this Agreement without cause upon giving at least sixty (60) days prior written notice to the other party. In the event of a material breach by either party, the non-breaching party may terminate this Agreement upon thirty (30) days written notice, provided the breaching party has failed to cure such breach within the thirty (30) day cure period.";

const noticesQuote =
  "Notices for termination for convenience must be written and are effective sixty (60) days after receipt. Notices for termination for cause follow the thirty (30) day cure period in Section 4.3.";

const noticesCitation: Citation = {
  page: 7,
  passageId: "msa-notices",
  quote: noticesQuote,
};

const terminationCitations: Citation[] = [
  { page: 3, passageId: "msa-4-2", quote: terminationQuote },
  noticesCitation,
];

const invoiceTotalQuote = "Total due: $9,886.00";
const patientOwesQuote = "Patient owes: $475.40";

function filler(title: string, body: string, id?: string): PageBlock[] {
  return [
    { kind: "heading", text: title },
    { kind: "paragraph", text: body, id },
  ];
}

const masterServices: DemoDocument = {
  id: "master-services-agreement",
  fileName: "Master-Services-Agreement.pdf",
  title: "Master Services Agreement",
  counterparty: "Acme & Brightline",
  kindLabel: "Contract (MSA)",
  preview: "contract",
  pageCount: 11,
  addedLabel: "Sep 3",
  addedOn: "2024-09-03",
  intro: {
    question: "What is the notice period for termination?",
    answer:
      "Either party can terminate with 60 days written notice. Termination for breach needs 30 days notice and a chance to fix the breach.",
    citations: terminationCitations,
  },
  answers: [
    {
      keywords: [
        "notice period",
        "termination",
        "terminate",
        "convenience",
        "breach",
        "sixty",
        "60",
      ],
      answer:
        "Either party can terminate with 60 days written notice. Termination for breach needs 30 days notice and a chance to fix the breach.",
      citations: terminationCitations,
    },
    {
      keywords: ["notices", "send notice", "address", "written notice"],
      answer:
        "Written notices are effective 60 days after receipt for convenience, and cause notices follow the 30 day cure period in Section 4.3.",
      citations: [noticesCitation],
    },
    {
      keywords: ["intellectual property", "work product", "ownership"],
      answer:
        "Work product created under a statement of work belongs to the client once it is paid for. The provider keeps its pre-existing tools.",
      citations: [
        {
          page: 4,
          passageId: "msa-ip",
          quote:
            "Upon full payment, Client owns the Work Product created specifically for Client under a Statement of Work. Provider retains its pre-existing tools, templates, and know-how.",
        },
      ],
    },
    {
      keywords: ["confidential", "confidentiality", "non-disclosure"],
      answer:
        "Each party keeps the other's non-public business information confidential and uses it only to perform this agreement.",
      citations: [
        {
          page: 5,
          passageId: "msa-confidential",
          quote:
            "Each party shall protect the other party's non-public business, technical, and financial information and use it only to perform this Agreement.",
        },
      ],
    },
    {
      keywords: ["payment", "fee", "invoice", "fees"],
      answer:
        "Invoices are due within 30 days. Undisputed late amounts accrue interest at 1 percent per month.",
      citations: [
        {
          page: 6,
          passageId: "msa-fees",
          quote:
            "Client shall pay each undisputed invoice within thirty (30) days of receipt. Late undisputed amounts accrue interest at one percent (1%) per month.",
        },
      ],
    },
  ],
  pages: [
    page(1, "Master Services Agreement", "Page 1 of 11", [
      { kind: "heading", text: "Master Services Agreement" },
      {
        kind: "paragraph",
        text: "Dated as of August 26, 2024, between Acme Corporation (Client) and Brightline Solutions (Provider).",
      },
      { kind: "subheading", text: "Recitals" },
      {
        kind: "paragraph",
        text: "Acme Corporation and Brightline Solutions want written terms for deliverables, payment, and termination. This Agreement sets those terms. Each statement of work will describe a specific project.",
      },
      { kind: "subheading", text: "1. Provision of services" },
      {
        kind: "paragraph",
        text: "Provider shall perform the services described in each statement of work signed by both parties. A statement of work may not contradict this Agreement. If it does, this Agreement controls.",
      },
    ]),
    page(2, "Master Services Agreement", "Page 2 of 11", [
      { kind: "heading", text: "2. Statements of work" },
      {
        kind: "paragraph",
        text: "Each statement of work states the services, timeline, fees, and acceptance steps. Provider does not start paid work until both parties have signed that statement of work.",
      },
      {
        kind: "paragraph",
        text: "Client shall name a contact who can answer questions and accept deliverables. Provider shall name a lead who is responsible for the day-to-day work.",
      },
    ]),
    page(3, "Master Services Agreement", "Execution Copy · Page 3", [
      { kind: "heading", text: "Section 4: Term and termination" },
      { kind: "subheading", text: "4.1 Initial term and renewal" },
      {
        kind: "paragraph",
        text: "This Agreement shall commence on the Effective Date and shall continue in full force and effect for an initial period of twenty-four (24) months, unless earlier terminated pursuant to the terms herein. Thereafter, this Agreement shall automatically renew for successive twelve (12) month terms unless either party provides written notice of non-renewal at least forty-five (45) days prior to the expiration of the then-current term.",
      },
      {
        kind: "subheading",
        text: "4.2 Termination for convenience and 4.3 Termination for cause",
      },
      { kind: "paragraph", id: "msa-4-2", text: terminationQuote },
      { kind: "subheading", text: "4.4 Effect of termination" },
      {
        kind: "paragraph",
        text: "Upon expiration or termination of this Agreement for any reason, Provider shall promptly cease all work under open statements of work, and Client shall pay Provider for all undisputed services properly performed and documented through the effective date of termination. Provider shall deliver all completed work product within ten (10) business days.",
      },
      { kind: "heading", text: "Section 5: Intellectual property rights" },
      {
        kind: "paragraph",
        text: "Ownership of work product is set out on the following page. Nothing in this section assigns either party's pre-existing materials.",
      },
    ]),
    page(4, "Master Services Agreement", "Page 4 of 11", [
      ...filler(
        "5. Intellectual property",
        "Upon full payment, Client owns the Work Product created specifically for Client under a Statement of Work. Provider retains its pre-existing tools, templates, and know-how.",
        "msa-ip",
      ),
      {
        kind: "paragraph",
        text: "Provider grants Client a license to use those pre-existing tools only as part of the paid work product, and only for Client's internal business.",
      },
    ]),
    page(5, "Master Services Agreement", "Page 5 of 11", filler(
      "6. Confidentiality",
      "Each party shall protect the other party's non-public business, technical, and financial information and use it only to perform this Agreement.",
      "msa-confidential",
    )),
    page(6, "Master Services Agreement", "Page 6 of 11", filler(
      "7. Fees and payment",
      "Client shall pay each undisputed invoice within thirty (30) days of receipt. Late undisputed amounts accrue interest at one percent (1%) per month.",
      "msa-fees",
    )),
    page(7, "Master Services Agreement", "Page 7 of 11", filler(
      "8. Notices",
      noticesQuote,
      "msa-notices",
    )),
    page(8, "Master Services Agreement", "Page 8 of 11", filler(
      "9. Limitation of liability",
      "Neither party is liable for indirect or consequential damages. Each party's total liability under this Agreement is limited to the fees paid in the three months before the claim, except for unpaid fees, confidentiality breaches, or infringement.",
    )),
    page(9, "Master Services Agreement", "Page 9 of 11", filler(
      "10. Disputes",
      "The parties shall try to resolve a dispute by written discussion for 15 days before filing a claim. This Agreement is governed by the laws of Delaware, without regard to conflict-of-law rules.",
    )),
    page(10, "Master Services Agreement", "Page 10 of 11", filler(
      "11. General",
      "This Agreement and its statements of work are the entire agreement on this subject. Amendments must be written and signed. If a court holds one clause unenforceable, the rest remains in effect.",
    )),
    page(11, "Master Services Agreement", "Page 11 of 11", [
      { kind: "heading", text: "12. Signatures" },
      {
        kind: "paragraph",
        text: "The parties sign below. Each person signing represents that they are authorized to bind their company.",
      },
      {
        kind: "paragraph",
        text: "Acme Corporation, Client. Brightline Solutions, Provider. Signature blocks are reserved for the execution copy.",
      },
    ]),
  ],
};

const invoice: DemoDocument = {
  id: "inv-20418",
  fileName: "Invoice-INV-20418.pdf",
  title: "Invoice INV-20418",
  counterparty: "Northwind Supplies",
  kindLabel: "Vendor Invoice",
  preview: "invoice",
  pageCount: 2,
  addedLabel: "Sep 12",
  addedOn: "2024-09-12",
  intro: {
    question: "What is the total due?",
    answer: "The total due is $9,886.00.",
    citations: [
      { page: 1, passageId: "invoice-total", quote: invoiceTotalQuote },
    ],
  },
  answers: [
    {
      keywords: ["total", "due", "amount", "owe", "balance"],
      answer: "The total due is $9,886.00.",
      citations: [
        { page: 1, passageId: "invoice-total", quote: invoiceTotalQuote },
      ],
    },
    {
      keywords: ["rack", "server", "servers"],
      answer: "The invoice lists 4 rack servers at $8,400.00.",
      citations: [
        {
          page: 1,
          passageId: "invoice-lines",
          quote: "Rack Servers 2U, quantity 4, amount $8,400.00.",
        },
      ],
    },
    {
      keywords: ["payment terms", "when", "pay", "due date"],
      answer: "Payment is due by October 12, 2024. Send payment by ACH to the account on page 2.",
      citations: [
        {
          page: 2,
          passageId: "invoice-terms",
          quote:
            "Payment is due by October 12, 2024. Please pay by ACH and include invoice INV-20418 on the transfer.",
        },
      ],
    },
  ],
  pages: [
    page(1, "Invoice", "INV-20418 · Sep 12, 2024", [
      { kind: "heading", text: "Invoice" },
      {
        kind: "paragraph",
        text: "Northwind Supplies. Invoice INV-20418. Issued September 12, 2024. Bill to: DocTalk sample account.",
      },
      {
        kind: "table",
        id: "invoice-lines",
        columns: ["Item", "Qty", "Amount"],
        rows: [
          ["Rack Servers 2U", "4", "$8,400.00"],
          ["SFP+ Transceiver 10G", "16", "$1,120.00"],
          ["Cat6a Patch Cables", "40", "$366.00"],
        ],
      },
      { kind: "total", id: "invoice-total", label: "Total due", value: "$9,886.00" },
    ]),
    page(2, "Invoice", "Page 2 of 2", filler(
      "Payment instructions",
      "Payment is due by October 12, 2024. Please pay by ACH and include invoice INV-20418 on the transfer.",
      "invoice-terms",
    )),
  ],
};

const statement: DemoDocument = {
  id: "st-marys-2024-09-10",
  fileName: "St-Marys-Patient-Statement.pdf",
  title: "Hospital bill",
  counterparty: "St. Mary's Medical Center",
  kindLabel: "Medical Statement",
  preview: "statement",
  pageCount: 4,
  addedLabel: "Sep 10",
  addedOn: "2024-09-10",
  intro: {
    question: "What does the patient owe?",
    answer: "The patient owes $475.40 after insurance.",
    citations: [
      { page: 1, passageId: "statement-owes", quote: patientOwesQuote },
    ],
  },
  answers: [
    {
      keywords: ["owe", "owes", "patient", "balance", "due"],
      answer: "The patient owes $475.40 after insurance.",
      citations: [
        { page: 1, passageId: "statement-owes", quote: patientOwesQuote },
      ],
    },
    {
      keywords: ["insurance", "covered", "plan"],
      answer: "Insurance covered $2,240.00 of this statement.",
      citations: [
        {
          page: 1,
          passageId: "statement-covered",
          quote: "Insurance covered: $2,240.00.",
        },
      ],
    },
    {
      keywords: ["ct", "scan", "tomography"],
      answer: "The computed tomography scan is listed at $840.00.",
      citations: [
        {
          page: 2,
          passageId: "statement-items",
          quote: "Computed Tomography (CT) Scan: $840.00.",
        },
      ],
    },
  ],
  pages: [
    page(1, "St. Mary's Medical Center", "ACCT #9942-A · Sep 10, 2024", [
      { kind: "heading", text: "Patient statement" },
      {
        kind: "paragraph",
        text: "St. Mary's Medical Center. Patient billing and accounting. Account 9942-A. Statement date September 10, 2024.",
      },
      {
        kind: "table",
        id: "statement-items-summary",
        columns: ["Department service", "Fee"],
        rows: [
          ["Emergency Department Level 4", "$1,420.00"],
          ["Computed Tomography (CT) Scan", "$840.00"],
          ["Pharmacy / Dispensed Meds", "$165.40"],
          ["Diagnostic Laboratory Panel", "$290.00"],
        ],
      },
      {
        kind: "total",
        id: "statement-covered",
        label: "Insurance covered",
        value: "$2,240.00",
      },
      {
        kind: "total",
        id: "statement-owes",
        label: "Patient owes",
        value: "$475.40",
      },
    ]),
    page(2, "St. Mary's Medical Center", "Page 2 of 4", filler(
      "Itemized services",
      "Computed Tomography (CT) Scan: $840.00. The scan was performed during the September 2 visit. Pharmacy charges are itemized with the emergency visit on this page.",
      "statement-items",
    )),
    page(3, "St. Mary's Medical Center", "Page 3 of 4", filler(
      "Insurance notes",
      "The plan processed this claim on September 8, 2024. Covered amounts are shown on page 1. This page does not change the patient balance.",
    )),
    page(4, "St. Mary's Medical Center", "Page 4 of 4", filler(
      "How to pay",
      "Pay the patient balance by mail or by phone using account 9942-A. Questions about a line item can be sent to the billing office listed on the statement header.",
    )),
  ],
};

export const demoDocuments: DemoDocument[] = [
  invoice,
  statement,
  masterServices,
];

export function getDemoDocument(id: string): DemoDocument | undefined {
  return demoDocuments.find((document) => document.id === id);
}

/** Sample slugs and in-browser uploads, used only when no database is configured. */
export function isOfflineSampleId(id: string): boolean {
  return id.startsWith("local-") || getDemoDocument(id) !== undefined;
}
