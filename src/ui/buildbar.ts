/* ============================================================
   Панель будови — selectTool() і обробники кнопок 1:1
   з прототипу. UI шле команди в сим, нічого не рахує сам.
   getState() — бо стан пересоздається в startGame.
   ============================================================ */
import { COST } from '../data/config';
import { startWave } from '../sim/waves';
import { spawnPeasant } from '../entities/peasant';
import { showBanner } from './hud';
import type { GameState, StructureType } from '../data/types';

const $ = (id: string): HTMLElement => document.getElementById(id)!;

/** Повторний вибір того ж інструмента — скидання (як у прототипі). */
export function selectTool(state: GameState, t: StructureType | null): void {
  state.tool = state.tool === t ? null : t;
  $('toolPal').classList.toggle('sel', state.tool === 'pal');
  $('toolCan').classList.toggle('sel', state.tool === 'can');
}

/** unfocus() прототипу: blur після кліку — інакше Пробіл
    "тикає" сфокусовану кнопку замість удару шаблею. */
function unfocus(el: HTMLElement): void {
  el.addEventListener('click', () => el.blur());
}

export function initBuildBar(getState: () => GameState): void {
  $('toolPal').onclick = () => selectTool(getState(), 'pal');
  $('toolCan').onclick = () => selectTool(getState(), 'can');
  $('waveBtn').onclick = () => {
    const state = getState();
    if (state.phase === 'build') startWave(state, showBanner);
  };

  $('toolPeas').onclick = () => {
    const state = getState();
    if (!state.running) return;
    if (state.res.grain >= COST.peas) {
      state.res.grain -= COST.peas;
      spawnPeasant(state);
    } else {
      showBanner('Мало зерна!');
    }
  };

  document.querySelectorAll('button').forEach(unfocus);
}
