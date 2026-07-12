/* ============================================================
   Стан гри — freshState() і blocked(), 1:1 з _prototype.html.
   ============================================================ */
import { GW, GH, SICH, MAP_RES, RES_START, SICH_HP, WAVES, PLAYER } from '../data/config';
import { key, inGrid, isSich } from '../core/iso';
import { cameraAt } from '../core/camera';
import type { GameState, ResourceNode, ResourceType } from '../data/types';

export function freshState(): GameState {
  const startX = PLAYER.START_X,
    startY = PLAYER.START_Y;

  // Генерація ресурсів на карті: Math.random(), БЕЗ сіда — карта щоразу різна
  const mapRes = new Map<string, ResourceNode>();
  const addRes = (type: ResourceType, count: number): void => {
    let placed = 0;
    while (placed < count) {
      const tx = Math.floor(Math.random() * GW);
      const ty = Math.floor(Math.random() * GH);
      // Не спавнимо ресурси впритул до Січі (квадрат Чебишева)
      if (
        Math.abs(tx - SICH.tx) <= MAP_RES.MIN_DIST_SICH &&
        Math.abs(ty - SICH.ty) <= MAP_RES.MIN_DIST_SICH
      )
        continue;
      const k = key(tx, ty);
      if (!mapRes.has(k)) {
        mapRes.set(k, { type, tx, ty });
        placed++;
      }
    }
  };

  addRes('gold', MAP_RES.GOLD_COUNT); // Рівно 2 копальні на всю карту!
  addRes('wood', MAP_RES.WOOD_COUNT); // Багато лісу
  addRes('grain', MAP_RES.GRAIN_COUNT); // Багато пшениці

  const { camX, camY } = cameraAt(startX, startY);

  return {
    running: false,
    over: false,
    wave: 1,
    phase: 'build',
    phaseT: WAVES.FIRST_BUILD_TIME,
    spawnQueue: [],
    spawnT: 0,
    res: { ...RES_START },
    kills: 0,
    sichHp: SICH_HP,
    sichMax: SICH_HP,
    sichFlash: 0,
    structures: new Map(),
    mapRes: mapRes,
    enemies: [],
    projectiles: [],
    arrows: [],
    particles: [],
    floaters: [],
    peasants: [],
    player: {
      x: startX,
      y: startY,
      hp: PLAYER.HP,
      max: PLAYER.HP,
      fx: 0,
      fy: 1,
      mvx: 0,
      mvy: 0,
      atkCd: 0,
      swing: 0,
      dead: 0,
      inv: 0,
      lastHit: PLAYER.LAST_HIT_INIT,
      step: 0,
      walking: false,
    },
    camX,
    camY,
    tool: null,
    shake: 0,
    time: 0,
    flow: null,
    flowBrute: null,
  };
}

/** Чи тайл непрохідний. НЮАНС (як у прототипі): поза сіткою — false,
    вороги вільно заходять з-за краю карти. */
export function blocked(state: GameState, tx: number, ty: number): boolean {
  if (!inGrid(tx, ty)) return false;
  if (isSich(tx, ty)) return true;
  if (state.structures.has(key(tx, ty))) return true;
  if (state.mapRes.has(key(tx, ty))) return true; // Ресурси теж блокують рух (як стіни)
  return false;
}
