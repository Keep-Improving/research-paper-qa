import type {
  DiscussionAnchorFilter,
  DiscussionFiltersState,
  DiscussionKindFilter,
  DiscussionParticipantFilter,
  DiscussionSortMode,
  DiscussionStatusFilter
} from "./Sidebar";
import { useSidebarLocale } from "./sidebarLocale";

type DiscussionFiltersProps = {
  filters: DiscussionFiltersState;
  sort: DiscussionSortMode;
  onFiltersChange: (filters: DiscussionFiltersState) => void;
  onSortChange: (sort: DiscussionSortMode) => void;
};

export function DiscussionFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange
}: DiscussionFiltersProps) {
  const { t } = useSidebarLocale();

  function updateFilter<Key extends keyof DiscussionFiltersState>(key: Key, value: DiscussionFiltersState[Key]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  return (
    <section aria-label={t("sidebar.discussionFilters")} style={styles.panel}>
      <FilterSelect
        id="discussion-kind"
        label={t("sidebar.contentType")}
        value={filters.kind}
        onChange={(value) => updateFilter("kind", value)}
        options={kindOptions.map((option) => ({ value: option.value, label: t(option.label) }))}
      />
      <FilterSelect
        id="discussion-status"
        label={t("sidebar.status")}
        value={filters.status}
        onChange={(value) => updateFilter("status", value)}
        options={statusOptions.map((option) => ({ value: option.value, label: t(option.label) }))}
      />
      <FilterSelect
        id="discussion-anchor"
        label={t("sidebar.anchorType")}
        value={filters.anchor}
        onChange={(value) => updateFilter("anchor", value)}
        options={anchorOptions.map((option) => ({ value: option.value, label: t(option.label) }))}
      />
      <FilterSelect
        id="discussion-participant"
        label={t("sidebar.participant")}
        value={filters.participant}
        onChange={(value) => updateFilter("participant", value)}
        options={participantOptions.map((option) => ({ value: option.value, label: t(option.label) }))}
      />
      <FilterSelect
        id="discussion-sort"
        label={t("sidebar.sortDiscussions")}
        value={sort}
        onChange={onSortChange}
        options={sortOptions.map((option) => ({ value: option.value, label: t(option.label) }))}
      />
    </section>
  );
}

function FilterSelect<Value extends string>({
  id,
  label,
  value,
  options,
  onChange
}: {
  id: string;
  label: string;
  value: Value;
  options: Array<{ value: Value; label: string }>;
  onChange: (value: Value) => void;
}) {
  return (
    <div style={styles.row}>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as Value)}
        style={styles.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const kindOptions: Array<{ value: DiscussionKindFilter; label: "sidebar.all" | "sidebar.question" | "sidebar.answer" | "sidebar.comment" | "sidebar.authorResponse" }> = [
  { value: "all", label: "sidebar.all" },
  { value: "question", label: "sidebar.question" },
  { value: "answer", label: "sidebar.answer" },
  { value: "comment", label: "sidebar.comment" },
  { value: "author_response", label: "sidebar.authorResponse" }
];

const statusOptions: Array<{ value: DiscussionStatusFilter; label: "sidebar.all" | "sidebar.open" | "sidebar.answered" | "sidebar.resolved" | "sidebar.authorResponded" | "sidebar.disputed" }> = [
  { value: "all", label: "sidebar.all" },
  { value: "open", label: "sidebar.open" },
  { value: "answered", label: "sidebar.answered" },
  { value: "resolved", label: "sidebar.resolved" },
  { value: "author_responded", label: "sidebar.authorResponded" },
  { value: "disputed", label: "sidebar.disputed" }
];

const anchorOptions: Array<{ value: DiscussionAnchorFilter; label: "sidebar.all" | "sidebar.text" | "sidebar.image" | "sidebar.screenshot" | "sidebar.figure" | "sidebar.table" | "sidebar.formula" | "sidebar.reference" | "sidebar.manual" }> = [
  { value: "all", label: "sidebar.all" },
  { value: "text", label: "sidebar.text" },
  { value: "image", label: "sidebar.image" },
  { value: "screenshot", label: "sidebar.screenshot" },
  { value: "figure", label: "sidebar.figure" },
  { value: "table", label: "sidebar.table" },
  { value: "formula", label: "sidebar.formula" },
  { value: "reference", label: "sidebar.reference" },
  { value: "manual", label: "sidebar.manual" }
];

const participantOptions: Array<{ value: DiscussionParticipantFilter; label: "sidebar.all" | "sidebar.authorResponses" }> = [
  { value: "all", label: "sidebar.all" },
  { value: "author_response", label: "sidebar.authorResponses" }
];

const sortOptions: Array<{ value: DiscussionSortMode; label: "sidebar.newest" | "sidebar.heat" }> = [
  { value: "newest", label: "sidebar.newest" },
  { value: "heat", label: "sidebar.heat" }
];

const styles = {
  panel: {
    border: "1px solid #d0d2cc",
    borderRadius: 6,
    display: "grid",
    gap: 8,
    padding: 10,
    background: "#fbfbf7"
  },
  row: {
    alignItems: "center",
    display: "grid",
    gridTemplateColumns: "92px minmax(0, 1fr)",
    gap: 8
  },
  label: {
    color: "#505750",
    fontSize: 12,
    fontWeight: 700
  },
  select: {
    border: "1px solid #b9bdb8",
    borderRadius: 4,
    fontSize: 12,
    height: 28,
    minWidth: 132,
    padding: "0 8px",
    background: "#ffffff",
    color: "#252927"
  }
};
