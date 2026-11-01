import { apiError } from "../api-helpers";
/** Bound bytes and time before authentication/database or provider work. */
export async function boundedJson(
  req: Request,
  maxBytes: number,
): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return {
      ok: false,
      response: apiError("validation_error", "Send a JSON request.", 415),
    };
  const length = req.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes))
    return {
      ok: false,
      response: apiError(
        "request_too_large",
        "This request is too large. Shorten it and try again; human help remains available.",
        413,
      ),
    };
  if (!req.body)
    return {
      ok: false,
      response: apiError("invalid_json", "No request body was provided.", 400),
    };
  const reader = req.body.getReader(),
    chunks: Uint8Array[] = [];
  let total = 0,
    interrupted = req.signal.aborted;
  const abort = () => {
    interrupted = true;
    void reader.cancel().catch(() => {});
  };
  req.signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 5000);
  try {
    if (interrupted) throw new Error();
    while (true) {
      const { done, value } = await reader.read();
      if (interrupted) throw new Error();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return {
          ok: false,
          response: apiError(
            "request_too_large",
            "This request is too large. Shorten it and try again; human help remains available.",
            413,
          ),
        };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return {
      ok: true,
      data: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    };
  } catch {
    return {
      ok: false,
      response: apiError(
        interrupted ? "request_timeout" : "invalid_json",
        "The request could not be read. Retry when your connection is ready; human help remains available.",
        interrupted ? 408 : 400,
      ),
    };
  } finally {
    clearTimeout(timer);
    req.signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}
