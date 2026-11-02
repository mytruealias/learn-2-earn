import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const css = readFileSync("app/globals.css", "utf8");
const color = (name: string) =>
  css.match(new RegExp(`--l2e-${name}: (#[a-f0-9]{6});`))![1];
function luminance(hex: string) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(color(a)), luminance(color(b))].sort(
    (x, y) => y - x,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}
describe("semantic design colors", () => {
  it.each([
    "ink",
    "muted",
    "primary",
    "success",
    "milestone",
    "hubert",
    "danger",
  ])("%s text meets 4.5:1 on the canvas and surface", (foreground) => {
    expect(contrast(foreground, "canvas")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(foreground, "surface")).toBeGreaterThanOrEqual(4.5);
  });
  it.each([
    ["primary", "primary-soft"],
    ["success", "success-soft"],
    ["milestone", "milestone-soft"],
    ["hubert", "hubert-soft"],
    ["danger", "danger-soft"],
    ["on-color", "primary"],
    ["on-color", "primary-hover"],
  ])("%s on %s meets 4.5:1", (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
  it("focus and input boundaries meet 3:1 against adjacent surfaces", () => {
    for (const fg of ["focus", "control-border"])
      for (const bg of ["canvas", "surface"])
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
    expect(contrast("primary", "border")).toBeGreaterThanOrEqual(3);
    expect(contrast("muted", "surface-muted")).toBeGreaterThanOrEqual(4.5);
  });
});
