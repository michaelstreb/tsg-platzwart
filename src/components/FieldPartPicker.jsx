const PART_LABELS = {
  2: { 1: 'Oben', 2: 'Unten' },
  4: { 1: '↖', 2: '↗', 3: '↙', 4: '↘' },
};

export function FieldPartPicker({ maxParts, totalParts, selectedParts, onTotalPartsChange, onPartsChange }) {
  const divisions = [1];
  if (maxParts >= 2) divisions.push(2);
  if (maxParts >= 4) divisions.push(4);

  const togglePart = (part) => {
    const next = selectedParts.includes(part)
      ? selectedParts.filter(p => p !== part)
      : [...selectedParts, part].sort((a, b) => a - b);
    onPartsChange(next);
  };

  const selectAll = () => {
    onPartsChange(Array.from({ length: totalParts }, (_, i) => i + 1));
  };

  const cols = totalParts === 4 ? 2 : 1;

  return (
    <div class="field-part-picker">
      <div class="fpp-division">
        <span class="form-label">Teilung</span>
        <div class="fpp-division-buttons">
          {divisions.map(n => (
            <button
              key={n}
              type="button"
              class={`fpp-div-btn ${totalParts === n ? 'fpp-div-btn--active' : ''}`}
              onClick={() => {
                onTotalPartsChange(n);
                onPartsChange(Array.from({ length: n }, (_, i) => i + 1));
              }}
            >
              {n === 1 ? 'Ganz' : n === 2 ? 'Hälften' : 'Quadranten'}
            </button>
          ))}
        </div>
      </div>

      {totalParts > 1 && (
        <div class="fpp-parts">
          <div class="fpp-parts-header">
            <span class="form-label">Teile wählen</span>
            <button type="button" class="fpp-select-all" onClick={selectAll}>Alle</button>
          </div>
          <div class="fpp-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: totalParts }, (_, i) => i + 1).map(part => (
              <button
                key={part}
                type="button"
                class={`fpp-part ${selectedParts.includes(part) ? 'fpp-part--selected' : ''}`}
                onClick={() => togglePart(part)}
              >
                {PART_LABELS[totalParts]?.[part] || part}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
