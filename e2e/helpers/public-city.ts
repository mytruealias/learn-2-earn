import { createHmac } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
export const publicTestSecret = "synthetic-public-browser-session-not-production";
/** Only the dedicated unusable-DB public test servers. This is a synthetic presentation fixture, not PIN/API verification. */
export async function syntheticCityAccess(context: BrowserContext, slug: string, port = 5055) {
    if (![5055, 5056].includes(port) || !["austin", "dallas", "houston", "denver", "los-angeles", "san-francisco"].includes(slug))
        throw new Error("Refusing non-test presentation credentials.");
    const payload = `${slug}-access:${Date.now()}`;
    const value = `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256", publicTestSecret).update(payload).digest("hex")}`;
    await context.addCookies([{ name: `l2e_${slug}_access`, value, url: `http://127.0.0.1:${port}`, httpOnly: true, sameSite: "Strict" }]);
}
