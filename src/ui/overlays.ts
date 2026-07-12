/* ============================================================
   Оверлеї — startGame() і DOM-частина gameOver() з прототипу.
   Створення нового стану — колбек із main.ts (стан живе там);
   сим-частина gameOver (state.over, running=false) — у combat.ts.
   ============================================================ */
import type { GameState } from '../data/types';

const $ = (id: string): HTMLElement => document.getElementById(id)!;

/** "До бою!" і "Ще раз!" — обидві кнопки стартують гру заново,
    як у прототипі ($('startBtn').onclick = $('againBtn').onclick = startGame). */
export function initOverlays(startGame: () => void): void {
  const start = (): void => {
    startGame();
    $('startOv').classList.add('hidden');
    $('endOv').classList.add('hidden');
  };
  $('startBtn').onclick = start;
  $('againBtn').onclick = start;
}

/** DOM-частина gameOver() прототипу: заголовок, статистика, оверлей. */
export function showGameOver(state: GameState): void {
  $('endTitle').textContent = 'Січ впала…';
  $('stats').innerHTML =
    `Ти протримався до <b>${state.wave}-ї хвилі</b><br>і порубав <b>${state.kills}</b> ворогів.`;
  $('endOv').classList.remove('hidden');
}
