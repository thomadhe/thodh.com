// Stable JSON layout for opening files: one move/trap/side line per row, so diffs stay readable.
const enLinje = verdi => {
  if (Array.isArray(verdi)) return `[${verdi.map(enLinje).join(', ')}]`;
  if (verdi && typeof verdi === 'object') return `{ ${Object.entries(verdi).map(([k, v]) => `${JSON.stringify(k)}: ${enLinje(v)}`).join(', ')} }`;
  return JSON.stringify(verdi);
};

export function formaterApning(data) {
  const deler = Object.entries(data).map(([nokkel, verdi]) => {
    if (Array.isArray(verdi) && verdi.some(v => v && typeof v === 'object')) return `  ${JSON.stringify(nokkel)}: [\n${verdi.map(v => `    ${enLinje(v)}`).join(',\n')}\n  ]`;
    if (Array.isArray(verdi) && !verdi.length) return `  ${JSON.stringify(nokkel)}: []`;
    return `  ${JSON.stringify(nokkel)}: ${JSON.stringify(verdi, null, 2).replace(/\n/g, '\n  ')}`;
  });
  return `{\n${deler.join(',\n')}\n}\n`;
}
