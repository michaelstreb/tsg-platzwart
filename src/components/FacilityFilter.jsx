export function FacilityFilter({ facilities, hiddenFacilities, onToggle }) {
  return (
    <div class="facility-filter">
      {facilities.map(f => (
        <button
          key={f.id}
          class={`filter-chip ${hiddenFacilities.has(f.id) ? 'filter-chip--hidden' : ''}`}
          style={{ '--chip-color': f.color }}
          onClick={() => onToggle(f.id)}
        >
          <span class="filter-chip-dot" />
          {f.name}
        </button>
      ))}
    </div>
  );
}
