import { describe, expect, it } from "vitest";
import { TEMPLATES, findTemplate } from "./templates";

const DOC = { width: 600, height: 400, title: "Test" };

describe("templates", () => {
  it("has unique ids", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("finds templates by id", () => {
    expect(findTemplate("footer-dark")?.name).toBeTruthy();
    expect(findTemplate("missing")).toBeUndefined();
  });

  it("blank template produces no layers", () => {
    expect(findTemplate("blank")?.build(DOC)).toEqual([]);
  });

  it.each(TEMPLATES.map((t) => [t.id] as const))(
    "%s keeps every layer inside the document",
    (id) => {
      const template = findTemplate(id);
      if (!template || template.id === "blank") return;
      const drafts = template.build(DOC);
      expect(drafts.length).toBeGreaterThan(0);
      for (const draft of drafts) {
        expect(Number.isFinite(draft.x)).toBe(true);
        expect(Number.isFinite(draft.y)).toBe(true);
        expect(draft.x).toBeGreaterThanOrEqual(-1);
        expect(draft.y).toBeGreaterThanOrEqual(-1);
        if ("width" in draft && typeof draft.width === "number") {
          expect(draft.width).toBeLessThanOrEqual(DOC.width + 1);
        }
        if ("height" in draft && typeof draft.height === "number") {
          expect(draft.height).toBeLessThanOrEqual(DOC.height + 1);
        }
      }
    },
  );
});
