import './style.css';

const cv = document.getElementById('game') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;

let dpr = 1;

/* resize() — 1:1 з прототипу (без buildGround, його ще нема) */
function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  cv.style.width = innerWidth + 'px';
  cv.style.height = innerHeight + 'px';
  draw();
}
addEventListener('resize', resize);

function draw(): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#151a10';
  ctx.fillRect(0, 0, innerWidth, innerHeight);
}

resize();
