/* ============================================================
   УСІ магічні числа з _prototype.html. Значення НЕ МІНЯТИ.
   Піксельні координати спрайтів (fillRect/arc у draw-функціях)
   сюди не переносяться — це малюнок, а не параметри.
   ============================================================ */
import type { EnemyType, ResourceType } from './types';

/* ---------- сітка та ізометрія ---------- */
export const GW = 31;
export const GH = 31;
export const TW = 64;
export const TH = 32;
export const SICH = { tx: 15, ty: 15, cx: 15.5, cy: 15.5 } as const;

/* ---------- ціни та ресурси ---------- */
export const COST = { pal: 15, can: 40, peas: 20 } as const;

export const RES_START: Record<ResourceType, number> = { wood: 50, gold: 50, grain: 40 };

/* Генерація ресурсів на карті (freshState/addRes) */
export const MAP_RES = {
  GOLD_COUNT: 2, // рівно 2 копальні на всю карту
  WOOD_COUNT: 80,
  GRAIN_COUNT: 60,
  MIN_DIST_SICH: 3, // квадрат Чебишева навколо Січі, куди ресурси не спавняться
} as const;

/* ---------- Січ ---------- */
export const SICH_HP = 600;

/* ---------- вороги: статки (ETYPES) ---------- */
export interface EnemyStats {
  hp: number;
  spd: number;
  dmg: number;
  reward: number;
  r: number;
  range?: number; // тільки archer
  kite?: number; // тільки archer
}
export const ETYPES: Record<EnemyType, EnemyStats> = {
  foot: { hp: 42, spd: 1.15, dmg: 9, reward: 2, r: 0.34 },
  rider: { hp: 70, spd: 1.9, dmg: 12, reward: 5, r: 0.4 },
  archer: { hp: 34, spd: 1.05, dmg: 8, reward: 3, r: 0.32, range: 4.2, kite: 2.6 },
  murza: { hp: 210, spd: 0.85, dmg: 22, reward: 15, r: 0.46 },
};

/* ---------- вороги: спавн і поведінка ---------- */
export const ENEMY = {
  SPD_BASE: 0.9, // spd * (0.9 + random * 0.2) → розкид ±10%
  SPD_SPREAD: 0.2,
  SPAWN_EDGE_OFFSET: 0.5, // спавн за краєм карти: -0.5 або GW/GH + 0.5
  STEP_RANDOM: 7, // початкова фаза анімації: random() * 7
  STEP_ANIM: 8, // e.step += dt * 8 * e.spd
  MELEE_PLAYER_DIST: 0.95, // ближній бій з козаком
  MELEE_PLAYER_CD: 1,
  SICH_DIST: 1.25, // атака Січі
  SICH_CD: 1.1,
  AGGRO_DIST: 2.2, // близький козак дражнить (крім мурзи)
  STRUCT_CD: 0.9, // ламання споруди (звичайні)
  STRUCT_CD_ARCHER: 1.0, // ламання споруди (лучник)
  SEPARATION_DIST: 0.55, // розштовхування ворогів
  SEPARATION_FORCE: 0.45,
  CLAMP_MARGIN: 1, // clamp позиції: -1 .. GW+1
  FLASH: 0.12, // спалах при пораненні
} as const;

/* ---------- лучник ---------- */
export const ARCHER = {
  SHOOT_CD: 1.8,
  DRAW_TIME: 0.35, // натяг тятиви (анімація)
  ARROW_SPEED: 6.5,
  ARROW_Z: 22,
  ARROW_LIFE: 1.4,
  ARROW_HIT_PLAYER: 0.4, // радіус влучання стріли в козака
  ARROW_HIT_SICH: 0.7, // радіус влучання стріли в Січ
} as const;

/* ---------- хвилі ---------- */
export const WAVES = {
  FIRST_BUILD_TIME: 15, // перша фаза будови
  BUILD_TIME: 16, // наступні фази будови
  SPAWN_INTERVAL: 0.75, // інтервал спавну в хвилі
  FIRST_SPAWN_DELAY: 0.4, // затримка першого спавну (startWave)
  BONUS_BASE: 15, // бонус за відбиту хвилю: 15 + wave*5
  BONUS_PER_WAVE: 5,
  COUNT_BASE: 4, // кількість ворогів: 4 + floor(n*2.4)
  COUNT_PER_WAVE: 2.4,
  ARCHER_FROM_WAVE: 2, // n>=2 && r<.22 → archer
  ARCHER_P: 0.22,
  RIDER_FROM_WAVE: 3, // n>=3 && r<.45 → rider
  RIDER_P: 0.45,
  MURZA_FROM_WAVE: 5, // n>=5 && r<.55 → murza
  MURZA_P: 0.55,
  MURZA_EVERY: 4, // кожна 4-та хвиля — гарантований мурза
} as const;

/* ---------- flow field ---------- */
export const FLOW = {
  WALL_COST: 14, // ціна стіни/ресурсу для звичайних ворогів
  WALL_COST_BRUTE: 3, // ціна для мурз — ті майже не обходять
  DIAG: 1.414, // множник діагонального кроку
} as const;

/* ---------- козак ---------- */
export const PLAYER = {
  START_X: 15.5, // стартова позиція = точка респавну
  START_Y: 18.2,
  HP: 100,
  SPD: 3.3,
  REGEN_HP_PER_S: 3, // реген 3 HP/с...
  REGEN_DELAY: 4, // ...після 4 с без поранень
  RESPAWN_TIME: 3,
  INV_TIME: 1.6, // i-frames після респавну
  STEP_ANIM: 10, // p.step += dt * 10
  CLAMP_MARGIN: 0.25, // clamp позиції: 0.25 .. GW-0.25
  HURT_SHAKE: 4,
  LAST_HIT_INIT: 99, // стартове lastHit у freshState — "давно не били", реген доступний одразу
} as const;

export const ATTACK = {
  CD: 0.34,
  SWING_TIME: 0.22, // тривалість анімації маху
  RADIUS: 1.25,
  DOT: 0.15, // фронтальна дуга: dot > 0.15...
  CLOSE: 0.5, // ...або впритул d < 0.5
  DMG: 30,
  KNOCKBACK: 0.35,
  HIT_SHAKE: 2,
} as const;

/* ---------- споруди ---------- */
export const STRUCT = {
  PAL_HP: 130,
  CAN_HP: 85,
  CAN_START_CD: 0.5, // гармата після побудови мовчить пів секунди
  REFUND_DIV: 2, // знесення: floor(cost / 2)
  FLASH: 0.12,
} as const;

/* ---------- гармата ---------- */
export const CANNON = {
  RANGE: 3.6,
  CD: 1.25,
  FIRE_FLASH: 0.12, // s.fire при пострілі
  FIRE_DECAY: 0.016, // згасання s.fire ЗА КАДР, НЕ dt (рішення №1 у CLAUDE.md)
  BALL_SPEED: 7.5,
  BALL_Z: 26,
  BALL_DMG: 26,
  BALL_LIFE: 1.2,
  HIT_PAD: 0.15, // влучання: d < e.r + 0.15
  EXPLODE_RADIUS: 1.8,
  EXPLODE_FORCE: 0.25, // відкидання вибухом
  FIRE_SHAKE: 1.5,
  EXPLODE_SHAKE: 6,
} as const;

/* ---------- селянин ---------- */
export const PEASANT = {
  SPD: 1.8,
  SPAWN_OFFSET_Y: 1, // зʼявляється на (SICH.cx, SICH.cy + 1)
  ARRIVE_RES_DIST: 1.4, // дійшов до ресурсу
  ARRIVE_SICH_DIST: 1.5, // доніс до Січі
  GATHER_TIME: 2.0,
  CARRY_AMOUNT: 5, // +5 ресурсу за ходку
  GATHER_PUFF_P: 0.1, // шанс частинок на кадр під час збору
  STEP_ANIM: 8,
} as const;

/* ---------- камера ---------- */
export const CAMERA = {
  LERP: 5, // cam += (target - cam) * 5 * dt
} as const;

/* ---------- шкода: спалахи і трясіння ---------- */
export const SICH_FX = {
  FLASH: 0.15,
  HURT_SHAKE: 3,
} as const;

/* ---------- ефекти ---------- */
export const FX = {
  SHAKE_DECAY: 14, // shake -= 14 * dt
  FLOATER_RISE: 26, // floater.z += 26 * dt
  /* puff(): параметри за замовчуванням і фізика частинок */
  PUFF_SPD_DEFAULT: 2.2,
  PUFF_UP_DEFAULT: 3,
  PART_Z_MIN: 8, // z: 8 + random * 10
  PART_Z_SPREAD: 10,
  PART_VY_FACTOR: 0.5, // vy стиснуто вдвічі (ізометрія)
  PART_LIFE_MIN: 0.5, // life: 0.5 + random * 0.4
  PART_LIFE_SPREAD: 0.4,
  PART_LIFE_MAX: 0.9, // поле max у частинки
  PART_SIZE_MIN: 2, // size: 2 + random * 3
  PART_SIZE_SPREAD: 3,
  PART_GRAVITY: 0.3, // vz -= 0.3 за кадр
} as const;

/* ---------- рушій / введення ---------- */
export const ENGINE = {
  DT_MAX: 0.05, // обрізання dt у циклі
  DPR_MAX: 2, // обрізання devicePixelRatio
  BANNER_MS: 2200, // час показу банера
} as const;

export const INPUT = {
  STICK_RADIUS: 44, // максимальний хід ручки джойстика, px
} as const;

/* ---------- пререндер землі ---------- */
export const GROUND = {
  CANVAS_W: 2400, // фіксований світовий канвас
  CANVAS_H: 1200,
  ORIGIN_X: 1200, // origin ізометрії всередині канваса
  ORIGIN_Y: 60,
  RNG_SEED: 9973, // сід детермінованого LCG (множник 16807 — у алгоритмі)
} as const;
