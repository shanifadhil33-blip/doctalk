import { chunkPages } from "@/lib/pdf/chunk";
import { plainPdfLine } from "@/lib/pdf/simple-pdf";
import type { Passage } from "@/lib/retrieval/answer";

export type DemoPdf = {
  fileName: string;
  /** Same-origin path served from /public. */
  fileUrl: string;
  diskName: string;
  pages: string[][];
};

/**
 * Original sample text written for this app. The files in /public/demo are
 * generated from these pages. Questions about a seeded demo use this same text.
 */
export const demoPdfs: DemoPdf[] = [
  {
    fileName: "Sample_Services_Agreement.pdf",
    fileUrl: "/demo/sample-services-agreement.pdf",
    diskName: "sample-services-agreement.pdf",
    pages: [
      [
        "SAMPLE SERVICES AGREEMENT",
        "> Northwind Studio and Harbor Supplies",
        "> Agreement number: SSA-2026-014",
        "> Effective date: April 1, 2026",
        "> Term: April 1, 2026 through March 31, 2027",
        "> This text is a sample. It is not a signed contract.",
        "",
        "Northwind Studio (Provider) and Harbor Supplies (Client) wrote this sample so a reader can ask about scope, fees, dates, and notice. Elena Voss signs for the Provider. Chris Patel signs for the Client. Neither signature is on this copy.",
        "",
        "# 1. Parties and notices",
        "Provider's office for this sample is 120 Sample Avenue, Portland, OR 97204. Client's office is 488 Market Street, Portland, OR 97204. Notices go to contracts@example.com and are effective when the other party receives them on a business day. A notice received after 5:00 p.m. Pacific Time counts as received at 9:00 a.m. the next business day.",
        "",
        "# 2. Purpose",
        "Provider will prepare Client's monthly product catalog. The work is layout only. Provider does not print the catalog, buy media, or sell Client's goods. Each month stands on its own once the invoice for that month is paid.",
      ],
      [
        "SAMPLE SERVICES AGREEMENT",
        "> SSA-2026-014, continued. Effective April 1, 2026.",
        "",
        "# 3. Scope of work",
        "Provider will prepare one monthly product catalog layout of 24 pages for Client. The layout covers the product list Chris Patel sends by the 20th of the prior month. Provider will deliver the print-ready file on the first Monday of each month, starting Monday, May 4, 2026. A month with no list by the 20th is billed at the monthly fee and delivered as a cover plus a note that the list was late.",
        "",
        "The May 2026 catalog uses the April 20, 2026 list of 186 items. Provider includes one round of revisions on the cover and the contents page. Further revisions are 85.00 USD per hour, billed in half hours, and only after Chris Patel approves the hours in writing.",
        "",
        "# 4. Client duties",
        "Client will name one contact. For this sample the contact is Chris Patel, purchasing manager, chris.patel@example.com. Client will supply product names, prices, and photographs that Client has the right to use. Provider may rely on those prices. A wrong price in the catalog is Client's correction to make on the next month's list.",
      ],
      [
        "SAMPLE SERVICES AGREEMENT",
        "> SSA-2026-014, continued.",
        "",
        "# 5. Fees",
        "Client will pay Provider 2400.00 USD per month for the catalog layout. The fee covers the 24-page file and one revision round. It does not cover printing, postage, or photography.",
        "",
        "Out-of-pocket expenses are capped at 150.00 USD per month unless Chris Patel approves a higher amount in writing. The May 2026 expense estimate is 40.00 USD for a proof courier to 488 Market Street.",
        "",
        "Invoices are due on the 5th day of the month. Invoice INV-1044, dated May 2, 2026, is the first invoice under this agreement and is due May 16, 2026. Undisputed amounts unpaid 15 days after the due date accrue interest at 1.5 percent per month.",
        "",
        "# 6. Acceptance",
        "Client has 5 business days after delivery to accept the file or to send a written list of corrections. Silence after 5 business days is acceptance. The May 4, 2026 delivery is accepted if Client sends no list by May 11, 2026.",
      ],
      [
        "SAMPLE SERVICES AGREEMENT",
        "> SSA-2026-014, continued.",
        "",
        "# 7. Term",
        "This agreement starts on April 1, 2026 and ends on March 31, 2027 unless ended earlier under section 8. It does not renew on its own. A new term needs a new written agreement number.",
        "",
        "# 8. Termination",
        "Either party may end this agreement by giving 14 days written notice. Provider will finish a catalog whose list arrived before the notice and will invoice that month. Client will pay for work done through the end date. A notice sent on June 1, 2026 would end the agreement on June 15, 2026.",
        "",
        "If Client does not pay an undisputed invoice within 30 days after the due date, Provider may stop work until the invoice is paid. Stopping work is not itself a termination.",
        "",
        "# 9. Ownership",
        "After Client pays the invoice for a month, Client owns that month's catalog file. Provider keeps its type styles, grid, and working files. Provider may show the cover in a sample portfolio if the prices and the Harbor Supplies name are removed.",
      ],
      [
        "SAMPLE SERVICES AGREEMENT",
        "> SSA-2026-014, continued.",
        "",
        "# 10. Confidentiality",
        "Each party will keep the other's non-public prices, supplier names, and schedules private and will use them only to perform this agreement. The duty lasts for 2 years after March 31, 2027. A document that is already public is not covered.",
        "",
        "# 11. Governing law",
        "This agreement is governed by the laws of the State of Oregon. The sample venue is the state courts in Multnomah County, Oregon. The parties wrote the venue for the sample only.",
        "",
        "# 12. Sample notice",
        "Elena Voss, studio director, Northwind Studio, and Chris Patel, purchasing manager, Harbor Supplies, are fictional contacts. The fee of 2400.00 USD, the 14 day notice, and the addresses in this agreement are sample figures. Do not treat this file as a contract of a real company.",
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
        "> From: Northwind Studio, 120 Sample Avenue, Portland, OR 97204",
        "> Invoice number: INV-1044",
        "> Invoice date: May 2, 2026",
        "> Agreement: SSA-2026-014",
        "> Bill to: Harbor Supplies",
        "> Attention: Chris Patel, purchasing manager",
        "> 488 Market Street, Portland, OR 97204",
        "",
        "This sample invoice bills the May 2026 catalog layout under the sample services agreement. It is not a request for a real payment. The figures below are the ones a reader can ask about.",
        "",
        "# Account",
        "Customer account: HS-4418. Prepared by Elena Voss on May 2, 2026. The purchase order on Client's April 20 list is PO-7781. Quote the invoice number INV-1044 on any question about these figures.",
      ],
      [
        "SAMPLE INVOICE",
        "> INV-1044, page 2. Invoice date May 2, 2026.",
        "",
        "# Charges",
        "Description: Monthly catalog layout, May 2026, 24 pages, 186 items from the April 20, 2026 list. Quantity: 1. Rate: 2400.00 USD. Amount: 2400.00 USD.",
        "",
        "Description: Cover revision round included in the monthly fee. Quantity: 1. Amount: 0.00 USD.",
        "",
        "Description: Proof courier to 488 Market Street on May 4, 2026. Quantity: 1. Amount: 40.00 USD. This courier is inside the 150.00 USD monthly expense cap.",
        "",
        "Subtotal: 2440.00 USD.",
        "Tax: 0.00 USD. No tax is charged on this sample.",
        "Total due: 2440.00 USD.",
        "",
        "The amount to pay is the layout fee of 2400.00 USD plus the 40.00 USD courier. Total due: 2440.00 USD.",
      ],
      [
        "SAMPLE INVOICE",
        "> INV-1044, page 3. Payment instructions.",
        "",
        "# Payment",
        "Payment due date: May 16, 2026. That is 14 days after the invoice date of May 2, 2026. Pay by bank transfer to the sample account named Northwind Studio Demo, routing 000000000, account 000000000. Those numbers are not a real bank account.",
        "",
        "Write INV-1044 and PO-7781 on the transfer. A transfer that omits the invoice number is still credited to Harbor Supplies account HS-4418 if the amount is 2440.00 USD and the date is in May 2026.",
        "",
        "# Late amount",
        "If the 2440.00 USD is still unpaid on May 31, 2026, the sample late charge is 1.5 percent of 2440.00 USD, which is 36.60 USD, and is then due together with the invoice. The agreement allows Provider to stop the June layout until INV-1044 is paid.",
        "",
        "# What was delivered",
        "Elena Voss delivered the print-ready file on Monday, May 4, 2026. Chris Patel had until May 11, 2026 to send corrections. No correction list was received, so the May catalog is accepted under section 6 of SSA-2026-014.",
      ],
      [
        "SAMPLE INVOICE",
        "> INV-1044, page 4. Notes.",
        "",
        "# Related documents",
        "This invoice belongs with sample agreement SSA-2026-014, effective April 1, 2026, between Northwind Studio and Harbor Supplies. The monthly fee in that agreement is 2400.00 USD, and invoices are due on the 5th day of the month. This invoice was issued on May 2, 2026, a Saturday, and the due date was moved to May 16, 2026.",
        "",
        "# Questions about a line",
        "Questions about a line on INV-1044 go to Elena Voss at billing@example.com. A question about the 186 items on the April 20 list goes to Chris Patel at chris.patel@example.com. Neither address receives real mail.",
        "",
        "# Sample notice",
        "Harbor Supplies, Northwind Studio, Chris Patel, and Elena Voss are fictional. Do not send money. The only amount due on this sample is Total due: 2440.00 USD, by May 16, 2026.",
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
        "> Northwind Studio sample workspace",
        "> Document number: POL-2026-018",
        "> Effective date: June 1, 2026",
        "> Prepared by: Mara Ellison, Privacy Lead",
        "> Status: Sample only. Not a client policy and not legal advice.",
        "",
        "This policy describes how sample documents are handled in this workspace. It is the text a visitor can ask about: who owns a file, who can open it, how long it is kept, and how a question is answered.",
        "",
        "# 1. Purpose",
        "Northwind Studio published this sample on June 1, 2026. It covers demo PDFs in the public folder and PDFs a signed-in account uploads. Harbor Supplies and the people named in the sample agreement are examples in those other files. They are not the operator of this workspace.",
        "",
        "# 2. Who it covers",
        "It covers a visitor who opens a demo PDF, and an account that uploads its own PDF. The privacy lead named on this sample is Mara Ellison. Policy questions go to privacy@example.com.",
      ],
      [
        "SAMPLE DATA POLICY",
        "> POL-2026-018, continued. Effective June 1, 2026.",
        "",
        "# 3. Ownership",
        "An uploaded PDF belongs to the account that uploaded it. The owner is the account on the upload record. The name printed inside the file does not change the owner.",
        "",
        "On May 12, 2026, Jordan Hale uploaded Harbor-packing-list.pdf, 842 KB, to a sample account. That file belongs to Jordan Hale's account. Deleting it removes it from that account.",
        "",
        "# 4. Demo files",
        "Demo PDFs in the public demo folder can be opened by anyone. They have no owner account. The folder holds three samples: this policy (POL-2026-018), services agreement SSA-2026-014, and invoice INV-1044. Opening a sample does not count toward an account's file limit.",
        "",
        "# 5. Private files",
        "A signed-in visitor sees the samples plus the PDFs on that visitor's own account. One account cannot open another account's upload. A link to someone else's file does not show the file. The server checks the account before it returns the PDF or answers a question about it.",
      ],
      [
        "SAMPLE DATA POLICY",
        "> POL-2026-018, continued.",
        "",
        "# 6. How long files are kept",
        "Demo PDFs stay in the public folder while this sample workspace is published. An uploaded PDF stays until the account deletes it. After deletion the workspace does not keep a separate archive. Jordan Hale's packing list from May 12, 2026 would leave the account when that account deletes it.",
        "",
        "# 7. How many files",
        "An account can keep up to 5 uploaded PDFs. Each file must be a PDF of 10 MB or smaller. The three public samples do not count toward the 5. Delete an upload when you no longer need it if you want room for another file.",
        "",
        "# 8. Questions about a document",
        "A question is answered from the text of the open document, and the reply cites the page the words came from. A question about what the document contains, what it is about, or a request to summarize it is answered from that text. If the document does not state a specific fact, the reply says that it is not in the document. The demo does not fill a gap with outside knowledge.",
      ],
      [
        "SAMPLE DATA POLICY",
        "> POL-2026-018, continued.",
        "",
        "# 9. What this sample does not collect",
        "This policy does not describe a real customer database. The demo does not ask for a phone number, a payment card, or a home address. The invoice sample uses the fictional address 488 Market Street, Portland, OR 97204. Do not send a payment there.",
        "",
        "# 10. Notices",
        "Write to privacy@example.com. Mara Ellison reads sample messages on business days. A message received after 5:00 p.m. Pacific Time counts as received at 9:00 a.m. Pacific Time the next business day. The sample office is closed Saturday and Sunday.",
        "",
        "# 11. Related sample documents",
        "The services agreement is effective April 1, 2026, between Northwind Studio and Harbor Supplies. The monthly layout fee is 2400.00 USD. Invoice INV-1044 is dated May 2, 2026, adds a 40.00 USD courier, shows Total due: 2440.00 USD, and asks for payment by May 16, 2026. Those figures live in that invoice. This policy only points at them.",
      ],
      [
        "SAMPLE DATA POLICY",
        "> POL-2026-018, continued.",
        "",
        "# 12. Changes",
        "Northwind Studio may replace this sample text when the demo is updated. The effective date on page 1 changes when the text changes. A copy a visitor saved earlier is not updated. The version in the public folder is document POL-2026-018, effective June 1, 2026, prepared by Mara Ellison.",
        "",
        "# 13. Contact for this version",
        "Privacy lead: Mara Ellison, privacy@example.com. Sample mailing address: Northwind Studio, 120 Sample Avenue, Portland, OR 97204. The street address is fictional, like the rest of this file.",
        "",
        "# 14. Sample notice",
        "This document is a sample. The names, dates, amounts, and addresses in it are fictional. It is not legal advice and it is not the policy of a real organization. The sections above are the content of the file.",
      ],
    ],
  },
];

export function plainDemoLine(line: string): string {
  return plainPdfLine(line).text;
}

/** Passages for a seeded demo, in page order, from the same text as the PDF. */
export function passagesForDemoFile(fileName: string): Passage[] | null {
  const demo = demoPdfs.find((item) => item.fileName === fileName);
  if (!demo) return null;
  const pages = demo.pages.map((lines, index) => ({
    page: index + 1,
    text: lines.map(plainDemoLine).filter((line) => line.length > 0).join("\n"),
  }));
  return chunkPages(pages).map((chunk) => ({
    page: chunk.page,
    content: chunk.content,
  }));
}
