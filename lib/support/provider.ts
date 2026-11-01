import OpenAI from "openai";
/** No SDK body/error logging, automatic retries, private-record tools or caller-selected provider. */
export function supportProvider() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    timeout: 20000,
    maxRetries: 0,
    logLevel: "off",
  });
}
export function requestCancellation(req: Request, milliseconds = 30000) {
  const controller = new AbortController(),
    abort = () => controller.abort();
  if (req.signal.aborted) abort();
  else req.signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, milliseconds);
  return {
    controller,
    cleanup() {
      clearTimeout(timer);
      req.signal.removeEventListener("abort", abort);
    },
  };
}
