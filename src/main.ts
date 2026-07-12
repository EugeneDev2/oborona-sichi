import './style.css';
import { createViewport, resizeViewport } from './core/viewport';

const cv = document.getElementById('game') as HTMLCanvasElement;
const vp = createViewport(cv);

/* Тимчасова заливка, поки нема render/ — гра ще не портована */
function draw(): void {
  vp.ctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
  vp.ctx.fillStyle = '#151a10';
  vp.ctx.fillRect(0, 0, innerWidth, innerHeight);
}

addEventListener('resize', () => {
  resizeViewport(vp);
  draw();
});

resizeViewport(vp);
draw();
