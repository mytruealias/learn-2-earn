// Edge-compatible policy shared by middleware and Node session verification.
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const USER_COOKIE = "l2e_user_session";
export function parseSessionPayload(payload: string, now = Date.now()) {
  const parts = payload.split(":");
  const modern = parts[0] === "user";
  if (
    modern
      ? parts.length !== 4 || !/^[a-f0-9]{64}$/.test(parts[3])
      : parts.length !== 2
  )
    return null;
  const id = parts[modern ? 1 : 0];
  const rawTime = parts[modern ? 2 : 1];
  if (
    !/^[a-zA-Z0-9_-]{1,120}$/.test(id) ||
    rawTime.length !== 13 ||
    !/^\d{13}$/.test(rawTime)
  )
    return null;
  const time = Number(rawTime);
  if (time > now + 60_000 || now - time >= SESSION_SECONDS * 1000) return null;
  return { id, issuedAt: time, legacy: !modern };
}
