import { describe, it, expect } from "vitest";
import { Secret, TOTP } from "otpauth";
import {
  authenticator,
  encryptMfa,
  decryptMfa,
  recoveryHash,
  newRecoveryCodes,
} from "../../lib/staff-security";
import { csvText } from "../../lib/staff/csv";
describe("staff authentication standards and exports", () => {
  it("matches RFC 6238 SHA-1 vectors and the six-digit authenticator adapter", () => {
    const secret = Secret.fromUTF8("12345678901234567890"),
      totp = new TOTP({ algorithm: "SHA1", digits: 8, period: 30, secret });
    for (const [seconds, expected] of [
      [59, "94287082"],
      [1111111109, "07081804"],
      [1111111111, "14050471"],
      [1234567890, "89005924"],
      [2000000000, "69279037"],
      [20000000000, "65353130"],
    ] as const)
      expect(totp.generate({ timestamp: seconds * 1000 })).toBe(expected);
    expect(authenticator(secret.base32).generate({ timestamp: 59000 })).toBe(
      "287082",
    );
  });
  it("encrypts secrets with identity-bound authenticated encryption and fails on tampering", () => {
    process.env.STAFF_MFA_ENCRYPTION_KEY = "ab".repeat(32);
    const key = authenticator().secret.base32,
      encrypted = encryptMfa(key, "synthetic-staff");
    expect(encrypted).not.toContain(key);
    expect(decryptMfa(encrypted, "synthetic-staff")).toBe(key);
    expect(() => decryptMfa(encrypted, "another-staff")).toThrow();
    expect(() =>
      decryptMfa(
        encrypted.slice(0, -2) + (encrypted.endsWith("ff") ? "00" : "ff"),
        "synthetic-staff",
      ),
    ).toThrow();
  });
  it("generates distinct high-entropy single-use recovery values with identity-bound hashes", () => {
    const codes = newRecoveryCodes();
    expect(new Set(codes).size).toBe(10);
    expect(codes.every((c) => /^[A-F0-9]{6}(?:-[A-F0-9]{6}){3}$/.test(c))).toBe(
      true,
    );
    expect(recoveryHash("a", codes[0])).not.toBe(recoveryHash("b", codes[0]));
  });
  it("neutralizes spreadsheet formulas after spaces/control characters and preserves exact trusted numeric fields", () => {
    const csv = csvText([
      [" =1+1", "\t@SUM(A1)", "\r-2+3", 'a,"b', 12, "9007199254740993"],
    ]);
    expect(csv).toContain('"\' =1+1"');
    expect(csv).toContain('"\'\t@SUM(A1)"');
    expect(csv).toContain('"\'\r-2+3"');
    expect(csv).toContain('"a,""b"');
    expect(csv).toContain('"9007199254740993"');
  });
});
