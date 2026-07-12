/* ============================================================
   Орда — spawnEnemy, moveEnemy і блок "--- орда ---" з update()
   прототипу, 1:1. Пріоритети поведінки НЕ МІНЯТИ:
   козак (<0.95) → Січ (<1.25) → агро (<2.2, крім мурзи) → flow field.
   Наступний тайл flow — споруда → ворог стоїть і ламає її.
   ============================================================ */
import { GW, GH, SICH, ETYPES, ENEMY, ARCHER } from '../data/config';
import { key } from '../core/iso';
import { blocked } from '../sim/state';
import { flowDir } from '../sim/flowfield';
import { hurtPlayer, hurtSich, hurtStructure } from '../sim/combat';
import { puff } from '../sim/effects';
import type { EnemyType, GameState } from '../data/types';
import type { Enemy } from '../data/types';

export function spawnEnemy(state: GameState, type: EnemyType): void {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) {
    x = Math.random() * GW;
    y = -ENEMY.SPAWN_EDGE_OFFSET;
  } else if (side === 1) {
    x = Math.random() * GW;
    y = GH + ENEMY.SPAWN_EDGE_OFFSET;
  } else if (side === 2) {
    x = -ENEMY.SPAWN_EDGE_OFFSET;
    y = Math.random() * GH;
  } else {
    x = GW + ENEMY.SPAWN_EDGE_OFFSET;
    y = Math.random() * GH;
  }
  const t = ETYPES[type];
  state.enemies.push({
    type,
    x,
    y,
    hp: t.hp,
    max: t.hp,
    spd: t.spd * (ENEMY.SPD_BASE + Math.random() * ENEMY.SPD_SPREAD),
    dmg: t.dmg,
    r: t.r,
    cd: 0,
    flash: 0,
    step: Math.random() * ENEMY.STEP_RANDOM,
    fx: 0,
    fy: 1,
    range: t.range || 0,
    kite: t.kite || 0,
    draw: 0,
  });
}

/** Рух ворога з розштовхуванням і ковзанням уздовж стін. */
export function moveEnemy(state: GameState, e: Enemy, dx: number, dy: number, dt: number): void {
  if (dx || dy) {
    e.fx = dx;
    e.fy = dy;
  }
  for (const o of state.enemies) {
    if (o === e) continue;
    const ddx = e.x - o.x,
      ddy = e.y - o.y,
      dd = Math.hypot(ddx, ddy);
    if (dd > 0.001 && dd < ENEMY.SEPARATION_DIST) {
      dx += (ddx / dd) * ENEMY.SEPARATION_FORCE;
      dy += (ddy / dd) * ENEMY.SEPARATION_FORCE;
    }
  }
  const l = Math.hypot(dx, dy);
  if (l < 0.001) return;
  dx /= l;
  dy /= l;
  const step = e.spd * dt;
  const nx = e.x + dx * step,
    ny = e.y + dy * step;
  // роздільна перевірка осей = ковзання по стіні замість застрягання
  if (!blocked(state, Math.floor(nx), Math.floor(e.y))) e.x = nx;
  if (!blocked(state, Math.floor(e.x), Math.floor(ny))) e.y = ny;
  e.x = Math.max(-ENEMY.CLAMP_MARGIN, Math.min(GW + ENEMY.CLAMP_MARGIN, e.x));
  e.y = Math.max(-ENEMY.CLAMP_MARGIN, Math.min(GH + ENEMY.CLAMP_MARGIN, e.y));
}

/** Блок "--- орда ---" з update() прототипу. */
export function updateEnemies(state: GameState, dt: number): void {
  const p = state.player;
  for (const e of state.enemies) {
    if (e.cd > 0) e.cd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.draw > 0) e.draw -= dt;
    e.step += dt * ENEMY.STEP_ANIM * e.spd;

    // 99 — сентинель "дуже далеко", коли козак мертвий (як у прототипі)
    const distP = p.dead <= 0 ? Math.hypot(p.x - e.x, p.y - e.y) : 99;
    const distS = Math.hypot(SICH.cx - e.x, SICH.cy - e.y);

    /* ЛУЧНИК: не лізе в ближній бій. Стріляє з дистанції,
       відступає, якщо козак підійшов, інакше йде по flow field. */
    if (e.type === 'archer') {
      const target = distP < e.range ? 'p' : distS < e.range ? 's' : null;
      if (target && e.cd <= 0) {
        e.cd = ARCHER.SHOOT_CD;
        e.draw = ARCHER.DRAW_TIME;
        const tx = target === 'p' ? p.x : SICH.cx;
        const ty = target === 'p' ? p.y : SICH.cy;
        const dx = tx - e.x,
          dy = ty - e.y,
          d = Math.hypot(dx, dy) || 1;
        state.arrows.push({
          x: e.x,
          y: e.y,
          z: ARCHER.ARROW_Z,
          vx: (dx / d) * ARCHER.ARROW_SPEED,
          vy: (dy / d) * ARCHER.ARROW_SPEED,
          dmg: e.dmg,
          life: ARCHER.ARROW_LIFE,
          tgt: target,
        });
      }
      let dx, dy;
      if (distP < e.kite) {
        // козак близько — задкує
        dx = e.x - p.x;
        dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        dx /= d;
        dy /= d;
      } else if (target) {
        dx = 0;
        dy = 0; // на позиції — стоїть і стріляє
      } else {
        const f = flowDir(state, e);
        dx = f[0];
        dy = f[1];
        const nb = f[2];
        if (nb && state.structures.has(key(nb[0], nb[1]))) {
          if (e.cd <= 0) {
            e.cd = ENEMY.STRUCT_CD_ARCHER;
            hurtStructure(state, nb[0], nb[1], e.dmg);
          }
          dx = 0;
          dy = 0;
        }
      }
      moveEnemy(state, e, dx, dy, dt);
      continue;
    }

    /* БЛИЖНІЙ БІЙ */
    if (distP < ENEMY.MELEE_PLAYER_DIST) {
      if (e.cd <= 0) {
        e.cd = ENEMY.MELEE_PLAYER_CD;
        hurtPlayer(state, e.dmg);
      }
      e.fx = p.x - e.x;
      e.fy = p.y - e.y;
      continue;
    }
    if (distS < ENEMY.SICH_DIST) {
      if (e.cd <= 0) {
        e.cd = ENEMY.SICH_CD;
        hurtSich(state, e.dmg);
        puff(state, SICH.cx, SICH.cy, 5, '#c8a468');
      }
      continue;
    }
    // близький козак дражнить (крім мурзи — той пре на Січ)
    if (distP < ENEMY.AGGRO_DIST && e.type !== 'murza') {
      const dx = p.x - e.x,
        dy = p.y - e.y,
        d = Math.hypot(dx, dy) || 1;
      moveEnemy(state, e, dx / d, dy / d, dt);
      continue;
    }
    // інакше — по полю потоку
    const f = flowDir(state, e);
    let dx = f[0],
      dy = f[1];
    const nb = f[2];
    if (nb && state.structures.has(key(nb[0], nb[1]))) {
      // обхід дорожчий за пролом → ламає
      if (e.cd <= 0) {
        e.cd = ENEMY.STRUCT_CD;
        hurtStructure(state, nb[0], nb[1], e.dmg);
      }
      dx = 0;
      dy = 0;
    }
    moveEnemy(state, e, dx, dy, dt);
  }
  state.enemies = state.enemies.filter((e) => !e.deadFlag);
}
