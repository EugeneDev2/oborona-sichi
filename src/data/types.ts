/* ============================================================
   Типи виведені СТРОГО з обʼєктів _prototype.html.
   Жодних полів "на майбутнє". Джерело кожного типу вказано
   в коментарі. Нуль логіки.
   ============================================================ */

/** Ключі ETYPES у прототипі. */
export type EnemyType = 'foot' | 'rider' | 'archer' | 'murza';

/** Типи ресурсних тайлів (addRes у freshState). */
export type ResourceType = 'wood' | 'gold' | 'grain';

/** Типи споруд (COST.pal / COST.can, tryBuild). */
export type StructureType = 'pal' | 'can';

/** Стани селянина (spawnPeasant + гілки ШІ селян в update). */
export type PeasantState = 'idle' | 'moving_to_res' | 'gathering' | 'moving_to_sich';

/** G.player у freshState. */
export interface Player {
  x: number;
  y: number;
  hp: number;
  max: number;
  fx: number;
  fy: number;
  mvx: number;
  mvy: number;
  atkCd: number;
  swing: number;
  dead: number;
  inv: number;
  lastHit: number;
  step: number;
  /** Рішення №2 (CLAUDE.md): у прототипі рахувався в drawCossack з keysVec();
      тут виставляється в updatePlayer, рендер тільки читає. */
  walking: boolean;
}

/** Обʼєкт із spawnEnemy. */
export interface Enemy {
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  max: number;
  spd: number;
  dmg: number;
  r: number;
  cd: number;
  flash: number;
  step: number;
  fx: number;
  fy: number;
  range: number;
  kite: number;
  draw: number;
  /** Ставиться в hurtEnemy при смерті; фільтрується в update. */
  deadFlag?: boolean;
}

/** Обʼєкт із spawnPeasant; target призначається в assignPeasant. */
export interface Peasant {
  x: number;
  y: number;
  spd: number;
  state: PeasantState;
  target: { x: number; y: number; type: ResourceType; k: string } | null;
  carryType: ResourceType | null;
  timer: number;
  step: number;
  fx: number;
  fy: number;
}

/** Значення G.structures (tryBuild). fire є тільки в гармати. */
export interface Structure {
  type: StructureType;
  hp: number;
  max: number;
  cd: number;
  flash: number;
  fire?: number;
}

/** Значення G.mapRes (addRes у freshState). */
export interface ResourceNode {
  type: ResourceType;
  tx: number;
  ty: number;
}

/** Обʼєкт із puff(). */
export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

/** Обʼєкт із floater(). */
export interface Floater {
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  life: number;
}

/** Ядро гармати (push у G.projectiles в update). */
export interface Projectile {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  dmg: number;
  life: number;
}

/** Стріла лучника (push у G.arrows). tgt: 'p' — козак, 's' — Січ. */
export interface Arrow {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  dmg: number;
  life: number;
  tgt: 'p' | 's';
}

/** Результат computeFlow. dist — ТІЛЬКИ Float64Array (див. CLAUDE.md). */
export interface FlowField {
  dist: Float64Array;
  dir: Int8Array;
}

/** Обʼєкт із freshState(). */
export interface GameState {
  running: boolean;
  over: boolean;
  wave: number;
  phase: 'build' | 'wave';
  phaseT: number;
  spawnQueue: EnemyType[];
  spawnT: number;
  res: Record<ResourceType, number>;
  kills: number;
  sichHp: number;
  sichMax: number;
  sichFlash: number;
  structures: Map<string, Structure>;
  mapRes: Map<string, ResourceNode>;
  enemies: Enemy[];
  projectiles: Projectile[];
  arrows: Arrow[];
  particles: Particle[];
  floaters: Floater[];
  peasants: Peasant[];
  player: Player;
  camX: number;
  camY: number;
  tool: StructureType | null;
  shake: number;
  time: number;
  flow: FlowField | null;
  flowBrute: FlowField | null;
}
