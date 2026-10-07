import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");

const base = process.env.DOCTALK_BASE_URL ?? "http://127.0.0.1:3456";
const chrome = process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome";

function fail(message) {
  throw new Error(message);
}

async function installErrorWatch(page) {
  const flashes = [];
  await page.exposeBinding("reportSignOutError", (_source, text) => {
    flashes.push(String(text));
  });
  await page.addInitScript(() => {
    const watch = () => {
      const report = window.reportSignOutError;
      if (typeof report !== "function") {
        window.setTimeout(watch, 0);
        return;
      }
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          const nodes = [...record.addedNodes];
          if (record.target) nodes.push(record.target);
          for (const node of nodes) {
            const text = node.textContent ?? "";
            if (text.includes("Couldn't sign out")) report(text.replace(/\s+/g, " ").trim().slice(0, 180));
          }
        }
      });
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    };
    if (document.documentElement) watch();
    else document.addEventListener("DOMContentLoaded", watch, { once: true });
  });
  return flashes;
}

async function signOutFromPreview(page) {
  const posts = [];
  const onResponse = (response) => {
    const url = response.url();
    if (response.request().method() === "POST" && url.includes("/api/auth/sign-out")) {
      posts.push({ url, status: response.status() });
    }
  };
  page.on("response", onResponse);

  await page.goto(`${base}/preview/signed-in`, { waitUntil: "load" });
  await page.reload({ waitUntil: "load" });

  await page.evaluate(() => {
    void fetch("/preview/signed-in?_rsc=probe", { headers: { Accept: "text/x-component", RSC: "1" } });
    void fetch("/?_rsc=probe", { headers: { Accept: "text/x-component", RSC: "1" } });
  });

  await page.getByRole("button", { name: "Sign out" }).click();
  const dialog = page.getByRole("dialog", { name: "Sign out of DocTalk?" });
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
  await page.getByRole("heading", { name: /Ask a PDF a question/ }).waitFor();
  page.off("response", onResponse);
  return posts;
}

async function checkHeader(page) {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`${base}/`, { waitUntil: "load" });
  const signIn = page.getByRole("button", { name: "Sign in", exact: true });
  const demos = page.getByRole("link", { name: "Try the demo" });
  await demos.first().waitFor();
  if ((await demos.count()) !== 1) fail(`expected one Try the demo link, saw ${await demos.count()}`);
  if ((await page.getByRole("button", { name: "Sign up" }).count()) !== 0) fail("Sign up is still in the header");
  if ((await page.getByRole("link", { name: "Sign up" }).count()) !== 0) fail("Sign up link is still on the page");
  const demoBox = await demos.first().boundingBox();
  const hero = page.getByRole("heading", { name: /Ask a PDF a question/ });
  const heroBox = await hero.boundingBox();
  if (!demoBox || !heroBox || demoBox.y < heroBox.y) fail("Try the demo is not the hero control");

  const inBox = await signIn.boundingBox();
  const logo = await page.getByRole("link", { name: "DocTalk" }).boundingBox();
  if (!inBox || !logo) fail("header controls are missing");
  const sameRow = (a, b) => Math.abs(a.y - b.y) < 12 && a.y < b.y + b.height && b.y < a.y + a.height;
  if (!sameRow(logo, inBox)) fail(`header row wrapped away from the logo (${JSON.stringify({ logo, inBox })})`);
  if (inBox.x < 0 || inBox.x + inBox.width > 320.5) {
    fail(`header overflows 320px (${JSON.stringify({ inBox })})`);
  }
  const signInColor = await signIn.evaluate((node) => getComputedStyle(node).backgroundColor);
  if (signInColor !== "rgb(79, 70, 229)") fail(`Sign in is not indigo (${signInColor})`);
  const footer = await page.getByText("Built by Adhil Shanif").textContent();
  if (footer !== "Built by Adhil Shanif") fail(`footer changed (${footer})`);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const flashes = await installErrorWatch(page);
    const posts = await signOutFromPreview(page);
    if (flashes.length > 0) fail(`error text rendered during sign-out: ${JSON.stringify(flashes)}`);
    if (posts.length !== 1 || posts[0].status !== 200) {
      fail(`expected one successful sign-out POST, saw ${JSON.stringify(posts)}`);
    }
    if (await page.getByText("Couldn't sign out. Try again.").count()) {
      fail("error text is on the landing page");
    }
    await checkHeader(page);
    console.log(JSON.stringify({ posts, flashes, header320: "ok" }));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
