import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { chunks, documents, extractions, settings } from "./schema";

config({ path: ".env" });

const ZERO_EMBEDDING = Array.from({ length: 768 }, () => 0);

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  const existingMode = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "mode"))
    .limit(1);

  if (existingMode.length === 0) {
    await db.insert(settings).values({ key: "mode", value: "demo" });
  }

  const existingDemos = await db
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.isDemo, true))
    .limit(1);

  if (existingDemos.length > 0) {
    console.log("Demo data already exists — skipping seed");
    return;
  }

  await seedInvoice(db);
  await seedMedicalBill(db);
  await seedServiceContract(db);

  console.log("Seeded 3 demo documents with chunks and extractions");
}

async function seedInvoice(
  db: ReturnType<typeof drizzle>
) {
  const [doc] = await db
    .insert(documents)
    .values({
      fileName: "Acme_Corp_Invoice_March_2025.pdf",
      fileUrl: "demo://acme-corp-invoice-march-2025.pdf",
      isDemo: true,
    })
    .returning();

  if (!doc) throw new Error("Failed to insert invoice document");

  const chunkRows = await db
    .insert(chunks)
    .values([
      {
        documentId: doc.id,
        chunkIndex: 0,
        content:
          "ACME CORP\nINVOICE\nInvoice Number: INV-2025-0042\nInvoice Date: March 12, 2025\nDue Date: April 11, 2025",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 1, chunkType: "header", sectionTitle: "Invoice Header" },
      },
      {
        documentId: doc.id,
        chunkIndex: 1,
        content:
          "Bill To:\nBrightside Retail LLC\n488 Market Street, Suite 210\nSan Francisco, CA 94105",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 1, chunkType: "paragraph", sectionTitle: "Bill To" },
      },
      {
        documentId: doc.id,
        chunkIndex: 2,
        content:
          "| Description | Qty | Unit Price | Total |\n| --- | --- | --- | --- |\n| Industrial sensor pack (SKU-SEN-12) | 4 | 125.00 | 500.00 |\n| On-site calibration visit | 1 | 350.00 | 350.00 |\n| Priority shipping | 1 | 45.00 | 45.00 |",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 1, chunkType: "table_context", sectionTitle: "Line Items" },
      },
      {
        documentId: doc.id,
        chunkIndex: 3,
        content:
          "Subtotal: $895.00\nSales Tax (8.5%): $76.08\nTotal Due: $971.08\nCurrency: USD\nPayment terms: Net 30",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 1, chunkType: "paragraph", sectionTitle: "Totals" },
      },
    ])
    .returning();

  const [header, billTo, table, totals] = chunkRows;
  if (!header || !billTo || !table || !totals) {
    throw new Error("Failed to insert invoice chunks");
  }

  const extractedJson = {
    schemaVersion: "invoice_v1",
    invoice_number: "INV-2025-0042",
    date: "2025-03-12",
    due_date: "2025-04-11",
    bill_to: {
      name: "Brightside Retail LLC",
      address: "488 Market Street, Suite 210, San Francisco, CA 94105",
    },
    line_items: [
      {
        description: "Industrial sensor pack (SKU-SEN-12)",
        quantity: 4,
        unit_price: 125.0,
        total: 500.0,
      },
      {
        description: "On-site calibration visit",
        quantity: 1,
        unit_price: 350.0,
        total: 350.0,
      },
      {
        description: "Priority shipping",
        quantity: 1,
        unit_price: 45.0,
        total: 45.0,
      },
    ],
    subtotal: 895.0,
    tax: 76.08,
    total: 971.08,
    currency: "USD",
    _evidence: {
      invoice_number: "Invoice Number: INV-2025-0042",
      date: "Invoice Date: March 12, 2025",
      due_date: "Due Date: April 11, 2025",
      bill_to: {
        name: "Brightside Retail LLC",
        address: "488 Market Street, Suite 210\nSan Francisco, CA 94105",
      },
      line_items: [
        {
          description: "Industrial sensor pack (SKU-SEN-12)",
          quantity: "4",
          unit_price: "125.00",
          total: "500.00",
        },
        {
          description: "On-site calibration visit",
          quantity: "1",
          unit_price: "350.00",
          total: "350.00",
        },
        {
          description: "Priority shipping",
          quantity: "1",
          unit_price: "45.00",
          total: "45.00",
        },
      ],
      subtotal: "Subtotal: $895.00",
      tax: "Sales Tax (8.5%): $76.08",
      total: "Total Due: $971.08",
      currency: "Currency: USD",
    },
  };

  await db.insert(extractions).values({
    documentId: doc.id,
    extractedJson,
    sourceMap: {
      invoice_number: [header.id],
      date: [header.id],
      due_date: [header.id],
      bill_to: [billTo.id],
      line_items: [table.id],
      subtotal: [totals.id],
      tax: [totals.id],
      total: [totals.id],
      currency: [totals.id],
    },
  });
}

async function seedMedicalBill(db: ReturnType<typeof drizzle>) {
  const [doc] = await db
    .insert(documents)
    .values({
      fileName: "Medical_Bill_City_Hospital.pdf",
      fileUrl: "demo://medical-bill-city-hospital.pdf",
      isDemo: true,
    })
    .returning();

  if (!doc) throw new Error("Failed to insert medical bill document");

  const chunkRows = await db
    .insert(chunks)
    .values([
      {
        documentId: doc.id,
        chunkIndex: 0,
        content:
          "CITY HOSPITAL — PATIENT STATEMENT\nPatient Name: Jane Doe\nPatient ID: CH-882194\nDate of Service: February 3, 2025\nProvider: City Hospital Outpatient Imaging",
        embedding: ZERO_EMBEDDING,
        metadata: {
          pageNumber: 1,
          chunkType: "header",
          sectionTitle: "Patient Information",
        },
      },
      {
        documentId: doc.id,
        chunkIndex: 1,
        content:
          "Diagnosis Codes:\nM54.5 — Low back pain\nR51.9 — Headache, unspecified",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 1, chunkType: "paragraph", sectionTitle: "Diagnosis" },
      },
      {
        documentId: doc.id,
        chunkIndex: 2,
        content:
          "| Code | Description | Charge |\n| --- | --- | --- |\n| 72148 | MRI lumbar spine w/o contrast | 1,850.00 |\n| 99213 | Office/outpatient visit, established | 215.00 |\n| 36415 | Routine venipuncture | 35.00 |",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 2, chunkType: "table_context", sectionTitle: "Procedures" },
      },
      {
        documentId: doc.id,
        chunkIndex: 3,
        content:
          "Total Charges: $2,100.00\nInsurance Adjustments: -$1,260.00\nAmount Due: $840.00\nPlease remit payment within 30 days of statement date.",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 2, chunkType: "paragraph", sectionTitle: "Balances" },
      },
    ])
    .returning();

  const [patient, diagnosis, procedures, balances] = chunkRows;
  if (!patient || !diagnosis || !procedures || !balances) {
    throw new Error("Failed to insert medical bill chunks");
  }

  await db.insert(extractions).values({
    documentId: doc.id,
    extractedJson: {
      schemaVersion: "medical_bill_v1",
      patient_name: "Jane Doe",
      patient_id: "CH-882194",
      provider_name: "City Hospital Outpatient Imaging",
      date_of_service: "2025-02-03",
      diagnosis_codes: ["M54.5", "R51.9"],
      procedures: [
        {
          code: "72148",
          description: "MRI lumbar spine w/o contrast",
          charge: 1850.0,
        },
        {
          code: "99213",
          description: "Office/outpatient visit, established",
          charge: 215.0,
        },
        {
          code: "36415",
          description: "Routine venipuncture",
          charge: 35.0,
        },
      ],
      total_charges: 2100.0,
      insurance_adjustments: -1260.0,
      amount_due: 840.0,
      _evidence: {
        patient_name: "Patient Name: Jane Doe",
        patient_id: "Patient ID: CH-882194",
        provider_name: "Provider: City Hospital Outpatient Imaging",
        date_of_service: "Date of Service: February 3, 2025",
        diagnosis_codes: [
          "M54.5 — Low back pain",
          "R51.9 — Headache, unspecified",
        ],
        procedures: [
          {
            code: "72148",
            description: "MRI lumbar spine w/o contrast",
            charge: "1,850.00",
          },
          {
            code: "99213",
            description: "Office/outpatient visit, established",
            charge: "215.00",
          },
          {
            code: "36415",
            description: "Routine venipuncture",
            charge: "35.00",
          },
        ],
        total_charges: "Total Charges: $2,100.00",
        insurance_adjustments: "Insurance Adjustments: -$1,260.00",
        amount_due: "Amount Due: $840.00",
      },
    },
    sourceMap: {
      patient_name: [patient.id],
      patient_id: [patient.id],
      provider_name: [patient.id],
      date_of_service: [patient.id],
      diagnosis_codes: [diagnosis.id],
      procedures: [procedures.id],
      total_charges: [balances.id],
      insurance_adjustments: [balances.id],
      amount_due: [balances.id],
    },
  });
}

async function seedServiceContract(db: ReturnType<typeof drizzle>) {
  const [doc] = await db
    .insert(documents)
    .values({
      fileName: "Service_Agreement_Freelance_Contract.pdf",
      fileUrl: "demo://service-agreement-freelance-contract.pdf",
      isDemo: true,
    })
    .returning();

  if (!doc) throw new Error("Failed to insert service contract document");

  const chunkRows = await db
    .insert(chunks)
    .values([
      {
        documentId: doc.id,
        chunkIndex: 0,
        content:
          'SERVICE AGREEMENT\nContract ID: SA-2025-118\nThis Service Agreement is entered into between Acme Corp ("Client") and WebDesign Co. ("Provider").',
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 1, chunkType: "header", sectionTitle: "Parties" },
      },
      {
        documentId: doc.id,
        chunkIndex: 1,
        content:
          '1. Term\nThe services shall commence on January 15, 2025 ("Start Date") and continue through July 15, 2025 ("End Date"), unless terminated earlier in accordance with Section 8.',
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 1, chunkType: "paragraph", sectionTitle: "Term" },
      },
      {
        documentId: doc.id,
        chunkIndex: 2,
        content:
          "2. Scope of Work\nProvider shall design, build, and launch a marketing website for Client, including homepage, product pages, contact form, and CMS training for up to three Client staff members.",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 2, chunkType: "paragraph", sectionTitle: "Scope of Work" },
      },
      {
        documentId: doc.id,
        chunkIndex: 3,
        content:
          "3. Payment Terms\nTotal contract value: $18,500.00 USD.\nPayment schedule: 40% upon signing, 40% at design approval, 20% on launch.\nInvoices are due within fifteen (15) days of receipt.",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 2, chunkType: "paragraph", sectionTitle: "Payment Terms" },
      },
      {
        documentId: doc.id,
        chunkIndex: 4,
        content:
          "8. Termination\nEither party may terminate this Agreement by providing thirty (30) days prior written notice to the other party.",
        embedding: ZERO_EMBEDDING,
        metadata: { pageNumber: 3, chunkType: "paragraph", sectionTitle: "Termination" },
      },
    ])
    .returning();

  const [parties, dates, scope, payment, termination] = chunkRows;
  if (!parties || !dates || !scope || !payment || !termination) {
    throw new Error("Failed to insert contract chunks");
  }

  await db.insert(extractions).values({
    documentId: doc.id,
    extractedJson: {
      schemaVersion: "service_contract_v1",
      contract_id: "SA-2025-118",
      parties: {
        client: "Acme Corp",
        provider: "WebDesign Co.",
      },
      start_date: "2025-01-15",
      end_date: "2025-07-15",
      scope_of_work:
        "Design, build, and launch a marketing website including homepage, product pages, contact form, and CMS training for up to three Client staff members.",
      payment_terms:
        "40% upon signing, 40% at design approval, 20% on launch; invoices due within 15 days of receipt.",
      total_value: 18500.0,
      termination_notice_days: 30,
      _evidence: {
        contract_id: "Contract ID: SA-2025-118",
        parties: {
          client: 'Acme Corp ("Client")',
          provider: 'WebDesign Co. ("Provider")',
        },
        start_date: 'commence on January 15, 2025 ("Start Date")',
        end_date: 'continue through July 15, 2025 ("End Date")',
        scope_of_work:
          "design, build, and launch a marketing website for Client, including homepage, product pages, contact form, and CMS training for up to three Client staff members",
        payment_terms:
          "Payment schedule: 40% upon signing, 40% at design approval, 20% on launch. Invoices are due within fifteen (15) days of receipt.",
        total_value: "Total contract value: $18,500.00 USD.",
        termination_notice_days:
          "providing thirty (30) days prior written notice to the other party",
      },
    },
    sourceMap: {
      contract_id: [parties.id],
      parties: [parties.id],
      start_date: [dates.id],
      end_date: [dates.id],
      scope_of_work: [scope.id],
      payment_terms: [payment.id],
      total_value: [payment.id],
      termination_notice_days: [termination.id],
    },
  });
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
