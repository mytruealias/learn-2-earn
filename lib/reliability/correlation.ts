/** Opaque identifiers only; never propagate caller text as a log field. */
export const REQUEST_ID_HEADER = "x-l2e-request-id";
export function validRequestId(value: unknown): value is string {
    return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}
export function newRequestId() {
    return crypto.randomUUID().replaceAll("-", "");
}
export function requestIdFrom(value: unknown) {
    return validRequestId(value) ? value : newRequestId();
}
