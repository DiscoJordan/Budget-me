import { parseNumber } from "../utils/parseNumber";

describe("parseNumber", () => {
  it("parses comma as decimal separator", () => {
    expect(parseNumber("0,11")).toBe(0.11);
  });

  it("parses dot as decimal separator", () => {
    expect(parseNumber("0.11")).toBe(0.11);
  });

  it("returns 0 for empty string", () => {
    expect(parseNumber("")).toBe(0);
  });

  it("returns 0 for non-numeric string", () => {
    expect(parseNumber("abc")).toBe(0);
  });

  it("passes through numbers", () => {
    expect(parseNumber(42)).toBe(42);
  });

  it("handles larger comma numbers", () => {
    expect(parseNumber("1234,56")).toBe(1234.56);
  });
});
