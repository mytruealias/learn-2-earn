import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { siteOrigin, configuredRootDomain } from "@/lib/site-identity";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { inquirySchema, inquiryConfiguration } from "@/lib/marketing/inquiries";
import { sameOriginError } from "@/lib/request-origin";
import CardRenderer from "@/app/lesson/[lessonId]/CardRenderers";
import { adaptCard, evaluate } from "@/lib/lesson/cards";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";
afterEach(() => vi.unstubAllEnvs());
describe("partner website factual metadata and shared UI", () => {
  it("has no invented fallback domain and rejects credentials/paths/protocol mismatches", () => {
    expect(siteOrigin({})).toBeNull();
    for (const raw of [
      "http://site.example",
      "https://person:secret@site.example",
      "https://site.example/other",
      "https://site.example?x=1",
    ])
      expect(siteOrigin({ NEXT_PUBLIC_SITE_URL: raw })).toBeNull();
    expect(siteOrigin({ ROOT_DOMAIN: "site.example" })).toBe(
      "https://site.example",
    );
    expect(
      siteOrigin({
        ROOT_DOMAIN: "site.example",
        NEXT_PUBLIC_SITE_URL: "https://other.example",
      }),
    ).toBeNull();
    expect(
      configuredRootDomain({ ROOT_DOMAIN: "evil.example/path" }),
    ).toBeNull();
  });
  it("limits indexing and sitemap to configured public pages, including no gated city decks", () => {
    vi.stubEnv("ROOT_DOMAIN", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(sitemap()).toEqual([]);
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(marketingMetadata("Test", "/").alternates).toBeUndefined();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example");
    expect(sitemap().map((x) => x.url)).toEqual([
      "https://site.example/",
      "https://site.example/demo",
      "https://site.example/privacy",
      "https://site.example/terms",
    ]);
    expect(
      marketingMetadata("City", "/austin", "Private", true).robots,
    ).toMatchObject({ index: false });
    expect(marketingMetadata("Demo", "/demo").alternates?.canonical).toBe(
      "https://site.example/demo",
    );
  });
  it("routes public demo/legal/OG to the same root and leaves city access gated", async () => {
    vi.stubEnv("ROOT_DOMAIN", "site.example");
    const r = await middleware(
      new NextRequest("https://app.site.example/demo", {
        headers: { host: "app.site.example" },
      }),
    );
    expect(r.status).toBe(301);
    expect(r.headers.get("location")).toBe("https://site.example/demo");
    const city = await middleware(
      new NextRequest("https://site.example/austin", {
        headers: { host: "site.example" },
      }),
    );
    expect(city.headers.get("location")).toContain("/austin/unlock");
    expect(
      (
        await middleware(
          new NextRequest("https://site.example/demo", {
            headers: { host: "site.example" },
          }),
        )
      ).headers.get("location"),
    ).toBeNull();
  });
  it("uses the actual card adapter/evaluator and preserves default lesson heading semantics", () => {
    const a = adaptCard({
      id: "fictional",
      type: "MULTIPLE_CHOICE",
      prompt: "Synthetic sample question",
      choicesJson: '["One small action","Everything at once"]',
      answerJson: '"One small action"',
      explain: "Synthetic explanation",
    });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(evaluate(a.card, { kind: "choice", choice: 0 })?.correct).toBe(true);
    const props = {
      card: a.card.public,
      selected: null,
      onSelect: () => {},
      disabled: false,
    };
    expect(renderToStaticMarkup(createElement(CardRenderer, props))).toContain(
      '<h1 id="card-prompt"',
    );
    expect(
      renderToStaticMarkup(
        createElement(CardRenderer, { ...props, headingLevel: 3 }),
      ),
    ).toContain('<h3 id="card-prompt"');
  });
  it("requires reviewed intake routing, minimal validated fields and explicit consent", () => {
    expect(inquiryConfiguration({})).toBeNull();
    expect(
      inquirySchema.safeParse({
        requestKey: crypto.randomUUID(),
        fullName: "Synthetic contact",
        organization: "Synthetic organization",
        email: "person@example.test",
        interest: "pilot",
        consent: true,
      }).success,
    ).toBe(true);
    for (const extra of [
      { consent: false },
      { programId: "other-program" },
      { email: "invalid" },
      { message: "x".repeat(1001) },
    ])
      expect(
        inquirySchema.safeParse({
          requestKey: crypto.randomUUID(),
          fullName: "Synthetic contact",
          organization: "Synthetic organization",
          email: "person@example.test",
          interest: "pilot",
          consent: true,
          ...extra,
        }).success,
      ).toBe(false);
  });
  it("keeps shared mutation origin checks independent of database initialization", () => {
    expect(
      sameOriginError(
        new Request("https://site.example/api/partner-inquiries", {
          headers: { origin: "https://evil.example" },
        }),
      )?.status,
    ).toBe(403);
    expect(
      sameOriginError(
        new Request("https://site.example/api/partner-inquiries", {
          headers: { origin: "https://site.example" },
        }),
      ),
    ).toBeNull();
  });
});
