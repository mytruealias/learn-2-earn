import type { Instrumentation } from "next";
import { operationalEvent } from "./lib/reliability/events";
import { REQUEST_ID_HEADER } from "./lib/reliability/correlation";
/** Framework failures: no error message, stack, cookies, URL/query or participant context. */
export const onRequestError: Instrumentation.onRequestError = (_error, request, context) => {
    operationalEvent("render_failure", request.headers[REQUEST_ID_HEADER], context.routePath);
};
