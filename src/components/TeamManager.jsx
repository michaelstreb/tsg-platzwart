import { useState, useRef, useCallback } from 'preact/hooks';

export function TeamManager({ teams, onSave }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#607D8B');

  // Drag state
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const save = useCallback((next) => {
    const valid = next.filter(t => t.name.trim());
    onSave(valid);
  }, [onSave]);

  const update = (index, field, value) => {
    const next = teams.map((t, i) => i === index ? { ...t, [field]: value } : t);
    save(next);
  };

  const remove = (index) => {
    save(teams.filter((_, i) => i !== index));
  };

  // Drag & Drop handlers
  const handleDragStart = (e, index) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      const el = e.target.closest('.tm-item');
      if (el) el.classList.add('tm-item--dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    dragIndex.current = null;
    setDragOver(null);
    const el = e.target.closest('.tm-item');
    if (el) el.classList.remove('tm-item--dragging');
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex.current === null || dragIndex.current === index) return;
    setDragOver(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === dropIndex) return;

    const next = [...teams];
    const [moved] = next.splice(from, 1);
    next.splice(dropIndex, 0, moved);
    save(next);

    dragIndex.current = null;
    setDragOver(null);
  };

  // Touch drag support
  const touchState = useRef({ index: null, startY: 0, itemHeight: 0 });

  const handleTouchStart = (e, index) => {
    const touch = e.touches[0];
    const item = e.target.closest('.tm-item');
    if (!item) return;

    touchState.current = {
      index,
      startY: touch.clientY,
      itemHeight: item.offsetHeight + 6,
    };
    item.classList.add('tm-item--dragging');
  };

  const handleTouchMove = (e) => {
    if (touchState.current.index === null) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchState.current.startY;
    const movedBy = Math.round(deltaY / touchState.current.itemHeight);

    if (movedBy !== 0) {
      const targetIndex = Math.max(0, Math.min(teams.length - 1, touchState.current.index + movedBy));
      setDragOver(targetIndex);
    }
  };

  const handleTouchEnd = (e) => {
    const from = touchState.current.index;
    if (from === null) return;

    const item = e.target.closest('.tm-item');
    if (item) item.classList.remove('tm-item--dragging');

    if (dragOver !== null && dragOver !== from) {
      const next = [...teams];
      const [moved] = next.splice(from, 1);
      next.splice(dragOver, 0, moved);
      save(next);
    }

    touchState.current = { index: null, startY: 0, itemHeight: 0 };
    setDragOver(null);
  };

  const addTeam = () => {
    const name = newName.trim();
    if (!name) return;
    if (teams.some(t => t.name === name)) return;
    save([...teams, { name, color: newColor, active: true }]);
    setNewName('');
    setNewColor('#607D8B');
  };

  return (
    <div class="team-manager">
      <div class="tm-header">
        <h2>Mannschaften verwalten</h2>
      </div>

      <div class="tm-add">
        <input
          type="text"
          class="form-input"
          placeholder="Neues Team..."
          value={newName}
          onInput={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTeam()}
        />
        <input
          type="color"
          class="tm-color-input"
          value={newColor}
          onInput={(e) => setNewColor(e.target.value)}
        />
        <button class="btn-primary tm-add-btn" onClick={addTeam}>Hinzufügen</button>
      </div>

      <div class="tm-list">
        {teams.map((team, i) => (
          <div
            key={team.name}
            class={`tm-item ${dragOver === i ? 'tm-item--dragover' : ''} ${team.active === false ? 'tm-item--inactive' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
          >
            <div
              class="tm-drag-handle"
              onTouchStart={(e) => handleTouchStart(e, i)}
              onTouchMove={(e) => handleTouchMove(e)}
              onTouchEnd={handleTouchEnd}
            >
              &#x2630;
            </div>
            <input
              type="color"
              class="tm-color-input"
              value={team.color}
              onInput={(e) => update(i, 'color', e.target.value)}
            />
            <input
              type="text"
              class="form-input tm-name-input"
              value={team.name}
              onInput={(e) => update(i, 'name', e.target.value)}
            />
            <button
              class={`btn-icon tm-toggle ${team.active === false ? 'tm-toggle--off' : ''}`}
              onClick={() => update(i, 'active', team.active === false ? true : false)}
              title={team.active === false ? 'Aktivieren' : 'Deaktivieren'}
            >
              {team.active === false ? '\u25CB' : '\u25CF'}
            </button>
            <button
              class="btn-icon tm-delete"
              onClick={() => remove(i)}
              title="Entfernen"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <p class="tm-empty">Keine Teams vorhanden. Füge oben ein Team hinzu.</p>
      )}
    </div>
  );
}
