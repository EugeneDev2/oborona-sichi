/* ============================================================
   Ефекти-МУТАТОРИ: puff() і floater() ДОДАЮТЬ частинки/написи
   в стан, тому живуть у sim/, а не в render/ (інваріант:
   render не мутує стан). Малює їх render/effects.ts (пізніше).
   Перенесено 1:1 з _prototype.html.
   ============================================================ */
import { FX } from '../data/config';
import type { GameState } from '../data/types';

export function puff(
  state: GameState,
  x: number,
  y: number,
  n: number,
  color: string,
  spd: number = FX.PUFF_SPD_DEFAULT,
  up: number = FX.PUFF_UP_DEFAULT,
): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      s = Math.random() * spd;
    state.particles.push({
      x,
      y,
      z: FX.PART_Z_MIN + Math.random() * FX.PART_Z_SPREAD,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s * FX.PART_VY_FACTOR,
      vz: Math.random() * up,
      life: FX.PART_LIFE_MIN + Math.random() * FX.PART_LIFE_SPREAD,
      max: FX.PART_LIFE_MAX,
      color,
      size: FX.PART_SIZE_MIN + Math.random() * FX.PART_SIZE_SPREAD,
    });
  }
}

export function floater(state: GameState, x: number, y: number, text: string, color: string): void {
  state.floaters.push({ x, y, z: FX.FLOATER_Z, text, color, life: FX.FLOATER_LIFE });
}

/** Хвіст update() прототипу: фізика частинок, підйом флоатерів,
    згасання трясіння і спалаху Січі. НЮАНС: z += vz і vz -= 0.3
    ідуть ЗА КАДР, без dt — як в оригіналі. */
export function updateEffects(state: GameState, dt: number): void {
  for (const pt of state.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.z += pt.vz;
    pt.vz -= FX.PART_GRAVITY;
    if (pt.z < 0) {
      pt.z = 0;
      pt.vz = 0;
    }
    pt.life -= dt;
  }
  state.particles = state.particles.filter((pt) => pt.life > 0);
  for (const f of state.floaters) {
    f.z += FX.FLOATER_RISE * dt;
    f.life -= dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);

  if (state.shake > 0) state.shake = Math.max(0, state.shake - FX.SHAKE_DECAY * dt);
  if (state.sichFlash > 0) state.sichFlash -= dt;
}
