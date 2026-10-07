import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");

const base = process.env.DOCTALK_BASE_URL ?? "http://127.0.0.1:3456";
const outDir = process.env.DOCTALK_SHOTS ?? "/opt/cursor/artifacts/overlays";
const chrome = process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome";

const widths = [
  { name: "390", width: 390, height: 844 },
  { name: "1280", width: 1280, height: 800 },
];
const auditWidths = [320, 390, 768, 1280];

function fail(message) {
  throw new Error(message);
}

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
  return file;
}

async function hit(page, x, y) {
  return page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const overlay = el.closest("[role='dialog'], [role='menu'], [role='listbox'], .z-50");
    return {
      tag: el.tagName,
      id: el.id,
      role: el.getAttribute("role"),
      text: (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
      inMain: Boolean(el.closest("#main")),
      overlay: overlay ? overlay.getAttribute("role") || overlay.className.slice(0, 40) : null,
    };
  }, { x, y });
}

async function assertOnTop(page, locator, label) {
  const box = await locator.boundingBox();
  if (!box) fail(`${label} has no box`);
  const viewport = page.viewportSize();
  if (!viewport) fail("no viewport");
  if (box.y < -1 || box.x < -1 || box.y + box.height > viewport.height + 1 || box.x + box.width > viewport.width + 1) {
    fail(`${label} is not fully in the viewport (${JSON.stringify(box)} in ${viewport.width}x${viewport.height})`);
  }
  const point = await hit(page, box.x + box.width / 2, box.y + Math.min(box.height / 2, box.height - 2));
  if (!point || point.inMain) {
    fail(`${label} is covered by page content: ${JSON.stringify(point)}`);
  }
  return point;
}

async function openSignOut(page, width) {
  if (width < 640) {
    await page.getByRole("button", { name: /Account menu for/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
  } else {
    await page.getByRole("button", { name: "Sign out" }).first().click();
  }
  await page.getByRole("dialog", { name: "Sign out of DocTalk?" }).waitFor();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const notes = [];
  try {
    const page = await browser.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const size of widths) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(`${base}/preview/signed-in`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Your documents" }).waitFor();
      await shot(page, `signed-in-documents-${size.name}`);

      await page.goto(`${base}/preview/signed-in?view=documents`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Your documents" }).waitFor();
      await page.getByText("Use the upload box above to add a PDF or Markdown file.").waitFor();
      if (await page.getByRole("button", { name: "Upload PDF or Markdown" }).count()) {
        fail("signed-in documents route still has a header upload button");
      }
      await shot(page, `signed-in-documents-route-${size.name}`);

      await page.goto(`${base}/preview/signed-in`, { waitUntil: "networkidle" });
      if (size.width < 640) {
        await page.getByRole("button", { name: /Account menu for/ }).click();
        await page.getByRole("menu", { name: "Account" }).waitFor();
        await assertOnTop(page, page.getByRole("menu", { name: "Account" }), "account menu");
      }
      await shot(page, `account-menu-${size.name}`);
      await page.keyboard.press("Escape").catch(() => undefined);

      await page.goto(`${base}/preview/signed-in`, { waitUntil: "networkidle" });
      await openSignOut(page, size.width);
      const dialog = page.getByRole("dialog", { name: "Sign out of DocTalk?" });
      await assertOnTop(page, dialog.getByRole("heading", { name: "Sign out of DocTalk?" }), "sign-out title");
      await assertOnTop(page, dialog.getByRole("button", { name: "Cancel" }), "sign-out cancel");
      await assertOnTop(page, dialog.getByRole("button", { name: "Sign out" }), "sign-out confirm");
      const corner = await hit(page, 12, 12);
      if (!corner || corner.inMain || !corner.overlay) {
        fail(`sign-out backdrop does not cover the header: ${JSON.stringify(corner)}`);
      }
      await shot(page, `sign-out-confirm-${size.name}`);
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await dialog.waitFor({ state: "hidden" });

      await page.goto(`${base}/preview/signed-in`, { waitUntil: "networkidle" });
      await page.route("**/api/documents**", async () => {
        await new Promise(() => undefined);
      });
      await page.locator("#home-pdf").setInputFiles({
        name: "desk-note.md",
        mimeType: "text/markdown",
        buffer: Buffer.from("# Desk hours\nOpen at 8:30.\n"),
      });
      await page.getByRole("status").filter({ hasText: "Uploading" }).waitFor();
      await shot(page, `upload-in-progress-${size.name}`);
      await page.unroute("**/api/documents**");

      await page.goto(`${base}/preview/signed-in?view=demo`, { waitUntil: "networkidle" });
      if (await page.getByRole("button", { name: "Upload PDF or Markdown" }).count()) {
        fail("signed-in demo list still has a header upload button");
      }
      await page.getByRole("button", { name: /Sort by/ }).click();
      const listbox = page.getByRole("listbox");
      await listbox.waitFor();
      await assertOnTop(page, listbox, "sort dropdown");
      await shot(page, `sort-dropdown-${size.name}`);

      await page.goto(`${base}/preview/signed-in?view=settings`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Settings" }).waitFor();
      await page.getByText("Built by Adhil Shanif").waitFor();
      await shot(page, `settings-${size.name}`);
    }

    for (const width of auditWidths) {
      await page.setViewportSize({ width, height: width >= 768 ? 800 : 844 });
      await page.goto(`${base}/preview/signed-in`, { waitUntil: "networkidle" });
      await openSignOut(page, width);
      const dialog = page.getByRole("dialog", { name: "Sign out of DocTalk?" });
      await assertOnTop(page, dialog.getByRole("heading", { name: "Sign out of DocTalk?" }), `title @${width}`);
      const cancel = dialog.getByRole("button", { name: "Cancel" });
      await assertOnTop(page, cancel, `cancel @${width}`);
      await cancel.click();
      await dialog.waitFor({ state: "hidden" });
      notes.push(`sign-out ${width} on top`);

      await page.goto(`${base}/documents`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Upload PDF or Markdown" }).click();
      const upload = page.getByRole("dialog", { name: "Upload a PDF or Markdown file" });
      await upload.waitFor();
      await assertOnTop(page, upload.getByRole("heading", { name: "Upload a PDF or Markdown file" }), `upload @${width}`);
      await assertOnTop(page, upload.getByRole("button", { name: "Cancel" }), `upload cancel @${width}`);
      const uploadCorner = await hit(page, 8, 8);
      if (!uploadCorner || uploadCorner.inMain || !uploadCorner.overlay) {
        fail(`upload backdrop under content @${width}: ${JSON.stringify(uploadCorner)}`);
      }
      await upload.getByRole("button", { name: "Cancel" }).click();
      notes.push(`upload dialog ${width} on top`);

      await page.getByRole("button", { name: /Sort by/ }).click();
      await assertOnTop(page, page.getByRole("listbox"), `sort @${width}`);
      await page.keyboard.press("Escape");
      notes.push(`sort ${width} on top`);
    }

    const previewOff = await page.context().request.get(`${base}/preview/signed-in`);
    notes.push(`preview status with flag: ${previewOff.status()}`);
  } finally {
    await browser.close();
  }
  await writeFile(path.join(outDir, "checks.txt"), `${notes.join("\n")}\n`);
  console.log(notes.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
