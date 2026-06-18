import type { DiscussionFilterMode, DiscussionSortMode } from "./Sidebar";

type DiscussionFiltersProps = {
  filter: DiscussionFilterMode;
  sort: DiscussionSortMode;
  onFilterChange: (filter: DiscussionFilterMode) => void;
  onSortChange: (sort: DiscussionSortMode) => void;
};

export function DiscussionFilters({
  filter,
  sort,
  onFilterChange,
  onSortChange
}: DiscussionFiltersProps) {
  return (
    <section aria-label="Discussion filters" style={styles.panel}>
      <div style={styles.row}>
        <span style={styles.label}>Participant</span>
        <div role="group" aria-label="Participant filter" style={styles.segmentGroup}>
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => onFilterChange("all")}
            style={segmentStyle(filter === "all")}
          >
            All
          </button>
          <button
            type="button"
            aria-pressed={filter === "author_response"}
            onClick={() => onFilterChange("author_response")}
            style={segmentStyle(filter === "author_response")}
          >
            Author responses
          </button>
        </div>
      </div>
      <div style={styles.row}>
        <label htmlFor="discussion-sort" style={styles.label}>
          Sort discussions
        </label>
        <select
          id="discussion-sort"
          aria-label="Sort discussions"
          value={sort}
          onChange={(event) => onSortChange(event.currentTarget.value as DiscussionSortMode)}
          style={styles.select}
        >
          <option value="newest">Newest</option>
          <option value="heat">Heat</option>
        </select>
      </div>
    </section>
  );
}

function segmentStyle(active: boolean) {
  return {
    ...styles.segment,
    background: active ? "#2f3a3f" : "#ffffff",
    color: active ? "#ffffff" : "#2b2f31",
    borderColor: active ? "#2f3a3f" : "#b9bdb8"
  };
}

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
    gridTemplateColumns: "88px minmax(0, 1fr)",
    gap: 8
  },
  label: {
    color: "#505750",
    fontSize: 12,
    fontWeight: 700
  },
  segmentGroup: {
    display: "grid",
    gridTemplateColumns: "70px 132px",
    gap: 4
  },
  segment: {
    border: "1px solid #b9bdb8",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    height: 28,
    padding: "0 8px",
    whiteSpace: "nowrap" as const
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
