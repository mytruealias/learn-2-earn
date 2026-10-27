// Exact nonnegative USD arithmetic. No floating-point multiplication is used.
export const MAX_CENTS = 2_147_483_647;
export function fraction(rate: string) {
  const m = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(rate);
  if (!m || rate.length > 100) throw new Error("Invalid exact amount");
  const scale = (m[2]?.length || 0) - Number(m[3] || 0);
  if (Math.abs(scale) > 40)
    throw new Error(
      "Amount precision is unsupported; operator review required",
    );
  const digits = BigInt(m[1] + (m[2] || ""));
  return scale >= 0
    ? { n: digits, d: 10n ** BigInt(scale) }
    : { n: digits * 10n ** BigInt(-scale), d: 1n };
}
export function exactCents(xp: number, rate: string) {
  if (!Number.isSafeInteger(xp) || xp < 0) throw new Error("Invalid XP");
  const { n, d } = fraction(rate),
    scaled = BigInt(xp) * n * 100n;
  return (2n * scaled + d) / (2n * d);
}
export function centsForXp(xp: number, rate: string) {
  const cents = exactCents(xp, rate);
  if (cents > BigInt(MAX_CENTS))
    throw new Error(
      "Amount exceeds the exact per-request storage range. Choose a smaller request.",
    );
  return Number(cents);
}
export function legacyCents(dollars: number) {
  if (!Number.isFinite(dollars) || dollars < 0)
    throw new Error("Invalid legacy amount");
  return centsForXp(1, String(dollars));
}
export function usd(cents: number | string | bigint) {
  const n = BigInt(cents);
  const sign = n < 0n ? "-" : "";
  const a = n < 0n ? -n : n;
  return `${sign}$${(a / 100n).toLocaleString("en-US")}.${(a % 100n).toString().padStart(2, "0")}`;
}
export function sumCents(values: (number | null)[]) {
  if (values.some((v) => v === null)) return null;
  return values.reduce<bigint>((sum, v) => sum + BigInt(v!), 0n).toString();
}
export const methodDefinitions = {
  venmo: {
    label: "Venmo",
    instruction:
      "Your Venmo username. Staff sends payment manually after approval.",
  },
  paypal: {
    label: "PayPal",
    instruction:
      "Your PayPal account email or username. Staff sends payment manually after approval.",
  },
  cashapp: {
    label: "Cash App",
    instruction:
      "Your Cash App $cashtag. Staff sends payment manually after approval.",
  },
  check: {
    label: "Check",
    instruction:
      "Payee name and mailing address. Staff issues a check manually after approval.",
  },
  zelle: {
    label: "Zelle",
    instruction:
      "An email or phone number enrolled with Zelle. Authorized staff uses their bank outside Learn2Earn; this site does not send Zelle payments.",
  },
} as const;
export type RewardMethod = keyof typeof methodDefinitions;
export const legacyMethods: RewardMethod[] = [
  "venmo",
  "paypal",
  "cashapp",
  "check",
];
export function maskHandle(handle: string | null) {
  return handle ? `••••${handle.slice(-2)}` : "Not recorded";
}

/** Exact sum of recorded decimal dollar strings, for reconciliation rather than pricing. */
export function sumDecimals(values: string[]) {
  const parts = values.map(fraction),
    denominator = parts.reduce((d, p) => (p.d > d ? p.d : d), 1n);
  const numerator = parts.reduce((n, p) => n + p.n * (denominator / p.d), 0n);
  if (denominator === 1n) return numerator.toString();
  const digits = denominator.toString().length - 1;
  const tail = (numerator % denominator)
    .toString()
    .padStart(digits, "0")
    .replace(/0+$/, "");
  return `${numerator / denominator}${tail ? "." + tail : ""}`;
}
