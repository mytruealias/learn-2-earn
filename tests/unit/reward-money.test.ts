import { describe, it, expect } from "vitest";
import {
  centsForXp,
  exactCents,
  legacyCents,
  usd,
  maskHandle,
  MAX_CENTS,
  sumDecimals,
} from "../../lib/rewards/money";
describe("exact reward money contract", () => {
  it("keeps existing economics and rounds only the request total half up", () => {
    expect(centsForXp(20, "0.05")).toBe(100);
    expect(centsForXp(3, "0.025")).toBe(8);
    expect(centsForXp(10, "0.333333333333333333333333")).toBe(333);
    expect(centsForXp(1, "5e-3")).toBe(1);
  });
  it("converts recorded legacy decimal amounts without repricing XP", () => {
    expect(legacyCents(1.005)).toBe(101);
    expect(legacyCents(0.145)).toBe(15);
    expect(legacyCents(3.2)).toBe(320);
    expect(sumDecimals(["1.005","2.105"])).toBe("3.11");
  });
  it("handles totals beyond a request range with exact integers and refuses storage overflow", () => {
    expect(exactCents(2147483647, "0.05")).toBe(10737418235n);
    expect(usd("10737418235")).toBe("$107,374,182.35");
    expect(() => centsForXp(MAX_CENTS, "1")).toThrow();
  });
  it("rejects negative, unsafe or malformed monetary inputs", () => {
    for (const r of ["-1", "NaN", "Infinity", "1e400", "0x10"])
      expect(() => centsForXp(1, r)).toThrow();
    expect(() => legacyCents(-1)).toThrow();
    expect(() => centsForXp(1.5, ".05")).toThrow();
  });
  it("masks payment contacts without exposing names, domains or addresses", () => {
    expect(maskHandle("private@example.test")).toBe("••••st");
    expect(maskHandle(null)).toBe("Not recorded");
  });
});
