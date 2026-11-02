"use client";
import { clientFetch } from "./reliability/client-fetch";
let memoryScope: string | null = null;
export function setStaffProgramHint(programId: string | null) {
  memoryScope = programId;
  try {
    if (programId) sessionStorage.setItem("l2e-active-program", programId);
    else sessionStorage.removeItem("l2e-active-program");
  } catch {
    /* Private/restricted storage can use the server-verified in-memory hint. */
  }
}
/** The hint prevents stale tabs/forms using a newly selected program. It grants no authority. */
export function staffFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  let programId = memoryScope;
  try {
    programId = sessionStorage.getItem("l2e-active-program") || programId;
  } catch {
    /* Storage is optional. */
  }
  if (programId) headers.set("x-l2e-program", programId);
  return clientFetch(input, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}
