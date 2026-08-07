export type ImageAnchorDraft = {
  kind: "image";
  source_url?: string;
  image_url?: string;
  alt_text?: string;
  caption_text?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  blob_url?: string;
};

type FileAnchorOptions = {
  createObjectUrl?: (blob: Blob) => string;
};

export function createImageAnchorFromElement(img: HTMLImageElement): ImageAnchorDraft {
  const imageUrl = img.currentSrc || img.src || undefined;
  const altText = img.alt.trim() || undefined;
  const captionText = findCaptionText(img);

  return compactImageAnchor({
    kind: "image",
    source_url: location.href,
    image_url: imageUrl,
    alt_text: altText,
    caption_text: captionText
  });
}

export function createImageAnchorFromFile(
  file: File,
  options: FileAnchorOptions = {}
): ImageAnchorDraft {
  const blobUrl = createBlobUrl(file, options.createObjectUrl);

  return compactImageAnchor({
    kind: "image",
    image_url: blobUrl,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    blob_url: blobUrl
  });
}

export function createUrlOnlyImageAnchor(imageUrl: string): ImageAnchorDraft {
  return compactImageAnchor({
    kind: "image",
    image_url: imageUrl.trim()
  });
}

function findCaptionText(img: HTMLImageElement): string | undefined {
  const figure = img.closest("figure");
  const figureCaption = figure?.querySelector("figcaption")?.textContent;
  const ariaDescription = img.getAttribute("aria-description");
  const title = img.title;

  return [figureCaption, ariaDescription, title]
    .map((value) => value?.replace(/\s+/g, " ").trim())
    .find((value): value is string => Boolean(value));
}

function compactImageAnchor(anchor: ImageAnchorDraft): ImageAnchorDraft {
  return Object.fromEntries(
    Object.entries(anchor).filter(([, value]) => value !== undefined && value !== "")
  ) as ImageAnchorDraft;
}

function createBlobUrl(
  file: File,
  createObjectUrl: ((blob: Blob) => string) | undefined
): string | undefined {
  if (createObjectUrl) {
    return createObjectUrl(file);
  }

  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(file);
  }

  return undefined;
}
