import { useCallback, useRef, useState } from "react";
import {
  fileToLogoDataUrl,
  extractThemeFromSrc,
} from "../brand/image";
import {
  parseColorSpecs,
  tryParseBrandKit,
} from "../brand/parseColors";
import { useBrandStore } from "../brand/brandStore";
import type { BrandKitFile } from "../brand/types";
import { useDomEvents } from "../hooks/useDomEvents";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";

const COLOR_FILE_ACCEPT =
  ".json,.css,.scss,.txt,.gpl,.brandkit.json,application/json,text/css,text/plain";

function downloadBrandKit(): void {
  const state = useBrandStore.getState();
  const payload: BrandKitFile = {
    format: "thumbnail-maker-brandkit",
    version: 1,
    name: state.name || undefined,
    colors: state.colors,
    logo: state.logo,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${(state.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "brand"}-kit.brandkit.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BrandPanel() {
  const name = useBrandStore((s) => s.name);
  const logo = useBrandStore((s) => s.logo);
  const colors = useBrandStore((s) => s.colors);

  const [importMode, setImportMode] = useState<"replace" | "append">("append");
  const [pasteText, setPasteText] = useState("");
  const [extractFromLogo, setExtractFromLogo] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const logoFileRef = useRef<HTMLInputElement>(null);
  const colorFileRef = useRef<HTMLInputElement>(null);
  const clearTimer = useRef<number | undefined>(undefined);

  const nameRef = useDomEvents([
    [
      "calciteInputTextInput",
      (e) => useBrandStore.getState().setName((e.target as HTMLInputElement).value),
    ],
  ]);
  const modeRef = useDomEvents([
    [
      "calciteSegmentedControlChange",
      (e) =>
        setImportMode(
          (e.target as HTMLInputElement).value === "replace"
            ? "replace"
            : "append",
        ),
    ],
  ]);
  const pasteRef = useDomEvents([
    [
      "calciteTextAreaInput",
      (e) => setPasteText((e.target as HTMLTextAreaElement).value),
    ],
  ]);
  const extractSwitchRef = useDomEvents([
    [
      "calciteSwitchChange",
      (e) => setExtractFromLogo((e.target as HTMLInputElement).checked),
    ],
  ]);

  const onLogoFile = useCallback(async (file: File): Promise<void> => {
    const pushAlert = useUIStore.getState().pushAlert;
    try {
      const stored = await fileToLogoDataUrl(file);
      useBrandStore.getState().setLogo(stored);
      let message = "Brand logo saved (persists between sessions).";
      if (extractFromLogo) {
        try {
          const extracted = await extractThemeFromSrc(stored.src);
          const added = useBrandStore
            .getState()
            .importColors(extracted, "append");
          message +=
            added > 0
              ? ` Extracted ${added} new color${added === 1 ? "" : "s"} from it.`
              : " No additional colors were found beyond your palette.";
        } catch {
          /* extraction is best-effort */
        }
      }
      pushAlert("success", "Logo imported", message);
    } catch (error) {
      pushAlert("danger", "Logo import failed", (error as Error).message);
    }
  }, [extractFromLogo]);

  const applyColorText = useCallback((text: string, sourceLabel: string): void => {
    const pushAlert = useUIStore.getState().pushAlert;
    const kit = tryParseBrandKit(text);
    if (kit) {
      const store = useBrandStore.getState();
      if (kit.name) store.setName(kit.name);
      if (kit.logo !== undefined) store.setLogo(kit.logo);
      const added = store.importColors(kit.colors, "replace");
      pushAlert(
        "success",
        "Brand kit imported",
        `"${kit.name || "Untitled kit"}" · ${added} colors applied.`,
      );
      return;
    }
    const parsed = parseColorSpecs(text);
    if (parsed.length === 0) {
      pushAlert("warning", `No colors found in ${sourceLabel}`, "Supported: hex lists, rgb(), CSS/SCSS variables, JSON palettes, GIMP .gpl, Coolors URLs.");
      return;
    }
    const added = useBrandStore.getState().importColors(parsed, importMode);
    pushAlert(
      "success",
      `${added} color${added === 1 ? "" : "s"} imported`,
      importMode === "replace"
        ? "Palette replaced."
        : "Added to your existing palette.",
    );
  }, [importMode]);

  const onColorFile = useCallback(async (file: File): Promise<void> => {
    const pushAlert = useUIStore.getState().pushAlert;
    try {
      applyColorText(await file.text(), `"${file.name}"`);
    } catch (error) {
      pushAlert("danger", "Could not read file", (error as Error).message);
    }
  }, [applyColorText]);

  const onClearAll = useCallback((): void => {
    if (!confirmClear) {
      setConfirmClear(true);
      window.clearTimeout(clearTimer.current);
      clearTimer.current = window.setTimeout(() => setConfirmClear(false), 2600);
      return;
    }
    window.clearTimeout(clearTimer.current);
    setConfirmClear(false);
    useBrandStore.getState().clearAll();
    useUIStore.getState().pushAlert("info", "Brand kit cleared");
  }, [confirmClear]);

  return (
    <div className="tab-body brand-panel">
      <h3 className="section-title">
        Organization brand
        <span className="section-hint">saved automatically</span>
      </h3>

      <div className="field">
        <span className="field-label">Kit name</span>
        <calcite-input-text
          ref={nameRef}
          scale="s"
          value={name}
          placeholder="Acme Design System"
          aria-label="Brand kit name"
          max-length={60}
        />
      </div>

      <h3 className="section-title section-title-gap">Logo</h3>
      {logo ? (
        <div className="brand-logo-preview">
          <img src={logo.src} alt="Brand logo preview" />
          <small>
            {logo.width} × {logo.height} px
          </small>
        </div>
      ) : null}
      <div className="field-row brand-action-stack">
        <input
          ref={logoFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const input = event.target;
            const file = input.files?.[0];
            input.value = "";
            if (file) void onLogoFile(file);
          }}
        />
        <calcite-button
          scale="s"
          appearance="outline-fill"
          icon-start="upload"
          width="full"
          onClick={() => logoFileRef.current?.click()}
        >
          {logo ? "Replace logo" : "Upload logo"}
        </calcite-button>
        {logo ? (
          <>
            <calcite-button
              scale="s"
              kind="brand"
              icon-start="plus"
              aria-label="Add brand logo to canvas"
              onClick={() =>
                useEditorStore
                  .getState()
                  .addLogo(logo.src, logo.width, logo.height)
              }
            >
              Add to canvas
            </calcite-button>
            <calcite-button
              scale="s"
              kind="danger"
              appearance="transparent"
              icon-start="trash"
              aria-label="Remove brand logo"
              onClick={() => useBrandStore.getState().setLogo(null)}
            />
          </>
        ) : null}
      </div>
      <div className="field switch-field brand-extract-switch">
        <span className="field-label">Extract theme from logo</span>
        <calcite-switch
          ref={extractSwitchRef}
          scale="s"
          checked={extractFromLogo}
          aria-label="Extract theme colors from imported logo"
        />
      </div>

      <h3 className="section-title section-title-gap">Import colors</h3>
      <calcite-segmented-control
        ref={modeRef}
        scale="s"
        value={importMode}
        aria-label="Import mode"
        width="full"
      >
        <calcite-segmented-control-item value="append" label="Append mode">
          Append
        </calcite-segmented-control-item>
        <calcite-segmented-control-item value="replace" label="Replace mode">
          Replace palette
        </calcite-segmented-control-item>
      </calcite-segmented-control>
      <div className="field-row brand-import-row">
        <input
          ref={colorFileRef}
          type="file"
          accept={COLOR_FILE_ACCEPT}
          hidden
          onChange={(event) => {
            const input = event.target;
            const file = input.files?.[0];
            input.value = "";
            if (file) void onColorFile(file);
          }}
        />
        <calcite-button
          scale="s"
          appearance="outline-fill"
          icon-start="file"
          width="full"
          onClick={() => colorFileRef.current?.click()}
        >
          Choose spec file…
        </calcite-button>
      </div>
      <calcite-text-area
        ref={pasteRef}
        scale="s"
        className="brand-paste"
        placeholder={"Or paste specs:\n--primary: #004da8;\n$accent: #e8400d;\n#b7efb2"}
        aria-label="Paste color specifications"
        value={pasteText}
      />
      <calcite-button
        scale="s"
        appearance="outline-fill"
        width="full"
        disabled={!pasteText.trim()}
        onClick={() => {
          applyColorText(pasteText, "pasted text");
          setPasteText("");
        }}
      >
        Import pasted colors
      </calcite-button>

      <h3 className="section-title section-title-gap">
        Palette
        <span className="section-hint">{colors.length} colors · click to set canvas</span>
      </h3>
      {colors.length > 0 ? (
        <div className="brand-swatches">
          {colors.map((color, index) => (
            <div key={`${color.hex}-${index}`} className="brand-swatch">
              <button
                type="button"
                className="brand-swatch-color"
                style={{ background: color.hex }}
                title={`Set canvas background to ${color.hex}`}
                aria-label={`Set canvas background to ${color.name ?? color.hex}`}
                onClick={() =>
                  useEditorStore.getState().setBackgroundColor(color.hex)
                }
              />
              <button
                type="button"
                className="brand-swatch-label"
                title={
                  color.name
                    ? `${color.name} · ${color.hex}`
                    : color.hex
                }
                onClick={() =>
                  useEditorStore.getState().setBackgroundColor(color.hex)
                }
              >
                {color.name ?? color.hex.toUpperCase()}
              </button>
              <button
                type="button"
                className="brand-swatch-remove"
                aria-label={`Remove ${color.name ?? color.hex} from palette`}
                onClick={() => useBrandStore.getState().removeColor(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="field-hint">
          Import a logo or color spec file and your organization's palette will
          appear across every color picker in the app.
        </p>
      )}

      <h3 className="section-title section-title-gap">Share kit</h3>
      <div className="field-row brand-action-stack">
        <calcite-button
          scale="s"
          appearance="outline-fill"
          icon-start="download"
          width="full"
          disabled={!name && colors.length === 0 && !logo}
          onClick={downloadBrandKit}
        >
          Export .brandkit.json
        </calcite-button>
        <calcite-button
          scale="s"
          kind="danger"
          width="full"
          appearance={confirmClear ? "solid" : "transparent"}
          onClick={onClearAll}
        >
          {confirmClear ? "Confirm?" : "Clear all"}
        </calcite-button>
      </div>
    </div>
  );
}
