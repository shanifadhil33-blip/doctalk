import { extractText, getDocumentProxy } from "unpdf";
import type { PageText } from "@/lib/pdf/chunk";

export async function parsePdfPages(bytes: Uint8Array): Promise<PageText[]> {
  const pdf = await getDocumentProxy(bytes);
  try {
    const extracted = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(extracted.text) ? extracted.text : [extracted.text];
    return pages.map((text, index) => ({
      page: index + 1,
      text: text.trim(),
    }));
  } finally {
    if ("destroy" in pdf && typeof pdf.destroy === "function") {
      await pdf.destroy();
    }
  }
}
