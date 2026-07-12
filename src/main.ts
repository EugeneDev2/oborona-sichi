import './style.css';
import { createViewport, resizeViewport } from './core/viewport';
import { initInput, consumeAttack } from './core/input';
import { cameraOrigin, updateCamera } from './core/camera';
import { isoX, isoY, key, type Origin } from './core/iso';
import { freshState } from './sim/state';
import { recomputeFlow } from './sim/flowfield';
import { attack, updateProjectiles, updateArrows } from './sim/combat';
import { updateEffects } from './sim/effects';
import { updateWaves } from './sim/waves';
import { updatePlayer } from './entities/player';
import { spawnEnemy, updateEnemies } from './entities/enemy';
import { spawnPeasant, assignPeasant, updatePeasants } from './entities/peasant';
import { updateStructures, tryBuild } from './entities/structure';
import { GW, GH, SICH, ENGINE, COST } from './data/config';
import type { EnemyType, StructureType } from './data/types';

const cv = document.getElementById('game') as HTMLCanvasElement;
const vp = createViewport(cv);
initInput();

const state = freshState();
recomputeFlow(state);

addEventListener('resize', () => resizeViewport(vp));
resizeViewport(vp);

/* ============ TEMP: перевірочний рендер для П9а/П9б ============
   НЕ фінальний. Сітка ромбами, козак і вороги кружечками,
   ядра/стріли крапками. Замінюється на render/ у наступних кроках.
   =============================================================== */
const TEMP_RES_COLORS: Record<string, string> = {
  wood: '#2d4c1e',
  gold: '#d9a441',
  grain: '#c8a441',
};
const TEMP_ENEMY_COLORS: Record<EnemyType, string> = {
  foot: '#4a3a52',
  rider: '#5a4330',
  archer: '#3a5a48',
  murza: '#7c2a52',
};

function tempDiamond(o: Origin, x: number, y: number): void {
  const ctx = vp.ctx;
  ctx.beginPath();
  ctx.moveTo(isoX(o, x, y), isoY(o, x, y));
  ctx.lineTo(isoX(o, x + 1, y), isoY(o, x + 1, y));
  ctx.lineTo(isoX(o, x + 1, y + 1), isoY(o, x + 1, y + 1));
  ctx.lineTo(isoX(o, x, y + 1), isoY(o, x, y + 1));
  ctx.closePath();
}

function tempHpBar(px: number, py: number, ratio: number, w: number): void {
  const ctx = vp.ctx;
  if (ratio >= 1) return;
  ctx.fillStyle = 'rgba(20,14,8,.8)';
  ctx.fillRect(px - w / 2, py, w, 4);
  ctx.fillStyle = ratio > 0.5 ? '#7fae4a' : ratio > 0.25 ? '#d9a441' : '#c8452f';
  ctx.fillRect(px - w / 2, py, w * Math.max(0, ratio), 4);
}

function tempRender(): void {
  const ctx = vp.ctx;
  ctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
  ctx.fillStyle = '#151a10';
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  const o = cameraOrigin(state, innerWidth, innerHeight);

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const res = state.mapRes.get(key(x, y));
      const struct = state.structures.get(key(x, y));
      const sich = x === SICH.tx && y === SICH.ty;
      tempDiamond(o, x, y);
      ctx.fillStyle = sich
        ? '#a5252b'
        : struct
          ? '#8a6b3a'
          : res
            ? TEMP_RES_COLORS[res.type]
            : (x + y) % 2
              ? '#3a4423'
              : '#37411f';
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,50,20,.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  /* Січ: HP-бар над тайлом */
  tempHpBar(
    isoX(o, SICH.cx, SICH.cy),
    isoY(o, SICH.cx, SICH.cy) - 40,
    state.sichHp / state.sichMax,
    48,
  );

  /* споруди: башточка гармати поверх тайла + HP-бар */
  for (const [k, s] of state.structures) {
    const [tx, ty] = k.split(',').map(Number);
    const sx = isoX(o, tx + 0.5, ty + 0.5),
      sy = isoY(o, tx + 0.5, ty + 0.5);
    if (s.type === 'can') {
      ctx.fillStyle = '#2e2a26';
      ctx.fillRect(sx - 5, sy - 22, 10, 16);
      if (s.fire !== undefined && s.fire > 0) {
        ctx.fillStyle = 'rgba(240,200,90,.9)';
        ctx.beginPath();
        ctx.arc(sx, sy - 26, 7, 0, 7);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#93714a';
      for (let i = -2; i <= 2; i++) ctx.fillRect(sx + i * 6 - 2, sy - 18, 4, 16);
    }
    if (s.hp < s.max) tempHpBar(sx, sy - 32, s.hp / s.max, 32);
  }

  /* селяни: маленькі кружечки, квадратик — вантаж */
  for (const peas of state.peasants) {
    const px2 = isoX(o, peas.x, peas.y),
      py2 = isoY(o, peas.x, peas.y);
    ctx.fillStyle = '#e8d9b0';
    ctx.beginPath();
    ctx.arc(px2, py2 - 6, 5, 0, 7);
    ctx.fill();
    if (peas.carryType) {
      ctx.fillStyle = TEMP_RES_COLORS[peas.carryType];
      ctx.fillRect(px2 - 8, py2 - 12, 6, 6);
    }
    if (peas.state === 'gathering') {
      ctx.strokeStyle = '#d9a441';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px2, py2 - 6, 8, 0, 7);
      ctx.stroke();
    }
  }

  /* вороги: кружечки з HP-барами */
  for (const e of state.enemies) {
    const ex = isoX(o, e.x, e.y),
      ey = isoY(o, e.x, e.y);
    ctx.fillStyle = e.flash > 0 ? '#e88a70' : TEMP_ENEMY_COLORS[e.type];
    ctx.beginPath();
    ctx.arc(ex, ey - 8, e.r * 24, 0, 7);
    ctx.fill();
    if (e.type === 'archer' && e.draw > 0) {
      ctx.strokeStyle = '#d8d0bc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (e.hp < e.max) tempHpBar(ex, ey - 26, e.hp / e.max, 26);
  }

  /* ядра і стріли */
  for (const pr of state.projectiles) {
    ctx.fillStyle = '#22201c';
    ctx.beginPath();
    ctx.arc(isoX(o, pr.x, pr.y), isoY(o, pr.x, pr.y) - pr.z, 4, 0, 7);
    ctx.fill();
  }
  for (const a of state.arrows) {
    const ax = isoX(o, a.x, a.y),
      ay = isoY(o, a.x, a.y) - a.z;
    const bx = isoX(o, a.x - a.vx * 0.06, a.y - a.vy * 0.06),
      by = isoY(o, a.x - a.vx * 0.06, a.y - a.vy * 0.06) - a.z;
    ctx.strokeStyle = '#e8d9b0';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  /* частинки і флоатери */
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    const px = isoX(o, pt.x, pt.y),
      py = isoY(o, pt.x, pt.y) - pt.z;
    ctx.fillRect(px - pt.size / 2, py - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px Georgia';
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, isoX(o, f.x, f.y), isoY(o, f.x, f.y) - f.z);
  }
  ctx.globalAlpha = 1;

  /* козак: кружечок + риска напрямку погляду */
  const p = state.player;
  const px = isoX(o, p.x, p.y),
    py = isoY(o, p.x, p.y);
  if (p.dead > 0) {
    ctx.fillStyle = 'rgba(232,217,176,.8)';
    ctx.beginPath();
    ctx.ellipse(px, py - 4, 14, 5, 0, 0, 7);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(15,20,8,.35)';
    ctx.beginPath();
    ctx.ellipse(px, py + 2, 10, 4.5, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = p.inv > 0 && Math.floor(state.time * 12) % 2 ? '#777' : '#ece2c8';
    ctx.beginPath();
    ctx.arc(px, py - 10, 9, 0, 7);
    ctx.fill();
    /* дуга удару під час swing */
    if (p.swing > 0) {
      ctx.strokeStyle = `rgba(240,240,220,${p.swing * 2.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py - 10, 22, 0, 7);
      ctx.stroke();
    }
    ctx.strokeStyle = '#a5252b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py - 10);
    ctx.lineTo(px + p.fx * 14, py - 10 + p.fy * 7);
    ctx.stroke();
  }

  ctx.fillStyle = '#e8d9b0';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    `хвиля=${state.wave} фаза=${state.phase}(${state.phaseT.toFixed(0)}) січ=${state.sichHp} hp=${p.hp.toFixed(0)} ` +
      `🪵${state.res.wood} 🪙${state.res.gold} 🌾${state.res.grain} ворогів=${state.spawnQueue.length + state.enemies.length} селян=${state.peasants.length}`,
    10,
    innerHeight - 10,
  );
}

/* TEMP: showBanner — копія з прототипу; фінально піде в ui/hud.ts */
let bannerT: ReturnType<typeof setTimeout> | null = null;
function tempShowBanner(t: string): void {
  const b = document.getElementById('banner')!;
  b.textContent = t;
  b.style.opacity = '1';
  if (bannerT) clearTimeout(bannerT);
  bannerT = setTimeout(() => (b.style.opacity = '0'), ENGINE.BANNER_MS);
}

/* TEMP: кнопки спавну ворогів для перевірки бою (створюються з JS,
   щоб index.html лишався дослівною копією прототипу) */
const tempBar = document.createElement('div');
tempBar.style.cssText =
  'position:fixed;top:48px;right:10px;z-index:8;display:flex;flex-direction:column;gap:4px';
function tempBtn(label: string, onClick: () => void): void {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = 'font:12px monospace;padding:4px 8px;cursor:pointer';
  b.addEventListener('click', () => {
    if (state.running) onClick();
    b.blur(); // як unfocus() у прототипі — щоб Пробіл не тикав кнопку
  });
  tempBar.appendChild(b);
}
for (const t of ['foot', 'rider', 'archer', 'murza'] as EnemyType[]) {
  tempBtn('TEMP спавн ' + t, () => spawnEnemy(state, t));
}
/* TEMP: будова біля козака (мишею — у П11); повторює шлях tryBuild з перевірками цін */
function tempBuildNearPlayer(tool: StructureType): void {
  state.tool = tool;
  const tx = Math.floor(state.player.x),
    ty = Math.floor(state.player.y);
  for (const [ox2, oy2] of [
    [2, 0],
    [0, 2],
    [-2, 0],
    [0, -2],
  ]) {
    if (
      !state.structures.has(key(tx + ox2, ty + oy2)) &&
      !state.mapRes.has(key(tx + ox2, ty + oy2))
    ) {
      tryBuild(state, tx + ox2, ty + oy2);
      break;
    }
  }
  state.tool = null;
}
tempBtn('TEMP частокіл', () => tempBuildNearPlayer('pal'));
tempBtn('TEMP гармата', () => tempBuildNearPlayer('can'));
/* TEMP: найм селянина — копія обробника toolPeas з прототипу */
tempBtn('TEMP селянин', () => {
  if (state.res.grain >= COST.peas) {
    state.res.grain -= COST.peas;
    spawnPeasant(state);
  } else {
    tempShowBanner('Мало зерна!');
  }
});
/* TEMP: послати вільного селянина до найближчого до Січі ресурсу */
tempBtn('TEMP до праці', () => {
  let best: [number, number] | null = null,
    bd = Infinity;
  for (const r of state.mapRes.values()) {
    const d = Math.hypot(r.tx + 0.5 - SICH.cx, r.ty + 0.5 - SICH.cy);
    if (d < bd) {
      bd = d;
      best = [r.tx, r.ty];
    }
  }
  if (best) assignPeasant(state, best[0], best[1]);
});
document.body.appendChild(tempBar);

/* TEMP: кнопка "До бою!" ховає оверлей і вмикає update */
document.getElementById('startBtn')!.addEventListener('click', () => {
  document.getElementById('startOv')!.classList.add('hidden');
  state.running = true;
});

/* TEMP: кінець гри — показати оверлей зі статистикою (фінально це ui/overlays.ts) */
let endShown = false;
function tempCheckGameOver(): void {
  if (state.over && !endShown) {
    endShown = true;
    document.getElementById('stats')!.innerHTML =
      `Ти протримався до <b>${state.wave}-ї хвилі</b><br>і порубав <b>${state.kills}</b> ворогів.`;
    document.getElementById('endOv')!.classList.remove('hidden');
  }
}
document.getElementById('againBtn')!.addEventListener('click', () => location.reload());

/* цикл — як у прототипі: dt обрізається, update тільки коли running */
let lastT = 0;
function loop(t: number): void {
  requestAnimationFrame(loop);
  const dt = Math.min(ENGINE.DT_MAX, (t - lastT) / 1000);
  lastT = t;
  const atk = consumeAttack();
  if (state.running && !state.over) {
    /* порядок систем — точно як в update() прототипу */
    state.time += dt;
    updateWaves(state, dt, tempShowBanner);
    updatePlayer(state, dt);
    updateCamera(state, dt);
    if (atk) attack(state);
    updatePeasants(state, dt);
    updateEnemies(state, dt);
    updateStructures(state, dt);
    updateProjectiles(state, dt);
    updateArrows(state, dt);
    updateEffects(state, dt);
  }
  tempRender();
  tempCheckGameOver();
}
requestAnimationFrame(loop);
