import type { ImageAnchorDraft } from "../content/imageAnchor";
import {
  createImageAnchorFromElement,
  createImageAnchorFromFile,
  createUrlOnlyImageAnchor
} from "../content/imageAnchor";
import type { TextAnchorDraft } from "../content/selectionAnchor";
import { useSidebarLocale } from "./sidebarLocale";

export type ManualAnchorDraft = {
  kind: "manual";
  note: string;
  source_url?: string;
};

type NewQuestionDropZoneProps = {
  onUseSelection?: () => void | TextAnchorDraft | null | Promise<void | TextAnchorDraft | null>;
  onPickImage?: () => void | ImageAnchorDraft | null | Promise<void | ImageAnchorDraft | null>;
  onImageAnchor: (anchor: ImageAnchorDraft) => void;
  onManualAnchor: (anchor: ManualAnchorDraft) => void;
};

export function NewQuestionDropZone({ onUseSelection, onPickImage, onImageAnchor, onManualAnchor }: NewQuestionDropZoneProps) {
  const { t } = useSidebarLocale();
  const selectionAvailable = Boolean(onUseSelection);

  return (
    <section
      aria-label={t("sidebar.anchorDraft")}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const imageAnchor = imageAnchorFromDrop(event);
        if (imageAnchor) {
          onImageAnchor(imageAnchor);
        }
      }}
      style={styles.zone}
    >
      <div style={styles.header}>
        <span style={styles.label}>{t("sidebar.anchorDraft")}</span>
        <button
          type="button"
          aria-label={selectionAvailable ? t("sidebar.useSelection") : t("sidebar.useSelectionUnavailable")}
          disabled={!selectionAvailable}
          onClick={() => {
            void onUseSelection?.();
          }}
          style={selectionAvailable ? styles.button : styles.disabledButton}
        >
          {selectionAvailable ? t("sidebar.useSelection") : t("sidebar.useSelectionUnavailable")}
        </button>
        <button type="button" aria-label={t("sidebar.selectImage")} onClick={() => void onPickImage?.()} style={styles.button}>
          {t("sidebar.selectImage")}
        </button>
      </div>
      <p style={styles.note}>
        {selectionAvailable ? t("sidebar.useSelectionHintEnabled") : t("sidebar.useSelectionHintDisabled")}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const note = String(form.get("manual-anchor") ?? "").trim();
          if (note) {
            onManualAnchor({ kind: "manual", note, source_url: location.href });
            event.currentTarget.reset();
          }
        }}
        style={styles.form}
      >
        <input
          name="manual-anchor"
          aria-label={t("sidebar.manualAnchorNote")}
          placeholder={t("sidebar.manualAnchorNote")}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          {t("sidebar.add")}
        </button>
      </form>
    </section>
  );
}

function imageAnchorFromDrop(event: React.DragEvent<HTMLElement>): ImageAnchorDraft | null {
  const file = imageFileFromDrop(event.dataTransfer.files);
  if (file) {
    return createImageAnchorFromFile(file);
  }

  const element = event.target instanceof HTMLImageElement ? event.target : null;
  if (element) {
    return createImageAnchorFromElement(element);
  }

  const uri = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
  if (!uri) {
    return null;
  }

  return createUrlOnlyImageAnchor(uri);
}

function imageFileFromDrop(files: FileList): File | undefined {
  return Array.from(files).find((file) => file.type.startsWith("image/"));
}

const styles = {
  zone: {
    border: "1px solid #b8b8ad",
    borderRadius: 6,
    padding: 12,
    background: "#f8f7f1",
    color: "#25251f",
    display: "grid",
    gap: 8
  },
  header: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    gap: 8
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: "uppercase" as const
  },
  note: {
    margin: 0,
    color: "#55554d",
    fontSize: 12,
    lineHeight: 1.4
  },
  form: {
    display: "flex",
    gap: 6
  },
  input: {
    minWidth: 0,
    flex: 1,
    border: "1px solid #c9c7bd",
    borderRadius: 4,
    padding: "6px 8px",
    fontSize: 12
  },
  button: {
    border: "1px solid #56564d",
    borderRadius: 4,
    background: "#ffffff",
    color: "#1f1f1a",
    cursor: "pointer",
    fontSize: 12,
    padding: "6px 8px"
  },
  disabledButton: {
    border: "1px solid #b8b8ad",
    borderRadius: 4,
    background: "#eeeee8",
    color: "#73736a",
    cursor: "not-allowed",
    fontSize: 12,
    padding: "6px 8px"
  }
};
