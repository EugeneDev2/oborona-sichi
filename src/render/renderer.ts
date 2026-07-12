/* ============================================================
   Головний рендер — render() з прототипу, 1:1. ТІЛЬКИ ЧИТАЄ стан.
   Небо, місяць, земля (пререндер), привид будови, дебаг flow,
   Y-сортування сутностей за d = x + y, ефекти зверху.
   Math.random() у трясінні — як у прототипі, стан не мутується.
   ============================================================ */
import { GW, GH, TW, TH, SICH, COST, CANNON, GROUND } from '../data/config';
import { isoX, isoY, idx, inGrid, key, type Origin } from '../core/iso';
import { cameraOrigin } from '../core/camera';
import type { Viewport } from '../core/viewport';
import { blocked } from '../sim/state';
import type { GameState } from '../data/types';
import {
  drawSich,
  drawPalisade,
  drawCannon,
  drawMapResource,
  drawCossack,
  drawPeasant,
  drawEnemy,
} from './entities';
import { drawProjectiles, drawArrows, drawParticles, drawFloaters } from './effects';

type Ctx = CanvasRenderingContext2D;

/** Привид будови під курсором (або підсвітка ресурсу, якщо інструмент не вибрано).
    hoverTile приходить з вводу (миша — П11); null → нічого не малюємо. */
export function drawGhost(
  ctx: Ctx,
  o: Origin,
  state: GameState,
  hoverTile: [number, number] | null,
): void {
  if (!hoverTile) return;
  const [txs, tys] = hoverTile;
  if (!inGrid(txs, tys)) return;

  // Якщо вибрано інструмент будови
  if (state.tool) {
    let ok = !blocked(state, txs, tys);
    if (state.tool === 'pal') ok = ok && state.res.wood >= COST.pal;
    if (state.tool === 'can') ok = ok && state.res.gold >= COST.can;

    const sx = isoX(o, txs + 0.5, tys + 0.5),
      sy = isoY(o, txs, tys);
    ctx.fillStyle = ok ? 'rgba(180,220,120,.3)' : 'rgba(220,90,70,.3)';
    ctx.strokeStyle = ok ? 'rgba(180,220,120,.8)' : 'rgba(220,90,70,.8)';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + TW / 2, sy + TH / 2);
    ctx.lineTo(sx, sy + TH);
    ctx.lineTo(sx - TW / 2, sy + TH / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (state.tool === 'can') {
      // коло радіуса дії гармати
      ctx.strokeStyle = 'rgba(240,200,90,.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let a = 0; a <= 32; a++) {
        const t = (a / 32) * Math.PI * 2;
        const wx = txs + 0.5 + Math.cos(t) * CANNON.RANGE,
          wy = tys + 0.5 + Math.sin(t) * CANNON.RANGE;
        const X = isoX(o, wx, wy),
          Y = isoY(o, wx, wy);
        if (a) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  // Підсвітка ресурсу, якщо інструмент НЕ вибрано
  else if (state.mapRes.has(key(txs, tys))) {
    const sx = isoX(o, txs + 0.5, tys + 0.5),
      sy = isoY(o, txs, tys);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + TW / 2, sy + TH / 2);
    ctx.lineTo(sx, sy + TH);
    ctx.lineTo(sx - TW / 2, sy + TH / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Дебаг-візуалізація flow field (клавіша F): стрілки напрямку до Січі. */
export function drawFlow(ctx: Ctx, o: Origin, state: GameState): void {
  if (!state.flow) return;
  ctx.strokeStyle = 'rgba(255,120,80,.55)';
  ctx.lineWidth = 1.5;
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      const i = idx(x, y);
      const dx = state.flow.dir[i * 2],
        dy = state.flow.dir[i * 2 + 1];
      if (!dx && !dy) continue;
      const cx = x + 0.5,
        cy = y + 0.5;
      const l = Math.hypot(dx, dy) || 1;
      const ax = cx + (dx / l) * 0.35,
        ay = cy + (dy / l) * 0.35;
      const X1 = isoX(o, cx, cy),
        Y1 = isoY(o, cx, cy),
        X2 = isoX(o, ax, ay),
        Y2 = isoY(o, ax, ay);
      ctx.beginPath();
      ctx.moveTo(X1, Y1);
      ctx.lineTo(X2, Y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(X2, Y2, 2, 0, 7);
      ctx.fillStyle = 'rgba(255,120,80,.7)';
      ctx.fill();
    }
}

/** Кадр цілком: порядок шарів точно як у render() прототипу. */
export function render(
  vp: Viewport,
  state: GameState,
  ground: HTMLCanvasElement,
  hoverTile: [number, number] | null,
  showFlow: boolean,
): void {
  const ctx = vp.ctx;
  ctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
  const shx = (Math.random() - 0.5) * state.shake,
    shy = (Math.random() - 0.5) * state.shake;
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  ctx.save();
  ctx.translate(shx, shy);

  const o = cameraOrigin(state, innerWidth, innerHeight);

  // небо: горизонт на 45–46% висоти
  const sky = ctx.createLinearGradient(0, 0, 0, innerHeight);
  sky.addColorStop(0, '#2b3a4d');
  sky.addColorStop(0.45, '#5a5a3f');
  sky.addColorStop(0.46, '#3a4423');
  sky.addColorStop(1, '#232b14');
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -20, innerWidth + 40, innerHeight + 40);

  // місяць з ореолом
  ctx.fillStyle = 'rgba(240,230,200,.9)';
  ctx.beginPath();
  ctx.arc(innerWidth * 0.82, innerHeight * 0.25, 22, 0, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(240,230,200,.15)';
  ctx.beginPath();
  ctx.arc(innerWidth * 0.82, innerHeight * 0.25, 34, 0, 7);
  ctx.fill();

  ctx.drawImage(
    ground,
    o.ox - GROUND.ORIGIN_X,
    o.oy - GROUND.ORIGIN_Y,
    GROUND.CANVAS_W,
    GROUND.CANVAS_H,
  );

  if (showFlow) drawFlow(ctx, o, state);
  drawGhost(ctx, o, state, hoverTile);

  // Y-сортування: глибина d = x + y (споруди +1, ресурси +0.1 — як у прототипі)
  const items: { d: number; f: () => void }[] = [];
  items.push({ d: SICH.cx + SICH.cy, f: () => drawSich(ctx, o, state) });

  for (const [k, s] of state.structures) {
    const [txs, tys] = k.split(',').map(Number);
    items.push({
      d: txs + tys + 1,
      f: () =>
        s.type === 'pal' ? drawPalisade(ctx, o, txs, tys, s) : drawCannon(ctx, o, txs, tys, s),
    });
  }
  for (const [k, res] of state.mapRes) {
    const [txs, tys] = k.split(',').map(Number);
    items.push({ d: txs + tys + 0.1, f: () => drawMapResource(ctx, o, txs, tys, res) });
  }
  for (const e of state.enemies) items.push({ d: e.x + e.y, f: () => drawEnemy(ctx, o, e) });
  for (const p of state.peasants) items.push({ d: p.x + p.y, f: () => drawPeasant(ctx, o, p) });
  items.push({ d: state.player.x + state.player.y, f: () => drawCossack(ctx, o, state) });

  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();

  drawProjectiles(ctx, o, state);
  drawArrows(ctx, o, state);
  drawParticles(ctx, o, state);
  drawFloaters(ctx, o, state);

  ctx.restore();
}
