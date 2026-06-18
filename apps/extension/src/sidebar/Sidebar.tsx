import { SIDEBAR_TITLE } from "./sidebarTitle";
import { NewQuestionDropZone } from "./NewQuestionDropZone";

export function Sidebar() {
  return (
    <main style={{ display: "grid", gap: 12, padding: 12, fontFamily: "Georgia, serif" }}>
      <h1>{SIDEBAR_TITLE}</h1>
      <NewQuestionDropZone
        onUseSelection={() => null}
        onImageAnchor={() => undefined}
        onManualAnchor={() => undefined}
      />
    </main>
  );
}
