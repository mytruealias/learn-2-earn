/** Bound bytes and time before authentication/database or provider work. */
export async function readRequestJson(req: Request, maxBytes: number, requireContentType = true): Promise<{
    ok: true;
    data: unknown;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        status: number;
    };
}> {
    if (requireContentType && !req.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json"))
        return {
            ok: false,
            error: { code: "validation_error", message: "Send a JSON request.", status: 415 },
        };
    const length = req.headers.get("content-length");
    if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes))
        return {
            ok: false,
            error: { code: "request_too_large", message: "This request is too large. Shorten it and try again; human help remains available.", status: 413 },
        };
    if (!req.body)
        return {
            ok: false,
            error: { code: "invalid_json", message: "No request body was provided.", status: 400 },
        };
    const reader = req.body.getReader(), chunks: Uint8Array[] = [];
    let total = 0, interrupted = req.signal.aborted;
    const abort = () => {
        interrupted = true;
        void reader.cancel().catch(() => { });
    };
    req.signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 5000);
    try {
        if (interrupted)
            throw new Error();
        while (true) {
            const { done, value } = await reader.read();
            if (interrupted)
                throw new Error();
            if (done)
                break;
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel().catch(() => { });
                return {
                    ok: false,
                    error: { code: "request_too_large", message: "This request is too large. Shorten it and try again; human help remains available.", status: 413 },
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
    }
    catch {
        return {
            ok: false,
            error: { code: interrupted ? "request_timeout" : "invalid_json", message: "The request could not be read. Retry when your connection is ready; human help remains available.", status: interrupted ? 408 : 400 },
        };
    }
    finally {
        clearTimeout(timer);
        req.signal.removeEventListener("abort", abort);
        reader.releaseLock();
    }
}
