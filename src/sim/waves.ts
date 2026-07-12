/* ============================================================
   Хвилі — makeWave(), startWave() і фазова машина build/wave
   з верхівки update() прототипу. 1:1.

   Банер — DOM, тому сим його не чіпає: приймає колбек showBanner
   (його дає ui/hud.ts, поки що TEMP у main.ts).
   ============================================================ */
import { WAVES } from '../data/config';
import { spawnEnemy } from '../entities/enemy';
import type { EnemyType, GameState } from '../data/types';

export type ShowBanner = (text: string) => void;

export function makeWave(n: number): EnemyType[] {
  const q: EnemyType[] = [];
  const count = WAVES.COUNT_BASE + Math.floor(n * WAVES.COUNT_PER_WAVE);
  for (let i = 0; i < count; i++) {
    let t: EnemyType = 'foot';
    const r = Math.random();
    if (n >= WAVES.ARCHER_FROM_WAVE && r < WAVES.ARCHER_P) t = 'archer';
    else if (n >= WAVES.RIDER_FROM_WAVE && r < WAVES.RIDER_P) t = 'rider';
    else if (n >= WAVES.MURZA_FROM_WAVE && r < WAVES.MURZA_P) t = 'murza';
    q.push(t);
  }
  if (n % WAVES.MURZA_EVERY === 0) q.push('murza');
  return q;
}

export function startWave(state: GameState, showBanner: ShowBanner): void {
  state.phase = 'wave';
  state.spawnQueue = makeWave(state.wave);
  state.spawnT = WAVES.FIRST_SPAWN_DELAY;
  showBanner('Хвиля ' + state.wave + ' — орда суне!');
}

/** Фазова машина з верхівки update() прототипу. */
export function updateWaves(state: GameState, dt: number, showBanner: ShowBanner): void {
  if (state.phase === 'build') {
    state.phaseT -= dt;
    if (state.phaseT <= 0) startWave(state, showBanner);
  } else {
    if (state.spawnQueue.length) {
      state.spawnT -= dt;
      if (state.spawnT <= 0) {
        spawnEnemy(state, state.spawnQueue.shift()!);
        state.spawnT = WAVES.SPAWN_INTERVAL;
      }
    } else if (state.enemies.length === 0) {
      const bonus = WAVES.BONUS_BASE + state.wave * WAVES.BONUS_PER_WAVE;
      state.res.gold += bonus;
      showBanner('Набіг відбито! +' + bonus + ' 🪙');
      state.wave++;
      state.phase = 'build';
      state.phaseT = WAVES.BUILD_TIME;
    }
  }
}
