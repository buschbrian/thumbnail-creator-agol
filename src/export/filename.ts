const MAX_SLUG_LENGTH = 60;

export function slugify(input: string): string {
  const cleaned = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return cleaned.length > 0 ? cleaned : "thumbnail";
}

export function buildFilename(
  title: string,
  width: number,
  height: number,
  extension: "png" | "jpeg" | "jpg",
): string {
  return `${slugify(title)}_${width}x${height}.${extension}`;
}
