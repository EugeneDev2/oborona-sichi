/* ============================================================
   Малювання ефектів — хвіст render() з прототипу, 1:1.
   ТІЛЬКИ ЧИТАЄ стан. НЕ плутати з sim/effects.ts, який
   частинки/флоатери СТВОРЮЄ і оновлює.
   ============================================================ */
import { isoX, isoY, type Origin } from '../core/iso';
import type { GameState } from '../data/types';

type Ctx = CanvasRenderingContext2D;

/** Ядра гармат: чорна куля з відблиском. */
export function drawProjectiles(ctx: Ctx, o: Origin, state: GameState): void {
  for (const pr of state.projectiles) {
    const px = isoX(o, pr.x, pr.y),
      py = isoY(o, pr.x, pr.y) - pr.z;
    ctx.fillStyle = '#22201c';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.arc(px - 1, py - 1, 1.5, 0, 7);
    ctx.fill();
  }
}

/** Стріли орди: риска від хвоста (позиція мінус швидкість × 0.06) до вістря. */
export function drawArrows(ctx: Ctx, o: Origin, state: GameState): void {
  for (const a of state.arrows) {
    const px = isoX(o, a.x, a.y),
      py = isoY(o, a.x, a.y) - a.z;
    const ex = isoX(o, a.x - a.vx * 0.06, a.y - a.vy * 0.06),
      ey = isoY(o, a.x - a.vx * 0.06, a.y - a.vy * 0.06) - a.z;
    ctx.strokeStyle = '#e8d9b0';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
}

/** Частинки: квадратики з альфою за залишком життя. */
export function drawParticles(ctx: Ctx, o: Origin, state: GameState): void {
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    const px = isoX(o, pt.x, pt.y),
      py = isoY(o, pt.x, pt.y) - pt.z;
    ctx.fillRect(px - pt.size / 2, py - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
}

/** Флоатери: текст із чорною тінню +1/+1, альфа = min(1, life*2). */
export function drawFloaters(ctx: Ctx, o: Origin, state: GameState): void {
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px Georgia';
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.fillStyle = '#000';
    ctx.fillText(f.text, isoX(o, f.x, f.y) + 1, isoY(o, f.x, f.y) - f.z + 1);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, isoX(o, f.x, f.y), isoY(o, f.x, f.y) - f.z);
  }
  ctx.globalAlpha = 1;
}
