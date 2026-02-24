import styles from "./FilterBar.module.css";

type FilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryOptions: readonly string[];
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  locationOptions: readonly string[];
  locationValue: string;
  onLocationChange: (value: string) => void;
  onClear: () => void;
  resultLabel: string;
  searchPlaceholder?: string;
  categoryLabel?: string;
  locationLabel?: string;
};

export default function FilterBar({
  search,
  onSearchChange,
  categoryOptions,
  categoryValue,
  onCategoryChange,
  locationOptions,
  locationValue,
  onLocationChange,
  onClear,
  resultLabel,
  searchPlaceholder = "Search…",
  categoryLabel = "All Categories",
  locationLabel = "All Branches",
}: FilterBarProps) {
  const showClear = Boolean(search || categoryValue || locationValue);

  return (
    <div className={styles.filterBar}>
      <input
        className={styles.searchInput}
        type="text"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select
        className={styles.filterSelect}
        value={categoryValue}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">{categoryLabel}</option>
        {categoryOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select
        className={styles.filterSelect}
        value={locationValue}
        onChange={(e) => onLocationChange(e.target.value)}
      >
        <option value="">{locationLabel}</option>
        {locationOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {showClear && (
        <button className={styles.clearBtn} onClick={onClear}>
          Clear
        </button>
      )}

      <span className={styles.resultCount}>{resultLabel}</span>
    </div>
  );
}
