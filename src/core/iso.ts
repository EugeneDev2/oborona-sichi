/* ============================================================
   Ізометрія та сітка — 1:1 з _prototype.html.
   Чисті функції: ox/oy не глобалки, а параметр Origin —
   на однакових входах завжди однаковий вихід.
   ============================================================ */
import { GW, GH, TW, TH, SICH } from '../data/config';

/** Екранний зсув початку ізометричних координат. Рахується камерою (core/camera.ts). */
export interface Origin {
  ox: number;
  oy: number;
}

/** Тайлові координати → екранний X. */
export const isoX = (o: Origin, x: number, y: number): number => o.ox + ((x - y) * TW) / 2;

/** Тайлові координати → екранний Y. */
export const isoY = (o: Origin, x: number, y: number): number => o.oy + ((x + y) * TH) / 2;

/** Екранна точка → тайл [tx, ty] (обернене до isoX/isoY). */
export function tileFromScreen(o: Origin, sx: number, sy: number): [number, number] {
  const a = (sx - o.ox) / (TW / 2),
    b = (sy - o.oy) / (TH / 2);
  return [Math.floor((a + b) / 2), Math.floor((b - a) / 2)];
}

/** Ключ тайла для Map (structures, mapRes). */
export const key = (x: number, y: number): string => x + ',' + y;

/** Індекс тайла в плоских масивах flow field. */
export const idx = (x: number, y: number): number => y * GW + x;

/** Чи тайл у межах сітки. */
export const inGrid = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < GW && y < GH;

/** Чи тайл — Січ. */
export const isSich = (x: number, y: number): boolean => x === SICH.tx && y === SICH.ty;
