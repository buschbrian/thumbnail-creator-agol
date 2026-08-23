import { useCallback, useRef, useState } from "react";
import { SIZE_PRESETS, matchingSizePreset } from "../presets/presets";
import { TEMPLATES } from "../templates/templates";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { useDomEvents } from "../hooks/useDomEvents";
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

export function LeftPanel() {
  const doc = useEditorStore((s) => s.doc);
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const layers = useEditorStore((s) => s.layers);
  const setSize = useEditorStore((s) => s.setSize);
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

  const presetGroupRef = useDomEvents([
    [
      "calciteRadioButtonChange",
      (event) => {
        const target = event.target as HTMLElement;
        if (!(target instanceof Element)) return;
        const value = target.getAttribute("value");
        const preset = SIZE_PRESETS.find((p) => p.id === value);
        if (preset) setSize(preset.width, preset.height);
      },
    ],
  ]);

  const customWidthRef = useDomEvents([
    [
      "calciteInputNumberInput",
      (event) =>
        setCustomWidth((event.target as HTMLInputElement).value),
    ],
  ]);

  const customHeightRef = useDomEvents([
    [
      "calciteInputNumberInput",
      (event) =>
        setCustomHeight((event.target as HTMLInputElement).value),
    ],
  ]);

  const bgColorRef = useDomEvents([
    [
      "calciteColorPickerInput",
      (event) =>
        useEditorStore
          .getState()
          .setBackgroundColor((event.target as HTMLInputElement).value),
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
      <calcite-block heading="Canvas size" description="Thumbnail presets" expanded>
        <calcite-radio-button-group
          name="size-preset"
          layout="vertical"
          scale="s"
          aria-label="Canvas size preset"
          ref={presetGroupRef}
        >
          {SIZE_PRESETS.map((preset) => (
            <calcite-radio-button
              key={preset.id}
              value={preset.id}
              checked={activePresetId === preset.id}
            >
              {preset.label} · {preset.width} × {preset.height}
            </calcite-radio-button>
          ))}
          <calcite-radio-button
            value="custom"
            checked={activePresetId === "custom"}
          >
            Custom size
          </calcite-radio-button>
        </calcite-radio-button-group>

        {activePresetId === "custom" ? (
          <div className="field-row size-inputs">
            <calcite-input-number
              ref={customWidthRef as never}
              scale="s"
              value={customWidth}
              aria-label="Custom width in pixels"
            />
            <span aria-hidden="true">×</span>
            <calcite-input-number
              ref={customHeightRef as never}
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
      </calcite-block>

      <calcite-block heading="Background" expanded>
        <div className="field">
          <calcite-color-picker
            ref={bgColorRef}
            scale="s"
            value={backgroundColor}
            aria-label="Background color"
          />
        </div>

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
            icon-start="upload"
            width="full"
            onClick={() => bgFileRef.current?.click()}
          >
            Upload image
          </calcite-button>
          {backgroundLayer ? (
            <calcite-button
              scale="s"
              kind="danger"
              appearance="outline"
              icon-start="trash"
              aria-label="Remove background image"
              onClick={removeBackgroundImage}
            />
          ) : null}
        </div>

        {backgroundLayer && backgroundLayer.type === "backgroundImage" ? (
          <div className="field">
            <label htmlFor="bg-fit">Image fit</label>
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
      </calcite-block>

      <calcite-block heading="Add elements" expanded>
        <div className="add-grid">
          <calcite-button
            scale="s"
            appearance="outline-fill"
            icon-start="text"
            aria-label="Add text layer"
            onClick={() => addText()}
          >
            Text
          </calcite-button>
          <calcite-button
            scale="s"
            appearance="outline-fill"
            icon-start="rectangle"
            aria-label="Add rectangle layer"
            onClick={() => addRectangle()}
          >
            Shape
          </calcite-button>
          <calcite-button
            scale="s"
            appearance="outline-fill"
            icon-start="image"
            aria-label="Add logo from file"
            onClick={() => logoFileRef.current?.click()}
          >
            Logo
          </calcite-button>
          <calcite-button
            scale="s"
            appearance="outline-fill"
            icon-start="apps"
            aria-label="Open ArcGIS style icon picker"
            onClick={() => openIconPicker()}
          >
            Icon
          </calcite-button>
        </div>
        <input
          ref={logoFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onLogoUpload}
        />
      </calcite-block>

      <calcite-block
        heading="Templates"
        description="Quick professional layouts"
        expanded
      >
        <div className="template-list">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-row"
              aria-label={`Apply template ${template.name}`}
              onClick={() => applyTemplate(template.id)}
            >
              <span className="swatch-pair" aria-hidden="true">
                <span
                  className="swatch"
                  style={{ background: template.swatch[0] }}
                />
                <span
                  className="swatch"
                  style={{ background: template.swatch[1] }}
                />
              </span>
              <span className="template-text">
                <strong>{template.name}</strong>
                <small>{template.description}</small>
              </span>
            </button>
          ))}
        </div>
      </calcite-block>
    </div>
  );
}
