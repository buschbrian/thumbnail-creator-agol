import { useCallback, useRef, useState } from "react";
import { SIZE_PRESETS, matchingSizePreset } from "../presets/presets";
import { TEMPLATES } from "../templates/templates";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { useDomEvents } from "../hooks/useDomEvents";
import { ColorSwatch } from "./ColorSwatch";
import type { FitMode } from "../state/types";

function readFileAsImage(
  file: File,
): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error(`"${file.name}" is not an image file.`));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({ url, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read "${file.name}".`));
    };
    image.src = url;
  });
}

function TemplatePreview({ id }: { id: string }): React.ReactElement {
  switch (id) {
    case "footer-dark":
      return (
        <span className="tw" aria-hidden="true">
          <span className="tw-photo" />
          <span className="tw-rule tw-accent" />
          <span className="tw-band tw-dark">
            <i className="tw-line w60 light" />
            <i className="tw-line w35 light dim" />
          </span>
        </span>
      );
    case "footer-light":
      return (
        <span className="tw" aria-hidden="true">
          <span className="tw-photo" />
          <span className="tw-band tw-light-band">
            <i className="tw-edge" />
            <i className="tw-line w60 dark" />
            <i className="tw-line w35 dark dim" />
          </span>
        </span>
      );
    case "side-accent":
      return (
        <span className="tw" aria-hidden="true">
          <span className="tw-photo" />
          <span className="tw-bar-left" />
          <span className="tw-title-block">
            <i className="tw-line w70 light" />
            <i className="tw-line w45 light dim" />
          </span>
        </span>
      );
    case "top-banner-navy":
      return (
        <span className="tw" aria-hidden="true">
          <span className="tw-photo" />
          <span className="tw-band tw-top tw-navy">
            <i className="tw-line w55 light" />
            <i className="tw-line w30 light dim" />
          </span>
        </span>
      );
    case "corner-chip":
      return (
        <span className="tw" aria-hidden="true">
          <span className="tw-photo" />
          <span className="tw-chip">
            <i className="tw-line w80 light" />
            <i className="tw-line w50 light dim" />
          </span>
        </span>
      );
    default:
      return (
        <span className="tw tw-blank" aria-hidden="true">
          <span className="tw-dash" />
        </span>
      );
  }
}

export function LeftPanel() {
  const doc = useEditorStore((s) => s.doc);
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const layers = useEditorStore((s) => s.layers);
  const setSize = useEditorStore((s) => s.setSize);
  const setBackgroundColor = useEditorStore((s) => s.setBackgroundColor);
  const setBackgroundImage = useEditorStore((s) => s.setBackgroundImage);
  const removeBackgroundImage = useEditorStore((s) => s.removeBackgroundImage);
  const addText = useEditorStore((s) => s.addText);
  const addLogo = useEditorStore((s) => s.addLogo);
  const addRectangle = useEditorStore((s) => s.addRectangle);
  const applyTemplate = useEditorStore((s) => s.applyTemplate);

  const pushAlert = useUIStore((s) => s.pushAlert);
  const openIconPicker = useUIStore((s) => s.openIconPicker);

  const backgroundLayer = layers.find((l) => l.type === "backgroundImage");

  const [customWidth, setCustomWidth] = useState("800");
  const [customHeight, setCustomHeight] = useState("600");

  const bgFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const onBackgroundUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      try {
        const measured = await readFileAsImage(file);
        setBackgroundImage(measured.url);
      } catch (error) {
        pushAlert("danger", "Upload failed", (error as Error).message);
      }
    },
    [setBackgroundImage, pushAlert],
  );

  const onLogoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      try {
        const measured = await readFileAsImage(file);
        addLogo(measured.url, measured.width, measured.height);
      } catch (error) {
        pushAlert("danger", "Upload failed", (error as Error).message);
      }
    },
    [addLogo, pushAlert],
  );

  const customWidthRef = useDomEvents([
    [
      "calciteInputNumberInput",
      (event) => setCustomWidth((event.target as HTMLInputElement).value),
    ],
  ]);

  const customHeightRef = useDomEvents([
    [
      "calciteInputNumberInput",
      (event) => setCustomHeight((event.target as HTMLInputElement).value),
    ],
  ]);

  const bgFitRef = useDomEvents([
    [
      "calciteSelectChange",
      (event) => {
        if (backgroundLayer?.type !== "backgroundImage") return;
        const value = (event.target as unknown as { value: FitMode }).value;
        useEditorStore.getState().updateLayer(backgroundLayer.id, { fit: value });
      },
    ],
  ]);

  const activePresetId =
    matchingSizePreset(doc.width, doc.height)?.id ?? "custom";

  const applyCustomSize = (): void => {
    const width = Math.round(Number(customWidth));
    const height = Math.round(Number(customHeight));
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 50 ||
      height < 50
    ) {
      pushAlert(
        "warning",
        "Invalid size",
        "Enter a width and height of at least 50 pixels.",
      );
      return;
    }
    if (width > 8000 || height > 8000) {
      pushAlert(
        "warning",
        "Very large canvas",
        "Keep dimensions at or below 8000 pixels.",
      );
      return;
    }
    setSize(width, height);
  };

  return (
    <div className="panel-stack">
      <section className="panel-section" aria-label="Canvas size">
        <h3 className="section-title">Size</h3>
        <div role="radiogroup" aria-label="Canvas size preset" className="preset-grid">
          {SIZE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={activePresetId === preset.id}
              className={`preset-card${activePresetId === preset.id ? " is-active" : ""}`}
              onClick={() => setSize(preset.width, preset.height)}
              title={preset.description}
            >
              <span
                className={`preset-thumb${preset.id === "square" ? " is-square" : ""}`}
                aria-hidden="true"
              >
                <span className="preset-thumb-art" />
              </span>
              <span className="preset-name">{preset.label}</span>
              <span className="preset-dims">
                {preset.width}×{preset.height}
              </span>
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={activePresetId === "custom"}
            className={`preset-card${activePresetId === "custom" ? " is-active" : ""}`}
            onClick={() => setSize(800, 600)}
            title="Jump to a custom 800 × 600 canvas, then fine-tune below"
          >
            <span className="preset-thumb is-custom" aria-hidden="true">
              <span className="preset-thumb-art" />
            </span>
            <span className="preset-name">Custom</span>
            <span className="preset-dims">any size</span>
          </button>
        </div>

        {activePresetId === "custom" ? (
          <div className="field-row size-inputs">
            <calcite-input-number
              ref={customWidthRef}
              scale="s"
              value={customWidth}
              aria-label="Custom width in pixels"
            />
            <span className="x-sep" aria-hidden="true">
              ×
            </span>
            <calcite-input-number
              ref={customHeightRef}
              scale="s"
              value={customHeight}
              aria-label="Custom height in pixels"
            />
            <calcite-button
              scale="s"
              appearance="outline-fill"
              onClick={applyCustomSize}
            >
              Apply
            </calcite-button>
          </div>
        ) : null}
      </section>

      <section className="panel-section" aria-label="Background">
        <h3 className="section-title">Background</h3>
        <ColorSwatch
          label="Background color"
          value={backgroundColor}
          onCommit={setBackgroundColor}
        />

        <input
          ref={bgFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onBackgroundUpload}
        />
        <div className="field-row">
          <calcite-button
            scale="s"
            appearance="outline-fill"
            icon-start="upload"
            width="full"
            onClick={() => bgFileRef.current?.click()}
          >
            Upload photo
          </calcite-button>
          {backgroundLayer ? (
            <calcite-button
              scale="s"
              kind="danger"
              appearance="transparent"
              icon-start="trash"
              aria-label="Remove background image"
              onClick={removeBackgroundImage}
            />
          ) : null}
        </div>

        {backgroundLayer && backgroundLayer.type === "backgroundImage" ? (
          <div className="field">
            <label className="field-label" htmlFor="bg-fit">
              Image fit
            </label>
            <calcite-select
              id="bg-fit"
              ref={bgFitRef}
              scale="s"
              value={backgroundLayer.fit}
              label="Background image fit mode"
            >
              <calcite-option value="cover">Fill and crop</calcite-option>
              <calcite-option value="contain">Fit inside</calcite-option>
              <calcite-option value="stretch">Stretch</calcite-option>
            </calcite-select>
          </div>
        ) : null}
      </section>

      <section className="panel-section" aria-label="Add elements">
        <h3 className="section-title">Add</h3>
        <div className="add-grid">
          <button
            type="button"
            className="add-tile"
            aria-label="Add text layer"
            onClick={() => addText()}
          >
            <span className="add-tile-glyph glyph-text" aria-hidden="true">
              T
            </span>
            Text
          </button>
          <button
            type="button"
            className="add-tile"
            aria-label="Add rectangle layer"
            onClick={() => addRectangle()}
          >
            <span
              className="add-tile-glyph glyph-shape"
              aria-hidden="true"
            />
            Shape
          </button>
          <button
            type="button"
            className="add-tile"
            aria-label="Add logo from file"
            onClick={() => logoFileRef.current?.click()}
          >
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
              <path
                d="M2 12.5 6 8l3 3 2-2.5 3 4v1H2z"
                fill="currentColor"
                opacity="0.85"
              />
              <circle cx="5.2" cy="5.2" r="1.4" fill="#ffb600" />
            </svg>
            Logo
          </button>
          <button
            type="button"
            className="add-tile"
            aria-label="Open ArcGIS style icon picker"
            onClick={() => openIconPicker()}
          >
            <span className="add-tile-glyph glyph-icon" aria-hidden="true">
              ✦
            </span>
            Icon
          </button>
        </div>
        <input
          ref={logoFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onLogoUpload}
        />
      </section>

      <section className="panel-section" aria-label="Templates">
        <h3 className="section-title">
          Templates
          <span className="section-hint">replaces the canvas</span>
        </h3>
        <div className="template-list">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`template-row${template.id === "blank" ? " is-muted" : ""}`}
              aria-label={`Apply template ${template.name}`}
              title={template.description}
              onClick={() => applyTemplate(template.id)}
            >
              <TemplatePreview id={template.id} />
              <span className="template-text">
                <strong>{template.name}</strong>
                <small>{template.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
