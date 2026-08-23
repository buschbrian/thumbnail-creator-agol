import { describe, expect, it } from "vitest";
import { validateDimensions } from "./validation";

describe("validateDimensions", () => {
  it("passes preset sizes without warnings", () => {
    expect(validateDimensions(600, 400)).toEqual([]);
    expect(validateDimensions(400, 400)).toEqual([]);
    expect(validateDimensions(1200, 800)).toEqual([]);
  });

  it("warns on unusual sizes", () => {
    const codes = validateDimensions(613, 401).map((w) => w.code);
    expect(codes).toContain("UNCOMMON_SIZE");
  });

  it("warns on extreme aspect ratios", () => {
    const codes = validateDimensions(2400, 600).map((w) => w.code);
    expect(codes).toContain("EXTREME_ASPECT");

    const tallCodes = validateDimensions(300, 1200).map((w) => w.code);
    expect(tallCodes).toContain("EXTREME_ASPECT");
  });

  it("warns when very small", () => {
    const codes = validateDimensions(150, 100).map((w) => w.code);
    expect(codes).toContain("VERY_SMALL");
  });

  it("warns when very large", () => {
    const codes = validateDimensions(5000, 3333).map((w) => w.code);
    expect(codes).toContain("VERY_LARGE");
  });
});
