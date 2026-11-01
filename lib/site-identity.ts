/** One server/Edge-safe URL contract. No guessed deployment domain. */
export function configuredRootDomain(
  env: Record<string, string | undefined> = process.env,
) {
  const value = env.ROOT_DOMAIN?.trim().toLowerCase();
  return value &&
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(value)
    ? value
    : null;
}
export function siteOrigin(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const root = configuredRootDomain(env),
    raw = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env.ROOT_DOMAIN && !root) return null;
  if (!raw) return root ? `https://${root}` : null;
  try {
    const u = new URL(raw);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.port ||
      u.pathname !== "/" ||
      u.search ||
      u.hash ||
      !u.hostname.includes(".")
    )
      return null;
    if (root && u.hostname !== root) return null;
    return u.origin;
  } catch {
    return null;
  }
}
