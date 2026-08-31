import { useSidebarLocale } from "./sidebarLocale";

export function AuthorResponseBadge() {
  const { t } = useSidebarLocale();
  return <span style={styles.badge}>{t("sidebar.authorResponseBadge")}</span>;
}

const styles = {
  badge: {
    alignSelf: "center",
    border: "1px solid #7d6f3d",
    borderRadius: 4,
    color: "#4d421f",
    background: "#faf8ec",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: "16px",
    padding: "0 6px",
    whiteSpace: "nowrap" as const
  }
};
