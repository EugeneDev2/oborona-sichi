/* ============================================================
   В'юпорт: канвас, контекст, dpr, resize — 1:1 resize()
   з прототипу. Виклик buildGround() з оригінального resize()
   переїде в render-модуль, коли той з'явиться.
   ============================================================ */
import { ENGINE } from '../data/config';

export interface Viewport {
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
}

export function createViewport(cv: HTMLCanvasElement): Viewport {
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  return { cv, ctx, dpr: 1 };
}

/** resize() з прототипу: dpr ≤ 2, фізичний розмір × dpr, CSS-розмір у px. */
export function resizeViewport(vp: Viewport): void {
  vp.dpr = Math.min(window.devicePixelRatio || 1, ENGINE.DPR_MAX);
  vp.cv.width = innerWidth * vp.dpr;
  vp.cv.height = innerHeight * vp.dpr;
  vp.cv.style.width = innerWidth + 'px';
  vp.cv.style.height = innerHeight + 'px';
}
