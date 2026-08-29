import { describe, expect, it, vi } from "vitest";
import type { DesignState } from "../state/types";
import {
  ProjectExportConfirmationRequiredError,
  downloadPreparedProject,
  prepareProjectExport,
} from "./exportProject";

const SAFE_JPEG = "data:image/jpeg;base64,/9j/2Q==";

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

function designWithImages(): DesignState {
  return {
    doc: { width: 600, height: 400, title: "Public trails" },
    backgroundColor: "#efece7",
    layers: [
      {
        id: "bg-1",
        name: "Background image",
        type: "backgroundImage",
        src: "blob:background-photo",
        fit: "cover",
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
      },
      {
        id: "logo-1",
        name: "Uploaded logo",
        type: "logo",
        src: "blob:foreground-logo",
        x: 500,
        y: 320,
        width: 64,
        height: 40,
        opacity: 1,
        visible: true,
      },
      {
        id: "logo-2",
        name: "Brand kit logo",
        type: "logo",
        src: SAFE_JPEG,
        x: 24,
        y: 320,
        width: 64,
        height: 40,
        opacity: 1,
        visible: true,
      },
    ],
  };
}

describe("portable project export", () => {
  it("embeds blob-backed PNG/JPEG assets without mutating editor data", async () => {
    const design = designWithImages();
    const before = structuredClone(design);

    const prepared = await prepareProjectExport(design, {
      fetchObjectUrl: async (src) =>
        src.includes("background")
          ? new Blob([PNG_BYTES], { type: "image/png" })
          : new Blob([JPEG_BYTES], { type: "image/jpeg" }),
    });

    expect(prepared.snapshot.format).toBe("thumbnail-maker-design");
    expect(prepared.snapshot.version).toBe(1);
    expect(prepared.json).not.toContain("blob:");
    expect(prepared.snapshot.layers[0]).toMatchObject({
      src: expect.stringMatching(/^data:image\/png;base64,/),
    });
    expect(prepared.snapshot.layers[1]).toMatchObject({
      src: expect.stringMatching(/^data:image\/jpeg;base64,/),
    });
    expect(prepared.snapshot.layers[2]).toMatchObject({ src: SAFE_JPEG });
    expect(JSON.parse(prepared.json)).toEqual(prepared.snapshot);
    expect(design).toEqual(before);
    expect(prepared.snapshot.layers).not.toBe(design.layers);
  });

  it("rejects non-local image sources instead of fetching arbitrary URLs", async () => {
    const design = designWithImages();
    if (design.layers[0].type !== "backgroundImage") throw new Error("bad fixture");
    design.layers[0].src = "https://example.com/tracking.png";
    const fetchObjectUrl = vi.fn<(src: string) => Promise<Blob>>();

    await expect(
      prepareProjectExport(design, { fetchObjectUrl }),
    ).rejects.toThrow("Background image");
    expect(fetchObjectUrl).not.toHaveBeenCalled();
  });

  it("rejects blob content that is not a supported raster image", async () => {
    await expect(
      prepareProjectExport(designWithImages(), {
        fetchObjectUrl: async () =>
          new Blob(["<svg><script>alert(1)</script></svg>"], {
            type: "image/svg+xml",
          }),
      }),
    ).rejects.toThrow("PNG, JPEG, or WebP");
  });

  it("requires explicit confirmation before downloading a large project", async () => {
    const prepared = await prepareProjectExport(
      {
        doc: { width: 600, height: 400, title: "Large field survey" },
        backgroundColor: "#ffffff",
        layers: [],
      },
      { warningBytes: 1 },
    );
    const download = vi.fn<(blob: Blob, filename: string) => void>();

    expect(prepared.warnings).toHaveLength(1);
    expect(() => downloadPreparedProject(prepared, { download })).toThrow(
      ProjectExportConfirmationRequiredError,
    );
    expect(download).not.toHaveBeenCalled();

    downloadPreparedProject(prepared, { download, acceptWarnings: true });
    expect(download).toHaveBeenCalledOnce();
    expect(download.mock.calls[0][0].type).toBe("application/json");
    expect(download.mock.calls[0][1]).toBe("large-field-survey.thumbnail.json");
  });
});
