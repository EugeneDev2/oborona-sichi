/* ============================================================
   Ввід — мінімум для П9а: клавіатура (WASD/стрілки + атака).
   Миша, тач-джойстик, вибір інструментів — П11.
   keys — модульний стан, як глобалка у прототипі.
   ============================================================ */

const keys: Record<string, boolean> = {};
let attackPressed = false;

export function initInput(): void {
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'KeyJ') {
      e.preventDefault();
      attackPressed = true;
    }
  });
  addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
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

/** Прапорець атаки (Пробіл/J): у прототипі attack() викликався прямо
    з keydown; тут кадр знімає прапорець і викликає attack() сам. */
export function consumeAttack(): boolean {
  const a = attackPressed;
  attackPressed = false;
  return a;
}
