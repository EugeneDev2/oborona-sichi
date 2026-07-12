/* ============================================================
   Пререндер землі — buildGround() 1:1 з прототипу.
   Фіксований світовий канвас 2400×1200, origin (1200, 60).
   Детермінований LCG: сід 9973, множники 16807 / 2147483647 —
   картинка однакова щоразу. НЕ МІНЯТИ.
   ============================================================ */
import { GW, GH, TW, TH, GROUND } from '../data/config';

export function buildGround(dpr: number): HTMLCanvasElement {
  const groundCv = document.createElement('canvas');
  const gw = GROUND.CANVAS_W,
    gh = GROUND.CANVAS_H;
  groundCv.width = gw * dpr;
  groundCv.height = gh * dpr;
  const g = groundCv.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  const gox = GROUND.ORIGIN_X;
  const goy = GROUND.ORIGIN_Y;

  let rng: number = GROUND.RNG_SEED;
  const rnd = (): number => (rng = (rng * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      const sx = gox + ((x - y) * TW) / 2;
      const sy = goy + ((x + y) * TH) / 2;
      const t = rnd();
      const base = (x + y) % 2 ? [116, 128, 62] : [107, 119, 56];
      g.fillStyle = `rgb(${(base[0] + t * 14) | 0},${(base[1] + t * 14) | 0},${(base[2] + t * 10) | 0})`;
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(sx + TW / 2, sy + TH / 2);
      g.lineTo(sx, sy + TH);
      g.lineTo(sx - TW / 2, sy + TH / 2);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(40,50,20,.25)';
      g.lineWidth = 1;
      g.stroke();
      for (let i = 0; i < 3; i++) {
        const gx = sx + (rnd() - 0.5) * TW * 0.6,
          gy = sy + TH * 0.35 + rnd() * TH * 0.45;
        g.strokeStyle = `rgba(${(170 + rnd() * 40) | 0},${(160 + rnd() * 30) | 0},90,.5)`;
        g.beginPath();
        g.moveTo(gx, gy);
        g.quadraticCurveTo(gx + 2, gy - 5, gx + (rnd() - 0.5) * 6, gy - 8 - rnd() * 4);
        g.stroke();
      }
    }
  return groundCv;
}
