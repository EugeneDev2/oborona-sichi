/* ============================================================
   Ввід — клавіатура, миша, тач. Обробники 1:1 з прототипу.
   keys, hoverTile, showFlow, стан джойстика — модульний стан,
   як глобалки в оригіналі.

   Відхилення (як для Пробілу з П9а): attack() не викликається
   прямо з обробника — ставиться прапорець, який кадр знімає
   через consumeAttack(). Максимум один кадр затримки.

   getState() — бо стан пересоздається в startGame.
   ============================================================ */
import { INPUT } from '../data/config';
import { tileFromScreen, inGrid, key, type Origin } from './iso';
import { cameraOrigin } from './camera';
import { tryBuild, demolish } from '../entities/structure';
import { assignPeasant } from '../entities/peasant';
import { selectTool } from '../ui/buildbar';
import type { GameState } from '../data/types';

const keys: Record<string, boolean> = {};
let attackPressed = false;
let showFlow = false;
let hoverTile: [number, number] | null = null;

/** ox/oy подій: у прототипі — глобалки з update(); тут — та сама формула з камери. */
const origin = (state: GameState): Origin => cameraOrigin(state, innerWidth, innerHeight);

export function initInput(cv: HTMLCanvasElement, getState: () => GameState): void {
  /* ---------- клавіатура ---------- */
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'KeyJ') {
      e.preventDefault();
      attackPressed = true;
    }
    if (e.code === 'Digit1') selectTool(getState(), 'pal');
    if (e.code === 'Digit2') selectTool(getState(), 'can');
    if (e.code === 'KeyF') showFlow = !showFlow;
    if (e.code === 'Escape') selectTool(getState(), null);
  });
  addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  /* ---------- миша ---------- */
  cv.addEventListener('mousemove', (e) => {
    hoverTile = tileFromScreen(origin(getState()), e.clientX, e.clientY);
  });
  cv.addEventListener('mouseleave', () => (hoverTile = null));

  // КЛІК МИШКОЮ (Або відправка селянина, або будова, або удар)
  cv.addEventListener('click', (e) => {
    const state = getState();
    const [tx, ty] = tileFromScreen(origin(state), e.clientX, e.clientY);
    if (state.tool) {
      tryBuild(state, tx, ty);
    } else if (inGrid(tx, ty) && state.mapRes.has(key(tx, ty))) {
      // Якщо клікнули на ресурс — відправити селянина
      assignPeasant(state, tx, ty);
    } else {
      // Інакше — вдарити шаблею
      attackPressed = true;
    }
  });

  // Правий клік — знести споруду (поверне половину вартості)
  cv.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const state = getState();
    const [txs, tys] = tileFromScreen(origin(state), e.clientX, e.clientY);
    demolish(state, txs, tys);
  });

  /* ---------- тач: джойстик ---------- */
  const stick = document.getElementById('stick')!;
  const knob = document.getElementById('knob')!;
  let stTouch: number | null = null,
    stCx = 0,
    stCy = 0;
  if ('ontouchstart' in window) document.body.classList.add('touch');

  addEventListener(
    'touchstart',
    (e) => {
      for (const t of e.changedTouches) {
        if (t.clientX < innerWidth * 0.5 && t.clientY > innerHeight * 0.35 && stTouch === null) {
          stTouch = t.identifier;
          const r = stick.getBoundingClientRect();
          stCx = r.left + r.width / 2;
          stCy = r.top + r.height / 2;
        }
      }
    },
    { passive: true },
  );
  addEventListener(
    'touchmove',
    (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === stTouch) {
          let dx = t.clientX - stCx,
            dy = t.clientY - stCy;
          const d = Math.hypot(dx, dy),
            m = INPUT.STICK_RADIUS;
          if (d > m) {
            dx = (dx / d) * m;
            dy = (dy / d) * m;
          }
          knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
          const p = getState().player;
          p.mvx = dx / m + dy / m;
          p.mvy = dy / m - dx / m;
        }
      }
    },
    { passive: true },
  );
  addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stTouch) {
        stTouch = null;
        const p = getState().player;
        p.mvx = 0;
        p.mvy = 0;
        knob.style.transform = 'translate(-50%,-50%)';
      }
    }
  });

  /* ---------- тач: кнопка атаки ---------- */
  const atkBtn = document.getElementById('atkBtn')!;
  atkBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    attackPressed = true;
  });
  atkBtn.addEventListener('click', () => (attackPressed = true));

  // ТАЧ ЕКРАН (Або відправка селянина, або будова)
  cv.addEventListener(
    'touchstart',
    (e) => {
      const state = getState();
      const t = e.changedTouches[0];
      if (t.clientX < innerWidth * 0.5 && t.clientY > innerHeight * 0.35) return;

      const [tx, ty] = tileFromScreen(origin(state), t.clientX, t.clientY);
      if (state.tool) {
        tryBuild(state, tx, ty);
      } else if (inGrid(tx, ty) && state.mapRes.has(key(tx, ty))) {
        assignPeasant(state, tx, ty);
      }
    },
    { passive: true },
  );
}

/** keysVec() — 1:1 з прототипу: WASD/стрілки → ізометричні діагоналі. */
export function keysVec(): [number, number] {
  let x = 0,
    y = 0;
  const up = keys.KeyW || keys.ArrowUp,
    dn = keys.KeyS || keys.ArrowDown,
    lf = keys.KeyA || keys.ArrowLeft,
    rt = keys.KeyD || keys.ArrowRight;
  if (up) {
    x -= 1;
    y -= 1;
  }
  if (dn) {
    x += 1;
    y += 1;
  }
  if (lf) {
    x -= 1;
    y += 1;
  }
  if (rt) {
    x += 1;
    y -= 1;
  }
  return [x, y];
}

/** Прапорець атаки (Пробіл/J/клік/тач-кнопка): кадр знімає його
    і викликає attack() сам; attack() перевіряє running. */
export function consumeAttack(): boolean {
  const a = attackPressed;
  attackPressed = false;
  return a;
}

/** Дебаг-режим показу flow field (перемикається клавішею F). */
export function flowShown(): boolean {
  return showFlow;
}

/** Тайл під курсором для привида будови (null — курсор поза канвасом). */
export function getHoverTile(): [number, number] | null {
  return hoverTile;
}
