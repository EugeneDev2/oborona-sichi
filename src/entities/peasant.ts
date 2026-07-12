/* ============================================================
   Селяни — 1:1 з _prototype.html.
   Стейт-машина: idle → moving_to_res → gathering (2 с) →
   moving_to_sich → +5 ресурсу → moving_to_res (нескінченний
   цикл до того самого тайла).

   СВІДОМО ЗБЕРЕЖЕНІ БАГИ (див. docs/BACKLOG.md):
   B2 — ходять по ПРЯМІЙ, без flow field: застрягають за стінами.
   B4 — вороги їх ігнорують, селяни невразливі.
   ============================================================ */
import { SICH, PEASANT } from '../data/config';
import { key } from '../core/iso';
import { blocked } from '../sim/state';
import { puff, floater } from '../sim/effects';
import type { GameState, Peasant, ResourceType } from '../data/types';

export function spawnPeasant(state: GameState): void {
  state.peasants.push({
    x: SICH.cx,
    y: SICH.cy + PEASANT.SPAWN_OFFSET_Y,
    spd: PEASANT.SPD,
    state: 'idle',
    target: null,
    carryType: null,
    timer: 0,
    step: 0,
    fx: 0,
    fy: 1,
  });
  puff(state, SICH.cx, SICH.cy + PEASANT.SPAWN_OFFSET_Y, 8, '#e8d9b0');
}

/** Клік по ресурсному тайлу: шле найближчого ВІЛЬНОГО селянина.
    Повертає true, якщо клік оброблено (навіть якщо вільних нема). */
export function assignPeasant(state: GameState, tx: number, ty: number): boolean {
  const k = key(tx, ty);
  const res = state.mapRes.get(k);
  if (!res) return false;

  // Шукаємо вільного селянина
  let best: Peasant | null = null,
    minDist = Infinity;
  for (const p of state.peasants) {
    if (p.state === 'idle') {
      const d = Math.hypot(p.x - (tx + 0.5), p.y - (ty + 0.5));
      if (d < minDist) {
        minDist = d;
        best = p;
      }
    }
  }

  if (best) {
    best.target = { x: tx + 0.5, y: ty + 0.5, type: res.type, k: k };
    best.state = 'moving_to_res';
    floater(state, best.x, best.y, 'До праці!', '#e8d9b0');
    puff(state, tx + 0.5, ty + 0.5, 5, '#e8d9b0', 1, 2); // Підсвітка цілі
    return true;
  } else {
    floater(state, tx + 0.5, ty + 0.5, 'Немає вільних селян!', '#e08a7a');
    return true; // Клік оброблено, не атакуємо
  }
}

/** Рух по прямій (без flow field — баг B2, лишається). */
export function movePeasant(
  state: GameState,
  p: Peasant,
  dx: number,
  dy: number,
  dt: number,
): void {
  const l = Math.hypot(dx, dy);
  if (l < 0.001) return;
  p.fx = dx / l;
  p.fy = dy / l;
  const step = p.spd * dt;
  const nx = p.x + p.fx * step,
    ny = p.y + p.fy * step;
  if (!blocked(state, Math.floor(nx), Math.floor(p.y))) p.x = nx;
  if (!blocked(state, Math.floor(p.x), Math.floor(ny))) p.y = ny;
}

const GATHER_COLORS: Record<ResourceType, string> = {
  wood: '#6b4a2a',
  gold: '#d9a441',
  grain: '#e8c86a',
};

/** Блок "--- селяни (ШІ) ---" з update() прототипу. */
export function updatePeasants(state: GameState, dt: number): void {
  for (const peas of state.peasants) {
    if (peas.state === 'idle') {
      peas.step = 0; // Стоїть і чекає наказу гравця
    } else if (peas.state === 'moving_to_res') {
      const dx = peas.target!.x - peas.x,
        dy = peas.target!.y - peas.y;
      const dist = Math.hypot(dx, dy);
      if (dist < PEASANT.ARRIVE_RES_DIST) {
        peas.state = 'gathering';
        peas.timer = PEASANT.GATHER_TIME;
      } else {
        movePeasant(state, peas, dx, dy, dt);
        peas.step += dt * PEASANT.STEP_ANIM;
      }
    } else if (peas.state === 'gathering') {
      peas.timer -= dt;
      if (Math.random() < PEASANT.GATHER_PUFF_P) {
        puff(state, peas.x, peas.y, 2, GATHER_COLORS[peas.target!.type], 1, 2);
      }
      if (peas.timer <= 0) {
        peas.carryType = peas.target!.type;
        peas.state = 'moving_to_sich';
      }
    } else if (peas.state === 'moving_to_sich') {
      const dx = SICH.cx - peas.x,
        dy = SICH.cy - peas.y;
      const dist = Math.hypot(dx, dy);
      if (dist < PEASANT.ARRIVE_SICH_DIST) {
        state.res[peas.carryType!] += PEASANT.CARRY_AMOUNT;
        const icon = peas.carryType === 'wood' ? '🪵' : peas.carryType === 'gold' ? '🪙' : '🌾';
        const color =
          peas.carryType === 'wood' ? '#8a5a2e' : peas.carryType === 'gold' ? '#d9a441' : '#e8c86a';
        floater(state, peas.x, peas.y, '+' + PEASANT.CARRY_AMOUNT + ' ' + icon, color);
        peas.carryType = null;
        // Автоматично повертається до того ж ресурсу!
        peas.state = 'moving_to_res';
      } else {
        movePeasant(state, peas, dx, dy, dt);
        peas.step += dt * PEASANT.STEP_ANIM;
      }
    }
  }
}
