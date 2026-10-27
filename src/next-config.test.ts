import { describe, expect, it } from "vitest";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "../next.config.mjs";

async function cacheControlFor(pathname: string) {
  const rules = (await (nextConfig as { headers?: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>> }).headers?.()) ?? [];
  const values = rules
    .filter((rule: { source: string }) => getPathMatch(rule.source, { strict: true })(pathname))
    .flatMap((rule: { headers: Array<{ key: string; value: string }> }) => rule.headers)
    .filter((header: { key: string }) => header.key.toLowerCase() === "cache-control")
    .map((header: { value: string }) => header.value);
  return values.at(-1);
}

describe("next.config Cache-Control", () => {
  it.each(["/", "/login", "/signup", "/dashboard", "/inbox/123", "/settings/team", "/join/abc"])(
    "keeps %s out of shared caches",
    async (pathname) => {
      const value = await cacheControlFor(pathname);
      expect(value).toBe("private, no-store");
      expect(value).not.toMatch(/public|s-maxage|stale-while-revalidate/);
    },
  );

  it("sends no-store on API routes", async () => {
    expect(await cacheControlFor("/api/whatsapp/templates")).toBe("no-store");
  });

  it.each(["/_next/static/chunks/app.js", "/_next/image"])(
    "leaves %s to Next's own caching",
    async (pathname) => {
      expect(await cacheControlFor(pathname)).toBeUndefined();
    },
  );
});
