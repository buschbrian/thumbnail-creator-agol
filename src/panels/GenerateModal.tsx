import { useCallback, useState } from "react";
import {
  fetchAgolInfo,
  type AgolSourceInfo,
} from "../agol/fetchInfo";
import { parseAgolInput } from "../agol/parseInput";
import { suggestForInfo } from "../agol/mapping";
import { generateFromAgol } from "../agol/generateFromAgol";
import { useBrandStore } from "../brand/brandStore";
import { findTemplate, TEMPLATES } from "../templates/templates";
import { useDomEvents } from "../hooks/useDomEvents";
import { useUIStore } from "../ui/uiStore";

type Phase = "input" | "fetching" | "preview" | "applying";

export function GenerateModal() {
  const open = useUIStore((s) => s.generateOpen);
  const closeGenerate = useUIStore((s) => s.closeGenerate);
  const pushAlert = useUIStore((s) => s.pushAlert);

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [error, setError] = useState("");
  const [info, setInfo] = useState<AgolSourceInfo | null>(null);
  const [templateChoice, setTemplateChoice] = useState("");
  const [useThumbnail, setUseThumbnail] = useState(true);
  const [tintBrand, setTintBrand] = useState(true);

  const brandColorCount = useBrandStore((s) => s.colors.length);

  const urlRef = useDomEvents([
    ["calciteInputTextInput", (e) => setUrl((e.target as HTMLInputElement).value)],
  ]);
  const dialogRef = useDomEvents([["calciteDialogClose", () => closeGenerate()]]);
  const templateRef = useDomEvents([
    [
      "calciteSelectChange",
      (e) => setTemplateChoice((e.target as HTMLInputElement).value),
    ],
  ]);
  const thumbnailSwitchRef = useDomEvents([
    [
      "calciteSwitchChange",
      (e) => setUseThumbnail((e.target as HTMLInputElement).checked),
    ],
  ]);
  const brandSwitchRef = useDomEvents([
    [
      "calciteSwitchChange",
      (e) => setTintBrand((e.target as HTMLInputElement).checked),
    ],
  ]);

  const runFetch = useCallback(async (): Promise<void> => {
    setError("");
    const parsed = parseAgolInput(url);
    if (!parsed) {
      setError(
        "That does not look like an ArcGIS item page, item ID, or service URL.",
      );
      return;
    }
    setPhase("fetching");
    try {
      const fetched = await fetchAgolInfo(parsed);
      setInfo(fetched);
      setTemplateChoice("");
      setPhase("preview");
    } catch (fetchError) {
      setError((fetchError as Error).message);
      setPhase("input");
    }
  }, [url]);

  const runApply = useCallback(async (): Promise<void> => {
    if (!info) return;
    setPhase("applying");
    try {
      const result = await generateFromAgol(info, {
        templateId: templateChoice || undefined,
        useExistingThumbnail: useThumbnail && info.kind === "item",
        tintWithBrand: tintBrand && brandColorCount > 0,
      });
      const templateName =
        findTemplate(result.templateId)?.name ?? result.templateId;
      const bits = [templateName];
      if (result.usedBackgroundImage) bits.push("existing thumbnail as background");
      if (result.tintedWithBrand) bits.push("brand palette applied");
      pushAlert("success", "Thumbnail generated", bits.join(" · "));
      closeGenerate();
    } catch (applyError) {
      setError((applyError as Error).message);
      setPhase("preview");
    }
  }, [
    info,
    templateChoice,
    useThumbnail,
    tintBrand,
    brandColorCount,
    closeGenerate,
    pushAlert,
  ]);

  if (!open) return null;

  const busy = phase === "fetching" || phase === "applying";

  return (
    <calcite-dialog
      ref={dialogRef}
      open={open}
      heading="Generate from ArcGIS"
      description="Paste a public item link or REST service URL"
      modal
      width-scale="s"
    >
      <div className="generate-body">
        <div className="generate-url-row">
          <calcite-input-text
            ref={urlRef}
            scale="s"
            placeholder="https://org.maps.arcgis.com/home/item.html?id=…"
            aria-label="ArcGIS item or service URL"
            value={url}
            disabled={busy}
          />
          <calcite-button
            scale="s"
            kind="brand"
            loading={phase === "fetching"}
            disabled={!url.trim() || busy}
            onClick={() => void runFetch()}
          >
            Fetch
          </calcite-button>
        </div>

        {error ? (
          <calcite-notice kind="danger" open icon-start="circle-disallowed" scale="s">
            <div slot="message">{error}</div>
          </calcite-notice>
        ) : null}

        {phase === "preview" && info ? (
          <>
            <div className="generate-preview">
              {info.thumbnailAbsoluteUrl ? (
                <img
                  className="generate-thumb"
                  src={info.thumbnailAbsoluteUrl}
                  alt={`Existing thumbnail for ${info.title}`}
                />
              ) : (
                <div className="generate-thumb" aria-hidden="true" />
              )}
              <div className="generate-meta">
                <span className="generate-type">{info.typeName}</span>
                <strong>{info.title}</strong>
                {info.snippet ? <small>{info.snippet}</small> : null}
                {info.owner ? <small>Owner · {info.owner}</small> : null}
              </div>
            </div>

            <div className="generate-options">
              <div className="field">
                <span className="field-label">Layout</span>
                <calcite-select
                  ref={templateRef}
                  scale="s"
                  value={templateChoice}
                  label="Thumbnail layout template"
                >
                  <calcite-option value="">
                    {`Auto · ${
                      findTemplate(suggestForInfo(info).templateId)?.name ??
                      "best match"
                    }`}
                  </calcite-option>
                  {TEMPLATES.map((template) => (
                    <calcite-option key={template.id} value={template.id}>
                      {template.name}
                    </calcite-option>
                  ))}
                </calcite-select>
              </div>

              <div className="field switch-field">
                <span className="field-label">
                  Use existing thumbnail as background
                </span>
                <calcite-switch
                  ref={thumbnailSwitchRef}
                  scale="s"
                  checked={useThumbnail}
                  aria-label="Reuse existing thumbnail"
                  disabled={!info.thumbnailAbsoluteUrl}
                />
              </div>

              <div className="field switch-field">
                <span className="field-label">
                  Tint with brand kit ({brandColorCount}{" "}
                  {brandColorCount === 1 ? "color" : "colors"})
                </span>
                <calcite-switch
                  ref={brandSwitchRef}
                  scale="s"
                  checked={tintBrand}
                  aria-label="Tint with brand kit"
                  disabled={brandColorCount === 0}
                />
              </div>
            </div>

            <calcite-button
              kind="brand"
              width="full"
              loading={busy}
              onClick={() => void runApply()}
            >
              Generate thumbnail
            </calcite-button>
          </>
        ) : null}

        {!info && !busy ? (
          <p className="field-hint">
            Works with public ArcGIS Online item pages, bare item IDs, and
            ArcGIS Server REST endpoints (MapServer, FeatureServer,
            ImageServer, VectorTileServer, SceneServer). Nothing is uploaded —
            this tool only reads public metadata.
          </p>
        ) : null}
      </div>
    </calcite-dialog>
  );
}
