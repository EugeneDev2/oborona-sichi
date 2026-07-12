/* ============================================================
   FLOW FIELD — Дейкстра від Січі назад по всій сітці.
   Замість A* на кожного ворога рахуємо ОДНЕ поле напрямків
   на всю орду. Перераховуємо тільки коли змінилися перешкоди.

   Ключ: споруда/ресурс не блокує, а КОШТУЄ дорого. Тож орда
   обходить стіни, якщо є прохід, і ламає їх, якщо обходу нема
   (замурувати Січ наглухо неможливо — і це правильно).

   flow      — для пішців/вершників/лучників (стіна = 14)
   flowBrute — для мурз, ті майже не обходять (стіна = 3)

   Перенесено БУКВАЛЬНО з _prototype.html. Лінійний пошук
   мінімуму в pq не міняти на priority queue (бекЛог, не зараз).
   ============================================================ */
import { GW, GH, SICH, FLOW } from '../data/config';
import { key, idx, inGrid, isSich } from '../core/iso';
import type { Enemy, FlowField, GameState } from '../data/types';

/* Порядок обходу сусідів — НЕ міняти */
const NB: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export function computeFlow(state: GameState, wallCost: number): FlowField {
  // НЕ МІНЯТИ на Float32 — похибка округлення робить частину карти недосяжною
  const dist = new Float64Array(GW * GH).fill(Infinity);
  const dir = new Int8Array(GW * GH * 2); // dx,dy до найкращого сусіда
  // старт — клітинки навколо Січі (сама Січ — ціль, у неї не заходять)
  const pq: { d: number; x: number; y: number }[] = [];
  const push = (d: number, x: number, y: number): void => {
    pq.push({ d, x, y });
  };
  for (const [dx, dy] of NB) {
    const x = SICH.tx + dx,
      y = SICH.ty + dy;
    if (!inGrid(x, y)) continue;
    let c = 1;
    if (state.structures.has(key(x, y)) || state.mapRes.has(key(x, y))) c = wallCost;
    dist[idx(x, y)] = c;
    dir[idx(x, y) * 2] = -dx;
    dir[idx(x, y) * 2 + 1] = -dy; // напрямок ДО Січі
    push(c, x, y);
  }
  // Дейкстра (лінійний вибір мінімуму — свідомо, як у прототипі)
  while (pq.length) {
    let bi = 0;
    for (let i = 1; i < pq.length; i++) if (pq[i].d < pq[bi].d) bi = i;
    const cur = pq.splice(bi, 1)[0];
    if (cur.d > dist[idx(cur.x, cur.y)] + 1e-9) continue; // застарілий запис
    for (const [dx, dy] of NB) {
      const nx = cur.x + dx,
        ny = cur.y + dy;
      if (!inGrid(nx, ny) || isSich(nx, ny)) continue;
      const diag = dx !== 0 && dy !== 0 ? FLOW.DIAG : 1;
      let cell = 1;
      if (state.structures.has(key(nx, ny)) || state.mapRes.has(key(nx, ny))) cell = wallCost;
      const nd = cur.d + cell * diag;
      if (nd < dist[idx(nx, ny)] - 0.0001) {
        dist[idx(nx, ny)] = nd;
        dir[idx(nx, ny) * 2] = -dx;
        dir[idx(nx, ny) * 2 + 1] = -dy;
        push(nd, nx, ny);
      }
    }
  }
  return { dist, dir };
}

export function recomputeFlow(state: GameState): void {
  state.flow = computeFlow(state, FLOW.WALL_COST);
  state.flowBrute = computeFlow(state, FLOW.WALL_COST_BRUTE);
}

/** Напрямок для ворога з його тайла.
    Повертає [dx, dy, наступнийТайл | null] — null, коли рух прямий (фолбек). */
export function flowDir(state: GameState, e: Enemy): [number, number, [number, number] | null] {
  const tx = Math.floor(e.x),
    ty = Math.floor(e.y);
  if (!inGrid(tx, ty)) {
    // ще за краєм — просто йде всередину
    const dx = SICH.cx - e.x,
      dy = SICH.cy - e.y,
      d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d, null];
  }
  // поля завжди пораховані: recomputeFlow викликається одразу після freshState
  const f = (e.type === 'murza' ? state.flowBrute : state.flow)!;
  const i = idx(tx, ty);
  const dx = f.dir[i * 2],
    dy = f.dir[i * 2 + 1];
  if (dx === 0 && dy === 0) {
    const ddx = SICH.cx - e.x,
      ddy = SICH.cy - e.y,
      d = Math.hypot(ddx, ddy) || 1;
    return [ddx / d, ddy / d, null];
  }
  // ціль — центр наступного тайла (дає плавну траєкторію по коридорах)
  const nx = tx + dx,
    ny = ty + dy;
  const tgx = nx + 0.5,
    tgy = ny + 0.5;
  const vx = tgx - e.x,
    vy = tgy - e.y,
    d = Math.hypot(vx, vy) || 1;
  return [vx / d, vy / d, [nx, ny]];
}
