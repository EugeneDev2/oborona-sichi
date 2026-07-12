/* ============================================================
   Малювання сутностей — 1:1 з прототипу. ТІЛЬКИ ЧИТАЄ стан.
   Піксельні координати і кольори — дослівно, це малюнок.
   drawCossack читає p.walking/p.fx/p.fy/p.step (рішення №2),
   drawCannon НЕ мутує s.fire (рішення №1 — декей у updateStructures).
   ============================================================ */
import { SICH } from '../data/config';
import { isoX, isoY, type Origin } from '../core/iso';
import type { Enemy, GameState, Peasant, ResourceNode, Structure } from '../data/types';

type Ctx = CanvasRenderingContext2D;

export function shadow(ctx: Ctx, o: Origin, x: number, y: number, r: number): void {
  ctx.fillStyle = 'rgba(15,20,8,.35)';
  ctx.beginPath();
  ctx.ellipse(isoX(o, x, y), isoY(o, x, y) + 2, r, r * 0.45, 0, 0, 7);
  ctx.fill();
}

export function hpBar(ctx: Ctx, px: number, py: number, ratio: number, w: number): void {
  if (ratio >= 1) return;
  ctx.fillStyle = 'rgba(20,14,8,.8)';
  ctx.fillRect(px - w / 2, py, w, 4);
  ctx.fillStyle = ratio > 0.5 ? '#7fae4a' : ratio > 0.25 ? '#d9a441' : '#c8452f';
  ctx.fillRect(px - w / 2, py, w * Math.max(0, ratio), 4);
}

export function drawSich(ctx: Ctx, o: Origin, state: GameState): void {
  const sx = isoX(o, SICH.cx, SICH.cy),
    sy = isoY(o, SICH.cx, SICH.cy);
  const fl = state.sichFlash > 0;
  shadow(ctx, o, SICH.cx, SICH.cy + 0.1, 34);
  ctx.fillStyle = fl ? '#d88f6a' : '#6b4a2a';
  ctx.fillRect(sx - 26, sy - 46, 52, 44);
  ctx.strokeStyle = '#4a3018';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(sx - 26, sy - 46 + i * 9);
    ctx.lineTo(sx + 26, sy - 46 + i * 9);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a2814';
  ctx.fillRect(sx - 7, sy - 22, 14, 20);
  ctx.fillStyle = '#e8c86a';
  ctx.fillRect(sx + 12, sy - 36, 8, 8);
  ctx.fillRect(sx - 20, sy - 36, 8, 8);
  ctx.fillStyle = fl ? '#e0a880' : '#8a5a2e';
  ctx.beginPath();
  ctx.moveTo(sx - 32, sy - 44);
  ctx.lineTo(sx, sy - 66);
  ctx.lineTo(sx + 32, sy - 44);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.arc(sx, sy - 72, 10, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx - 10, sy - 72);
  ctx.quadraticCurveTo(sx, sy - 92, sx + 10, sy - 72);
  ctx.fill();
  ctx.strokeStyle = '#e8c86a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 104);
  ctx.lineTo(sx, sy - 88);
  ctx.moveTo(sx - 6, sy - 99);
  ctx.lineTo(sx + 6, sy - 99);
  ctx.stroke();
  ctx.strokeStyle = '#c8a468';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 26, sy - 44);
  ctx.lineTo(sx + 26, sy - 70);
  ctx.stroke();
  const wob = Math.sin(state.time * 3) * 3;
  ctx.fillStyle = '#2e5fa3';
  ctx.fillRect(sx + 26, sy - 70, 16 + wob * 0.3, 5);
  ctx.fillStyle = '#e8c86a';
  ctx.fillRect(sx + 26, sy - 65, 16 + wob * 0.3, 5);
}

export function drawPalisade(ctx: Ctx, o: Origin, tx: number, ty: number, s: Structure): void {
  const cx = tx + 0.5,
    cy = ty + 0.5;
  shadow(ctx, o, cx, cy, 20);
  const px = isoX(o, cx, cy),
    py = isoY(o, cx, cy);
  const fl = s.flash > 0;
  for (let i = -2; i <= 2; i++) {
    const x = px + i * 8,
      h = 24 + (i % 2 ? 4 : 0);
    ctx.fillStyle = fl ? '#d8b080' : i % 2 ? '#7a5836' : '#6b4a2a';
    ctx.fillRect(x - 3, py - h, 6, h + 3);
    ctx.fillStyle = fl ? '#e8c8a0' : '#93714a';
    ctx.beginPath();
    ctx.moveTo(x - 3, py - h);
    ctx.lineTo(x, py - h - 6);
    ctx.lineTo(x + 3, py - h);
    ctx.fill();
  }
  ctx.strokeStyle = '#4a3018';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px - 20, py - 12);
  ctx.lineTo(px + 20, py - 12);
  ctx.stroke();
  hpBar(ctx, px, py - 36, s.hp / s.max, 32);
}

export function drawCannon(ctx: Ctx, o: Origin, tx: number, ty: number, s: Structure): void {
  const cx = tx + 0.5,
    cy = ty + 0.5;
  shadow(ctx, o, cx, cy, 20);
  const px = isoX(o, cx, cy),
    py = isoY(o, cx, cy);
  const fl = s.flash > 0;
  ctx.fillStyle = fl ? '#d8b080' : '#5c412a';
  ctx.beginPath();
  ctx.moveTo(px, py - 2);
  ctx.lineTo(px + 22, py - 13);
  ctx.lineTo(px, py - 24);
  ctx.lineTo(px - 22, py - 13);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2814';
  ctx.stroke();
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(px - 18, py - 13, 5, 13);
  ctx.fillRect(px + 13, py - 13, 5, 13);
  ctx.save();
  ctx.translate(px, py - 24);
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.roundRect(-6, -14, 12, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#524a42';
  ctx.beginPath();
  ctx.ellipse(0, -14, 6, 3, 0, 0, 7);
  ctx.fill();
  // рішення №1: s.fire тут ТІЛЬКИ читається, декей — в updateStructures
  if (s.fire !== undefined && s.fire > 0) {
    ctx.fillStyle = 'rgba(240,200,90,.9)';
    ctx.beginPath();
    ctx.arc(0, -18, 7, 0, 7);
    ctx.fill();
  }
  ctx.restore();
  hpBar(ctx, px, py - 46, s.hp / s.max, 32);
}

export function drawMapResource(ctx: Ctx, o: Origin, tx: number, ty: number, res: ResourceNode): void {
  const cx = tx + 0.5,
    cy = ty + 0.5;
  const px = isoX(o, cx, cy),
    py = isoY(o, cx, cy);
  if (res.type === 'wood') {
    shadow(ctx, o, cx, cy, 12);
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(px - 3, py - 10, 6, 12);
    ctx.fillStyle = '#2d4c1e';
    ctx.beginPath();
    ctx.arc(px, py - 18, 12, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px - 8, py - 12, 10, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 8, py - 12, 10, 0, 7);
    ctx.fill();
  } else if (res.type === 'gold') {
    shadow(ctx, o, cx, cy, 18);
    ctx.fillStyle = '#666'; // Велика скеля
    ctx.beginPath();
    ctx.ellipse(px, py - 6, 16, 10, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.ellipse(px - 6, py - 10, 10, 8, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#d9a441'; // Золоті жили
    ctx.fillRect(px - 4, py - 14, 4, 4);
    ctx.fillRect(px + 6, py - 8, 5, 5);
    ctx.fillRect(px - 10, py - 6, 4, 3);
    ctx.fillRect(px, py - 2, 3, 3);
  } else if (res.type === 'grain') {
    ctx.fillStyle = '#d9a441';
    for (let i = 0; i < 5; i++) {
      const rox = (i % 3) * 6 - 6;
      const roy = Math.floor(i / 3) * 4 - 2;
      ctx.fillRect(px + rox, py + roy - 8, 2, 10);
      ctx.fillStyle = '#e8c86a';
      ctx.fillRect(px + rox - 1, py + roy - 10, 4, 4);
      ctx.fillStyle = '#d9a441';
    }
  }
}

export function drawCossack(ctx: Ctx, o: Origin, state: GameState): void {
  const p = state.player;
  if (p.dead > 0) {
    const px = isoX(o, p.x, p.y),
      py = isoY(o, p.x, p.y);
    ctx.fillStyle = 'rgba(232,217,176,.8)';
    ctx.beginPath();
    ctx.ellipse(px, py - 4, 14, 5, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#a5252b';
    ctx.beginPath();
    ctx.ellipse(px + 8, py - 4, 7, 4, 0, 0, 7);
    ctx.fill();
    return;
  }
  if (p.inv > 0 && Math.floor(state.time * 12) % 2) return;
  shadow(ctx, o, p.x, p.y, 11);
  const px = isoX(o, p.x, p.y),
    py = isoY(o, p.x, p.y);
  // рішення №2: walking зі стану, НЕ keysVec()
  const walking = p.walking;
  const bob = walking ? Math.sin(p.step) * 1.6 : 0;
  const legSw = walking ? Math.sin(p.step) * 4 : 0;
  const flip = p.fx - p.fy < 0 ? -1 : 1;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(flip, 1);
  ctx.fillStyle = '#a5252b';
  ctx.beginPath();
  ctx.roundRect(-7 + legSw * 0.3, -14, 6.5, 14, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(0.5 - legSw * 0.3, -14, 6.5, 14, 3);
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.fillRect(-8 + legSw * 0.3, -3, 8, 3.5);
  ctx.fillRect(0 - legSw * 0.3, -3, 8, 3.5);
  ctx.fillStyle = '#ece2c8';
  ctx.beginPath();
  ctx.roundRect(-8, -30 + bob, 16, 17, 4);
  ctx.fill();
  ctx.fillStyle = '#2e5fa3';
  ctx.fillRect(-8, -16 + bob, 16, 4);
  const sw = p.swing > 0 ? 1 - p.swing / 0.22 : 0;
  ctx.save();
  ctx.translate(7, -24 + bob);
  ctx.rotate(-1.9 + sw * 2.6);
  ctx.strokeStyle = '#ece2c8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(8, 2);
  ctx.stroke();
  ctx.strokeStyle = '#cfd6dc';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.quadraticCurveTo(20, 0, 24, -5);
  ctx.stroke();
  ctx.strokeStyle = '#8a6b3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(7, 2);
  ctx.lineTo(10, 2.5);
  ctx.stroke();
  ctx.restore();
  if (p.swing > 0.05) {
    ctx.strokeStyle = 'rgba(240,240,220,' + p.swing * 2.5 + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(6, -22 + bob, 17, -2.1 + sw * 2.2, -1.2 + sw * 2.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#d8a878';
  ctx.beginPath();
  ctx.arc(0, -36 + bob, 7, 0, 7);
  ctx.fill();
  ctx.strokeStyle = '#1e1a16';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-1, -43 + bob);
  ctx.quadraticCurveTo(-8, -44, -10, -38 + bob);
  ctx.stroke();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, -33 + bob);
  ctx.quadraticCurveTo(7, -32, 8, -35 + bob);
  ctx.stroke();
  ctx.restore();
}

export function drawPeasant(ctx: Ctx, o: Origin, p: Peasant): void {
  shadow(ctx, o, p.x, p.y, 8);
  const px = isoX(o, p.x, p.y),
    py = isoY(o, p.x, p.y);
  const flip = p.fx - p.fy < 0 ? -1 : 1;
  const moving = p.state === 'moving_to_res' || p.state === 'moving_to_sich';
  const bob = moving ? Math.sin(p.step) * 1.5 : 0;
  const legSw = moving ? Math.sin(p.step) * 4 : 0;

  ctx.save();
  ctx.translate(px, py);
  ctx.scale(flip, 1);

  ctx.fillStyle = '#5c412a';
  ctx.beginPath();
  ctx.roundRect(-5 + legSw * 0.3, -10, 5, 10, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(1 - legSw * 0.3, -10, 5, 10, 2);
  ctx.fill();

  ctx.fillStyle = '#e8d9b0';
  ctx.beginPath();
  ctx.roundRect(-6, -20 + bob, 12, 12, 3);
  ctx.fill();

  ctx.fillStyle = '#d8a878';
  ctx.beginPath();
  ctx.arc(0, -25 + bob, 5, 0, 7);
  ctx.fill();

  ctx.fillStyle = '#2a1d10';
  ctx.beginPath();
  ctx.arc(0, -27 + bob, 5, Math.PI, 0);
  ctx.fill();

  if (p.carryType) {
    ctx.fillStyle = p.carryType === 'wood' ? '#6b4a2a' : p.carryType === 'gold' ? '#d9a441' : '#e8c86a';
    ctx.fillRect(-8, -18 + bob, 6, 6);
  }
  ctx.restore();
}

export function drawEnemy(ctx: Ctx, o: Origin, e: Enemy): void {
  shadow(ctx, o, e.x, e.y, e.type === 'rider' ? 14 : 10);
  const px = isoX(o, e.x, e.y),
    py = isoY(o, e.x, e.y);
  const flip = e.fx - e.fy < 0 ? -1 : 1;
  const bob = Math.sin(e.step) * 1.5;
  const fl = e.flash > 0;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(flip, 1);
  if (e.type === 'rider') {
    ctx.fillStyle = fl ? '#e0a880' : '#5a4330';
    ctx.beginPath();
    ctx.ellipse(0, -12 + bob * 0.5, 15, 8, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#4a3626';
    const g = Math.sin(e.step) * 5;
    ctx.fillRect(-12 + g * 0.4, -8, 3.5, 9);
    ctx.fillRect(8 - g * 0.4, -8, 3.5, 9);
    ctx.fillRect(-6 - g * 0.4, -8, 3.5, 9);
    ctx.fillRect(13 + g * 0.4, -8, 3.5, 9);
    ctx.beginPath();
    ctx.moveTo(13, -16);
    ctx.quadraticCurveTo(20, -24, 24, -22);
    ctx.lineTo(24, -18);
    ctx.quadraticCurveTo(19, -18, 14, -11);
    ctx.closePath();
    ctx.fillStyle = fl ? '#e0a880' : '#5a4330';
    ctx.fill();
    ctx.translate(0, -14);
  }
  const big = e.type === 'murza' ? 1.3 : 1;
  ctx.scale(big, big);
  // халат
  const coat = e.type === 'murza' ? '#7c2a52' : e.type === 'archer' ? '#3a5a48' : '#4a3a52';
  ctx.fillStyle = fl ? '#e88a70' : coat;
  ctx.beginPath();
  ctx.roundRect(-8, -26 + bob, 16, 20, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(-8, -12 + bob, 16, 3);
  ctx.fillStyle = '#c89868';
  ctx.beginPath();
  ctx.arc(0, -31 + bob, 6, 0, 7);
  ctx.fill();
  ctx.fillStyle = fl ? '#f0c0a0' : '#33261a';
  ctx.beginPath();
  ctx.arc(0, -34 + bob, 6.5, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-6.5, -34 + bob, 13, 3);
  if (e.type === 'murza') {
    ctx.fillStyle = '#8f8a80';
    ctx.beginPath();
    ctx.moveTo(-6, -34 + bob);
    ctx.lineTo(0, -46 + bob);
    ctx.lineTo(6, -34 + bob);
    ctx.fill();
  }
  if (e.type === 'archer') {
    // лук + натяг тятиви
    const pull = e.draw > 0 ? 4 : 0;
    ctx.strokeStyle = '#8a6b3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(9, -18 + bob, 9, -1.1, 1.1);
    ctx.stroke();
    ctx.strokeStyle = '#d8d0bc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(13, -26 + bob);
    ctx.lineTo(9 - pull, -18 + bob);
    ctx.lineTo(13, -10 + bob);
    ctx.stroke();
    // сагайдак
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(-11, -26 + bob, 4, 12);
    ctx.strokeStyle = '#e8d9b0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-10 + i * 1.5, -26 + bob);
      ctx.lineTo(-10 + i * 1.5, -31 + bob);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = '#b8bec4';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(7, -18 + bob);
    ctx.rotate(-0.5 + Math.sin(e.step * 2) * 0.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(9, -2, 12, -7);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  if (e.hp < e.max) hpBar(ctx, px, py - (e.type === 'rider' ? 52 : 42), e.hp / e.max, 26);
}
