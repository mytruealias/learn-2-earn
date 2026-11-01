/** Quote every cell. Neutralize formula prefixes even after whitespace/control characters. */
export function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value !== "number" && /^[\s\u0000-\u001f]*[=+@-]/.test(text))
    text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export const csvText = (rows: unknown[][]) =>
  "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
