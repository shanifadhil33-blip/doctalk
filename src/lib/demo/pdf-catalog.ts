export type DemoPdf = {
  fileName: string;
  /** Same-origin path served from /public. */
  fileUrl: string;
  diskName: string;
  pages: string[][];
};

/**
 * Original sample text written for this app. The files in /public/demo are
 * generated from these pages.
 */
export const demoPdfs: DemoPdf[] = [
  {
    fileName: "Sample_Services_Agreement.pdf",
    fileUrl: "/demo/sample-services-agreement.pdf",
    diskName: "sample-services-agreement.pdf",
    pages: [
      [
        "SAMPLE SERVICES AGREEMENT",
        "Agreement number: SSA-2026-014",
        "This sample agreement is between Northwind Studio (Provider) and Harbor Supplies (Client).",
        "Effective date: April 1, 2026",
        "The parties wrote this text as a sample. It is not a signed contract.",
      ],
      [
        "2. Scope of work",
        "Provider will prepare one monthly product catalog layout for Client.",
        "Provider will deliver the print-ready file on the first Monday of each month.",
        "3. Fees",
        "Client will pay Provider 2400 dollars per month.",
        "Invoices are due on the 5th day of the month.",
      ],
      [
        "4. Termination",
        "Either party may end this agreement by giving 14 days written notice.",
        "5. Governing law",
        "This agreement is governed by the laws of the State of Oregon.",
        "Notices go to contracts@example.com.",
      ],
    ],
  },
  {
    fileName: "Sample_Invoice.pdf",
    fileUrl: "/demo/sample-invoice.pdf",
    diskName: "sample-invoice.pdf",
    pages: [
      [
        "SAMPLE INVOICE",
        "From: Northwind Studio",
        "Invoice number: INV-1044",
        "Invoice date: May 2, 2026",
        "Bill to: Harbor Supplies",
        "488 Market Street, Portland, OR 97204",
      ],
      [
        "Description: Monthly catalog layout",
        "Quantity: 1",
        "Amount: 2400.00 USD",
        "Subtotal: 2400.00 USD",
        "Tax: 0.00 USD",
        "Total due: 2400.00 USD",
        "Payment due date: May 16, 2026",
        "Pay by bank transfer.",
      ],
    ],
  },
  {
    fileName: "Sample_Data_Policy.pdf",
    fileUrl: "/demo/sample-data-policy.pdf",
    diskName: "sample-data-policy.pdf",
    pages: [
      [
        "SAMPLE DATA POLICY",
        "Effective date: June 1, 2026",
        "This policy describes how sample documents are handled in this workspace.",
        "An uploaded PDF belongs to the account that uploaded it.",
        "Demo PDFs in the public demo folder can be opened by anyone.",
      ],
      [
        "Questions use only the text of the open document.",
        "If the open document does not include the answer, the reply says so.",
        "You can keep up to 5 uploaded PDFs.",
        "Delete an upload when you no longer need it.",
        "Questions about this policy can be sent to privacy@example.com.",
      ],
    ],
  },
];
