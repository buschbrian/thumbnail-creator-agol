import { describe, expect, it } from "vitest";
import { buildFilename, slugify } from "./filename";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("My Cool Map")).toBe("my-cool-map");
  });

  it("collapses punctuation runs", () => {
    expect(slugify("Trails & Trails -- 2024!")).toBe("trails-trails-2024");
  });

  it("strips leading and trailing separators", () => {
    expect(slugify("  --Weird title--  ")).toBe("weird-title");
  });

  it("falls back to thumbnail for empty input", () => {
    expect(slugify("")).toBe("thumbnail");
    expect(slugify("///")).toBe("thumbnail");
  });

  it("caps length at 60 characters", () => {
    const long = "x".repeat(200);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe("buildFilename", () => {
  it("builds size-suffixed filenames", () => {
    expect(buildFilename("My Cool Map!", 600, 400, "png")).toBe(
      "my-cool-map_600x400.png",
    );
  });

  it("supports jpeg extension", () => {
    expect(buildFilename("Test", 400, 400, "jpeg")).toBe("test_400x400.jpeg");
  });
});
