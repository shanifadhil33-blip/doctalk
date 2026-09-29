import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { demoPdfs } from "../src/lib/demo/pdf-catalog";
import { buildPdf } from "../src/lib/pdf/simple-pdf";

async function main() {
  const directory = path.join(process.cwd(), "public", "demo");
  await mkdir(directory, { recursive: true });

  for (const demo of demoPdfs) {
    const bytes = buildPdf(demo.pages);
    const filePath = path.join(directory, demo.diskName);
    await writeFile(filePath, bytes);
    console.log(`Wrote ${filePath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
