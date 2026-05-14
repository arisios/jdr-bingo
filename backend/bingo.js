// Motor do Bingo 50 — Juninas do Rio
// Colunas: B(1-10) I(11-20) N(21-30+FREE) G(31-40) O(41-50)

const COLUMNS = ['B','I','N','G','O'];
const RANGES = { B:[1,10], I:[11,20], N:[21,30], G:[31,40], O:[41,50] };
const FREE_CENTER = 0;
const TOTAL_NUMBERS = 50;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function range(min, max) {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

function generateCard() {
  const grid = [];
  for (let col = 0; col < 5; col++) {
    const [min, max] = Object.values(RANGES)[col];
    const nums = shuffle(range(min, max)).slice(0, 5);
    grid.push(nums);
  }
  // FREE no centro (coluna N, linha 2)
  grid[2][2] = FREE_CENTER;
  return grid; // grid[col][row] — 5 colunas x 5 linhas
}

function getColumn(number) {
  for (const [col, [min, max]] of Object.entries(RANGES)) {
    if (number >= min && number <= max) return col;
  }
  return null;
}

function hasBingo(grid, drawnSet) {
  const rows = 5, cols = 5;
  const marked = (col, row) => grid[col][row] === FREE_CENTER || drawnSet.has(grid[col][row]);

  // Verificar linhas
  for (let r = 0; r < rows; r++) {
    if ([0,1,2,3,4].every(c => marked(c, r))) return true;
  }
  // Verificar colunas
  for (let c = 0; c < cols; c++) {
    if ([0,1,2,3,4].every(r => marked(c, r))) return true;
  }
  // Diagonais
  if ([0,1,2,3,4].every(i => marked(i, i))) return true;
  if ([0,1,2,3,4].every(i => marked(i, 4-i))) return true;

  return false;
}

function getCardNumbers(grid) {
  return grid.flat().filter(n => n !== FREE_CENTER);
}

function drawRandom(drawnSet) {
  const available = [];
  for (let n = 1; n <= TOTAL_NUMBERS; n++) {
    if (!drawnSet.has(n)) available.push(n);
  }
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function countMissing(grid, drawnSet) {
  return getCardNumbers(grid).filter(n => !drawnSet.has(n)).length;
}

module.exports = { generateCard, getColumn, hasBingo, drawRandom, countMissing, COLUMNS, TOTAL_NUMBERS };
