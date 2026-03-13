/**
 * Gibt die Teile einer Anlage als Array zurück.
 * z.B. maxParts=4 → [1, 2, 3, 4]
 */
export function getParts(facility) {
  return Array.from({ length: facility.maxParts }, (_, i) => i + 1);
}

/**
 * Gibt einen lesbaren Namen für einen Anlagentyp zurück.
 */
export function getTypeName(type) {
  const names = {
    grass: 'Rasenplatz',
    allweather: 'Allwetterplatz',
    hall: 'Sporthalle',
    cabin: 'Kabine',
  };
  return names[type] || type;
}
