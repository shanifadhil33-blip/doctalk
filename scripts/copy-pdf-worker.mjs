import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const candidates = [
  "pdfjs-dist/build/pdf.worker.min.mjs",
  "pdfjs-dist/build/pdf.worker.mjs",
];

let source;
for (const candidate of candidates) {
  try {
    source = require.resolve(candidate);
    break;
  } catch {
    source = undefined;
  }
}

if (!source || !existsSync(source)) {
  console.error("pdf.js worker was not found. Install react-pdf before copying it.");
  process.exit(1);
}

const targetDir = path.join(process.cwd(), "public");
mkdirSync(targetDir, { recursive: true });
const target = path.join(targetDir, "pdf.worker.min.mjs");
copyFileSync(source, target);
