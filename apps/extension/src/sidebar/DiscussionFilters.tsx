import type {
  DiscussionAnchorFilter,
  DiscussionFiltersState,
  DiscussionKindFilter,
  DiscussionParticipantFilter,
  DiscussionSortMode,
  DiscussionStatusFilter
} from "./Sidebar";

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
  function updateFilter<Key extends keyof DiscussionFiltersState>(
    key: Key,
    value: DiscussionFiltersState[Key]
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  return (
    <section aria-label="Discussion filters" style={styles.panel}>
      <FilterSelect
        id="discussion-kind"
        label="Content type"
        value={filters.kind}
        onChange={(value) => updateFilter("kind", value)}
        options={kindOptions}
      />
      <FilterSelect
        id="discussion-status"
        label="Status"
        value={filters.status}
        onChange={(value) => updateFilter("status", value)}
        options={statusOptions}
      />
      <FilterSelect
        id="discussion-anchor"
        label="Anchor type"
        value={filters.anchor}
        onChange={(value) => updateFilter("anchor", value)}
        options={anchorOptions}
      />
      <FilterSelect
        id="discussion-participant"
        label="Participant"
        value={filters.participant}
        onChange={(value) => updateFilter("participant", value)}
        options={participantOptions}
      />
      <FilterSelect
        id="discussion-sort"
        label="Sort discussions"
        value={sort}
        onChange={onSortChange}
        options={sortOptions}
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

const kindOptions: Array<{ value: DiscussionKindFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "question", label: "Question" },
  { value: "answer", label: "Answer" },
  { value: "comment", label: "Comment" },
  { value: "author_response", label: "Author response" }
];

const statusOptions: Array<{ value: DiscussionStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "resolved", label: "Resolved" },
  { value: "author_responded", label: "Author responded" },
  { value: "disputed", label: "Disputed" }
];

const anchorOptions: Array<{ value: DiscussionAnchorFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "screenshot", label: "Screenshot" },
  { value: "figure", label: "Figure" },
  { value: "table", label: "Table" },
  { value: "formula", label: "Formula" },
  { value: "reference", label: "Reference" },
  { value: "manual", label: "Manual" }
];

const participantOptions: Array<{ value: DiscussionParticipantFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "author_response", label: "Author responses" }
];

const sortOptions: Array<{ value: DiscussionSortMode; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "heat", label: "Heat" }
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
