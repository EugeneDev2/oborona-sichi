/* ============================================================
   Бій — функції шкоди, вибух, удар шаблею, ядра і стріли.
   1:1 з _prototype.html.
   ============================================================ */
import {
  SICH,
  ETYPES,
  ENEMY,
  PLAYER,
  ATTACK,
  CANNON,
  STRUCT,
  SICH_FX,
  ARCHER,
} from '../data/config';
import { key, inGrid } from '../core/iso';
import { blocked } from './state';
import { recomputeFlow } from './flowfield';
import { puff, floater } from './effects';
import type { Enemy, GameState } from '../data/types';

export function hurtEnemy(state: GameState, e: Enemy, dmg: number, kx: number, ky: number): void {
  e.hp -= dmg;
  e.flash = ENEMY.FLASH;
  puff(state, e.x, e.y, 5, '#8f2320');
  if (kx || ky) {
    const nx = e.x + kx,
      ny = e.y + ky;
    if (!blocked(state, Math.floor(nx), Math.floor(ny))) {
      e.x = nx;
      e.y = ny;
    }
  }
  if (e.hp <= 0) {
    e.deadFlag = true;
    state.kills++;
    const rew = ETYPES[e.type].reward;
    state.res.gold += rew; // З ворогів падають дукати (золото)
    floater(state, e.x, e.y, '+' + rew + ' 🪙', '#d9a441');
    puff(state, e.x, e.y, 12, '#6d1c18', 3);
  }
}

export function hurtPlayer(state: GameState, dmg: number): void {
  const p = state.player;
  if (p.dead > 0 || p.inv > 0) return;
  p.hp -= dmg;
  p.lastHit = 0;
  state.shake = Math.max(state.shake, PLAYER.HURT_SHAKE);
  puff(state, p.x, p.y, 6, '#8f2320');
  if (p.hp <= 0) {
    p.hp = 0;
    p.dead = PLAYER.RESPAWN_TIME;
    floater(state, p.x, p.y, 'Порубали!', '#e8d9b0');
    puff(state, p.x, p.y, 18, '#8f2320', 3.4);
  }
}

export function hurtSich(state: GameState, dmg: number): void {
  state.sichHp -= dmg;
  state.sichFlash = SICH_FX.FLASH;
  state.shake = Math.max(state.shake, SICH_FX.HURT_SHAKE);
  if (state.sichHp <= 0) {
    state.sichHp = 0;
    gameOver(state);
  }
}

/** Сим-частина gameOver() прототипу. DOM-частина (оверлей #endOv,
    статистика) — в ui/overlays.ts, коли з'явиться. */
function gameOver(state: GameState): void {
  state.over = true;
  state.running = false;
}

export function hurtStructure(state: GameState, tx: number, ty: number, dmg: number): void {
  const k = key(tx, ty);
  const s = state.structures.get(k);
  if (!s) return;
  s.hp -= dmg;
  s.flash = STRUCT.FLASH;
  puff(state, tx + 0.5, ty + 0.5, 4, '#b08b55');
  if (s.hp <= 0) {
    state.structures.delete(k);
    puff(state, tx + 0.5, ty + 0.5, 14, '#8a6b3a', 3);
    recomputeFlow(state); // стіна впала — орда перепрокладає шлях
  }
}

export function explode(
  state: GameState,
  x: number,
  y: number,
  radius: number,
  damage: number,
): void {
  puff(state, x, y, 15, '#444', 2.5, 4);
  puff(state, x, y, 10, '#d9a441', 3.5, 6);
  state.shake = Math.max(state.shake, CANNON.EXPLODE_SHAKE);

  for (const e of state.enemies) {
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < radius) {
      const dx = e.x - x,
        dy = e.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      const force = CANNON.EXPLODE_FORCE;
      hurtEnemy(state, e, damage, (dx / dist) * force, (dy / dist) * force);
    }
  }
}

/** Удар козака шаблею. */
export function attack(state: GameState): void {
  if (!state.running) return;
  const p = state.player;
  if (p.dead > 0 || p.atkCd > 0) return;
  p.atkCd = ATTACK.CD;
  p.swing = ATTACK.SWING_TIME;
  let hit = false;
  for (const e of state.enemies) {
    const dx = e.x - p.x,
      dy = e.y - p.y,
      d = Math.hypot(dx, dy);
    if (d < ATTACK.RADIUS) {
      const dot = (dx * p.fx + dy * p.fy) / (d || 1);
      if (dot > ATTACK.DOT || d < ATTACK.CLOSE) {
        hurtEnemy(state, e, ATTACK.DMG, (dx / d) * ATTACK.KNOCKBACK, (dy / d) * ATTACK.KNOCKBACK);
        hit = true;
      }
    }
  }
  if (hit) state.shake = Math.max(state.shake, ATTACK.HIT_SHAKE);
}

/* --- ядра (блок "--- ядра ---" з update) --- */
export function updateProjectiles(state: GameState, dt: number): void {
  for (const pr of state.projectiles) {
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.life -= dt;

    let hit = false;
    for (const e of state.enemies) {
      if (Math.hypot(e.x - pr.x, e.y - pr.y) < e.r + CANNON.HIT_PAD) {
        hit = true;
        break;
      }
    }

    if (hit || pr.life <= 0) {
      explode(state, pr.x, pr.y, CANNON.EXPLODE_RADIUS, pr.dmg);
      pr.life = 0;
    }
  }
  state.projectiles = state.projectiles.filter((pr) => pr.life > 0);
}

/* --- стріли орди (блок "--- стріли орди ---" з update) --- */
export function updateArrows(state: GameState, dt: number): void {
  const p = state.player;
  for (const a of state.arrows) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.life -= dt;
    if (p.dead <= 0 && Math.hypot(p.x - a.x, p.y - a.y) < ARCHER.ARROW_HIT_PLAYER) {
      hurtPlayer(state, a.dmg);
      a.life = 0;
      continue;
    }
    if (Math.hypot(SICH.cx - a.x, SICH.cy - a.y) < ARCHER.ARROW_HIT_SICH) {
      hurtSich(state, a.dmg);
      a.life = 0;
      continue;
    }
    const tx = Math.floor(a.x),
      ty = Math.floor(a.y);
    if (inGrid(tx, ty) && state.structures.has(key(tx, ty))) {
      hurtStructure(state, tx, ty, a.dmg);
      a.life = 0;
    }
  }
  state.arrows = state.arrows.filter((a) => a.life > 0);
}
