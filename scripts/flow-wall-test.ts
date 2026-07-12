/* ============================================================
   Тест flow field: стіна між (15,25) і Січчю (15,15).
   Очікування: звичайний ворог (flow, wallCost 14) іде В ОБХІД,
   мурза (flowBrute, wallCost 3) — НАПРОЛОМ крізь стіну.
   Запуск: npm run test:flow
   ============================================================ */
import { recomputeFlow, flowDir } from '../src/sim/flowfield';
import { SICH } from '../src/data/config';
import { key, idx } from '../src/core/iso';
import type { Enemy, FlowField, GameState } from '../src/data/types';

/* мінімальний стан — flow field читає тільки structures/mapRes/flow/flowBrute */
const state = {
  structures: new Map(),
  mapRes: new Map(),
  flow: null,
  flowBrute: null,
} as unknown as GameState;

/* стіна поперек прямої (15,25) → (15,15): рядок y=20, x від 10 до 20 */
const wallY = 20;
for (let x = 10; x <= 20; x++) {
  state.structures.set(key(x, wallY), { type: 'pal', hp: 130, max: 130, cd: 0, flash: 0 });
}
recomputeFlow(state);

const at = (type: Enemy['type']): Enemy =>
  ({ type, x: 15.5, y: 25.5 }) as Enemy; /* стоїть у центрі тайла (15,25) */

/* пройти за полем від тайла до Січі, зібрати маршрут */
function walk(f: FlowField, sx: number, sy: number): [number, number][] {
  const path: [number, number][] = [[sx, sy]];
  let x = sx,
    y = sy;
  for (let i = 0; i < 100; i++) {
    if (Math.abs(x - SICH.tx) <= 1 && Math.abs(y - SICH.ty) <= 1) break;
    const dx = f.dir[idx(x, y) * 2],
      dy = f.dir[idx(x, y) * 2 + 1];
    if (dx === 0 && dy === 0) break;
    x += dx;
    y += dy;
    path.push([x, y]);
  }
  return path;
}

const throughWall = (path: [number, number][]): boolean =>
  path.some(([x, y]) => state.structures.has(key(x, y)));

const fmt = (path: [number, number][]): string =>
  path
    .map(([x, y]) => (state.structures.has(key(x, y)) ? `[${x},${y}]🧱` : `(${x},${y})`))
    .join(' ');

const foot = flowDir(state, at('foot'));
const murza = flowDir(state, at('murza'));
console.log('Стіна: y=20, x=10..20. Ворог у (15,25), Січ у (15,15).\n');
console.log(`flowDir  (foot)  перший крок: dx=${foot[0].toFixed(3)}, dy=${foot[1].toFixed(3)}`);
console.log(`flowBrute(murza) перший крок: dx=${murza[0].toFixed(3)}, dy=${murza[1].toFixed(3)}\n`);

const footPath = walk(state.flow!, 15, 25);
const murzaPath = walk(state.flowBrute!, 15, 25);
console.log(`Маршрут foot : ${fmt(footPath)}`);
console.log(`Маршрут murza: ${fmt(murzaPath)}\n`);

const footDetours = !throughWall(footPath);
const murzaBreaks = throughWall(murzaPath);
console.log(`foot  ${footDetours ? 'іде В ОБХІД ✓' : 'ЛІЗЕ КРІЗЬ СТІНУ ✗'}`);
console.log(`murza ${murzaBreaks ? 'пре НАПРОЛОМ ✓' : 'чомусь обходить ✗'}`);

if (!footDetours || !murzaBreaks) {
  throw new Error('flow field behaves differently from the prototype!');
}
console.log('\nPASSED');
