import { downloadBlob } from "../export/download";
import { slugify } from "../export/filename";
import type { DesignState } from "../state/types";
import { embedProjectAssets, type AssetCodecOptions } from "./assetCodec";
import {
  createDesignSnapshot,
  parseDesignSnapshot,
  type DesignSnapshot,
} from "./schema";

export const PROJECT_SIZE_WARNING_BYTES = 8 * 1024 * 1024;

export interface ProjectExportWarning {
  code: "large-project";
  message: string;
}

export interface PreparedProjectExport {
  snapshot: DesignSnapshot;
  json: string;
  filename: string;
  byteLength: number;
  warnings: ProjectExportWarning[];
}

export interface PrepareProjectExportOptions extends AssetCodecOptions {
  warningBytes?: number;
}

export interface DownloadPreparedProjectOptions {
  acceptWarnings?: boolean;
  download?: (blob: Blob, filename: string) => void;
}

export class ProjectExportConfirmationRequiredError extends Error {
  constructor() {
    super("Review and accept the project export warning before downloading.");
    this.name = "ProjectExportConfirmationRequiredError";
  }
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Prepares and validates a portable project without changing editor state. */
export async function prepareProjectExport(
  state: DesignState,
  options: PrepareProjectExportOptions = {},
): Promise<PreparedProjectExport> {
  const portableState = await embedProjectAssets(state, options);
  const snapshot = parseDesignSnapshot(createDesignSnapshot(portableState));
  const json = `${JSON.stringify(snapshot, null, 2)}\n`;
  const byteLength = new TextEncoder().encode(json).byteLength;
  const warningBytes = options.warningBytes ?? PROJECT_SIZE_WARNING_BYTES;
  const warnings: ProjectExportWarning[] =
    byteLength > warningBytes
      ? [
          {
            code: "large-project",
            message: `This editable project is ${formatMegabytes(byteLength)} because its images are embedded. It may take longer to save and reopen.`,
          },
        ]
      : [];

  return {
    snapshot,
    json,
    filename: `${slugify(snapshot.doc.title)}.thumbnail.json`,
    byteLength,
    warnings,
  };
}

/** Downloads a prepared project; warning-bearing files require explicit consent. */
export function downloadPreparedProject(
  prepared: PreparedProjectExport,
  options: DownloadPreparedProjectOptions = {},
): void {
  if (prepared.warnings.length > 0 && options.acceptWarnings !== true) {
    throw new ProjectExportConfirmationRequiredError();
  }
  const blob = new Blob([prepared.json], {
    type: "application/json",
  });
  (options.download ?? downloadBlob)(blob, prepared.filename);
}
