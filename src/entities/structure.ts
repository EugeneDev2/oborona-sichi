/* ============================================================
   Споруди — гармати (блок "--- гармати ---" з update()),
   будова і знесення. 1:1 з _prototype.html.

   Рішення №1 (CLAUDE.md): згасання спалаху пострілу s.fire
   перенесено СЮДИ з drawCannon. Крок 0.016 ЗА КАДР, НЕ dt —
   інакше зміниться візуал.
   ============================================================ */
import { COST, STRUCT, CANNON } from '../data/config';
import { key, inGrid, isSich } from '../core/iso';
import { recomputeFlow } from '../sim/flowfield';
import { puff, floater } from '../sim/effects';
import type { Enemy, GameState } from '../data/types';

export function updateStructures(state: GameState, dt: number): void {
  for (const [k, s] of state.structures) {
    if (s.flash > 0) s.flash -= dt;
    if (s.type !== 'can') continue;
    // рішення №1: декей спалаху пострілу — за кадр, не dt (був у drawCannon)
    if (s.fire !== undefined && s.fire > 0) s.fire -= CANNON.FIRE_DECAY;
    if (s.cd > 0) {
      s.cd -= dt;
      continue;
    }
    const [txs, tys] = k.split(',').map(Number);
    const cx = txs + 0.5,
      cy = tys + 0.5;
    let best: Enemy | null = null,
      bd: number = CANNON.RANGE;
    for (const e of state.enemies) {
      const d = Math.hypot(e.x - cx, e.y - cy);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    if (best) {
      s.cd = CANNON.CD;
      s.fire = CANNON.FIRE_FLASH;
      const d = bd || 1;
      state.projectiles.push({
        x: cx,
        y: cy,
        z: CANNON.BALL_Z,
        vx: ((best.x - cx) / d) * CANNON.BALL_SPEED,
        vy: ((best.y - cy) / d) * CANNON.BALL_SPEED,
        dmg: CANNON.BALL_DMG,
        life: CANNON.BALL_LIFE,
      });
      puff(state, cx, cy, 4, '#d9d0b8', 1.5, 2);
      state.shake = Math.max(state.shake, CANNON.FIRE_SHAKE);
    }
  }
}

/** tryBuild() прототипу, але приймає ТАЙЛОВІ координати —
    переведення з екранних (tileFromScreen) робить шар вводу. */
export function tryBuild(state: GameState, txs: number, tys: number): void {
  if (!state.running || !state.tool) return;
  if (!inGrid(txs, tys)) return;
  if (isSich(txs, tys)) return;
  const k = key(txs, tys);
  if (state.structures.has(k) || state.mapRes.has(k)) return;
  if (Math.floor(state.player.x) === txs && Math.floor(state.player.y) === tys) return;

  if (state.tool === 'pal') {
    if (state.res.wood < COST.pal) {
      floater(state, txs + 0.5, tys + 0.5, 'Мало дерева!', '#e08a7a');
      return;
    }
    state.res.wood -= COST.pal;
  } else if (state.tool === 'can') {
    if (state.res.gold < COST.can) {
      floater(state, txs + 0.5, tys + 0.5, 'Мало золота!', '#e08a7a');
      return;
    }
    state.res.gold -= COST.can;
  }

  state.structures.set(
    k,
    state.tool === 'pal'
      ? { type: 'pal', hp: STRUCT.PAL_HP, max: STRUCT.PAL_HP, cd: 0, flash: 0 }
      : {
          type: 'can',
          hp: STRUCT.CAN_HP,
          max: STRUCT.CAN_HP,
          cd: STRUCT.CAN_START_CD,
          flash: 0,
          fire: 0,
        },
  );
  puff(state, txs + 0.5, tys + 0.5, 8, '#c8a468', 2, 4);
  recomputeFlow(state); // нова стіна — орда шукає новий обхід
}

/** Знесення правим кліком (обробник contextmenu прототипу):
    повертає floor(cost/2) відповідним ресурсом. */
export function demolish(state: GameState, txs: number, tys: number): void {
  const k = key(txs, tys);
  if (!state.structures.has(k)) return;
  const s = state.structures.get(k)!;
  if (s.type === 'pal') {
    const refund = Math.floor(COST.pal / STRUCT.REFUND_DIV);
    state.res.wood += refund;
    floater(state, txs + 0.5, tys + 0.5, '+' + refund + ' 🪵', '#8a5a2e');
  } else {
    const refund = Math.floor(COST.can / STRUCT.REFUND_DIV);
    state.res.gold += refund;
    floater(state, txs + 0.5, tys + 0.5, '+' + refund + ' 🪙', '#d9a441');
  }
  state.structures.delete(k);
  puff(state, txs + 0.5, tys + 0.5, 8, '#8a6b3a');
  recomputeFlow(state);
}
