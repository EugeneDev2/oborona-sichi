/* ============================================================
   Козак — блок "--- козак ---" з update() прототипу, 1:1.
   ============================================================ */
import { GW, GH, PLAYER } from '../data/config';
import { keysVec } from '../core/input';
import { blocked } from '../sim/state';
import { floater } from '../sim/effects';
import type { GameState } from '../data/types';

export function updatePlayer(state: GameState, dt: number): void {
  const p = state.player;

  if (p.dead > 0) {
    p.dead -= dt;
    if (p.dead <= 0) {
      p.hp = p.max;
      p.x = PLAYER.START_X;
      p.y = PLAYER.START_Y;
      p.inv = PLAYER.INV_TIME;
      floater(state, p.x, p.y, 'Козак повернувся!', '#bfe08a');
    }
  } else {
    if (p.inv > 0) p.inv -= dt;
    p.lastHit += dt;
    if (p.lastHit > PLAYER.REGEN_DELAY && p.hp < p.max)
      p.hp = Math.min(p.max, p.hp + PLAYER.REGEN_HP_PER_S * dt);

    let mx = p.mvx,
      my = p.mvy;
    const kb = keysVec();
    if (kb[0] || kb[1]) {
      mx = kb[0];
      my = kb[1];
    }
    // рішення №2 (CLAUDE.md): walking рахується ТУТ, drawCossack тільки читає.
    // Формула та сама, що була в drawCossack прототипу.
    p.walking = Math.hypot(p.mvx, p.mvy) > PLAYER.WALK_ANIM_DEADZONE || !!(kb[0] || kb[1]);

    const len = Math.hypot(mx, my);
    if (len > PLAYER.MOVE_DEADZONE) {
      mx /= len;
      my /= len;
      p.fx = mx;
      p.fy = my;
      p.step += dt * PLAYER.STEP_ANIM;
      const spd = PLAYER.SPD * dt;
      let nx = p.x + mx * spd,
        ny = p.y + my * spd;
      nx = Math.max(PLAYER.CLAMP_MARGIN, Math.min(GW - PLAYER.CLAMP_MARGIN, nx));
      ny = Math.max(PLAYER.CLAMP_MARGIN, Math.min(GH - PLAYER.CLAMP_MARGIN, ny));
      // роздільна перевірка осей = ковзання вздовж стін
      if (!blocked(state, Math.floor(nx), Math.floor(p.y))) p.x = nx;
      if (!blocked(state, Math.floor(p.x), Math.floor(ny))) p.y = ny;
    }
    if (p.atkCd > 0) p.atkCd -= dt;
    if (p.swing > 0) p.swing -= dt;
  }
}
