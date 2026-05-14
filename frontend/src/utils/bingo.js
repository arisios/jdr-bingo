export const COLUMNS = ['B','I','N','G','O'];
export const RANGES = { B:[1,10], I:[11,20], N:[21,30], G:[31,40], O:[41,50] };
export const TOTAL = 50;

export function getColumn(number) {
  for (const [col, [min, max]] of Object.entries(RANGES)) {
    if (number >= min && number <= max) return col;
  }
  return null;
}

export function hasBingo(grid, drawnSet) {
  const marked = (col, row) => grid[col][row] === 0 || drawnSet.has(grid[col][row]);
  for (let r = 0; r < 5; r++) if ([0,1,2,3,4].every(c => marked(c,r))) return true;
  for (let c = 0; c < 5; c++) if ([0,1,2,3,4].every(r => marked(c,r))) return true;
  if ([0,1,2,3,4].every(i => marked(i,i))) return true;
  if ([0,1,2,3,4].every(i => marked(i,4-i))) return true;
  return false;
}

export function countMissing(grid, drawnSet) {
  return grid.flat().filter(n => n !== 0 && !drawnSet.has(n)).length;
}

export function announceNumber(number, column) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${column}... ${number}!`);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}
