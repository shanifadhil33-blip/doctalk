import { afterEach, describe, expect, it, vi } from "vitest";

describe("getDb", () => {
  const originalUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalUrl;
    }
    vi.resetModules();
  });

  it("imports without DATABASE_URL", async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    await expect(import("@/db")).resolves.toHaveProperty("getDb");
  });

  it("throws when a query is attempted without DATABASE_URL", async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    const { getDb } = await import("@/db");

    expect(() => {
      getDb();
    }).toThrow("DATABASE_URL is not set");
  });
});
