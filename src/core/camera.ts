/* ============================================================
   Камера — 1:1 блок "камера слідує за гравцем" з update()
   прототипу. Стан камери (camX/camY) живе в GameState,
   тут — тільки функції над ним.
   ============================================================ */
import { TW, TH, CAMERA } from '../data/config';
import type { GameState } from '../data/types';
import type { Origin } from './iso';

/** Положення камери, відцентроване на тайлових координатах (x, y).
    Використовується у freshState для стартової позиції козака. */
export function cameraAt(x: number, y: number): { camX: number; camY: number } {
  return { camX: ((x - y) * TW) / 2, camY: ((x + y) * TH) / 2 };
}

/** Лерп камери за гравцем з коефіцієнтом CAMERA.LERP (5). */
export function updateCamera(state: GameState, dt: number): void {
  const p = state.player;
  const targetCamX = ((p.x - p.y) * TW) / 2;
  const targetCamY = ((p.x + p.y) * TH) / 2;
  state.camX += (targetCamX - state.camX) * CAMERA.LERP * dt;
  state.camY += (targetCamY - state.camY) * CAMERA.LERP * dt;
}

/** ox/oy з камери та розмірів вікна (у прототипі: ox = innerWidth/2 - camX). */
export function cameraOrigin(state: GameState, viewW: number, viewH: number): Origin {
  return { ox: viewW / 2 - state.camX, oy: viewH / 2 - state.camY };
}
