import { apiError } from "../api-helpers";
import { readRequestJson } from "../reliability/read-json";
/** Bound bytes and time before authentication/database or provider work. */
export async function boundedJson(req: Request, maxBytes: number): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  const result = await readRequestJson(req, maxBytes);
  return result.ok ? result : { ok: false, response: apiError(result.error.code, result.error.message, result.error.status) };
}
