/* ============================================================
   HUD — updateHUD() і showBanner() 1:1 з прототипу.
   Читає стан, пише ТІЛЬКИ в DOM. Нічого не рахує сам.
   Викликається з game loop у main.ts: після update(dt),
   перед render() — рішення №3 (CLAUDE.md).
   ============================================================ */
import { COST, ENGINE } from '../data/config';
import type { GameState } from '../data/types';

const $ = (id: string): HTMLElement => document.getElementById(id)!;

export function updateHUD(state: GameState): void {
  $('waveN').textContent = String(state.wave);
  $('phaseT').textContent =
    state.phase === 'build'
      ? 'будова'
      : state.spawnQueue.length + state.enemies.length + ' ворогів';

  $('woodN').textContent = String(state.res.wood);
  $('goldN').textContent = String(state.res.gold);
  $('grainN').textContent = String(state.res.grain);

  $('sichFill').style.width = (state.sichHp / state.sichMax) * 100 + '%';
  $('hpFill').style.width = (state.player.hp / state.player.max) * 100 + '%';
  ($('waveBtn') as HTMLButtonElement).disabled = state.phase !== 'build';
  $('waveTimer').textContent = state.phase === 'build' ? Math.ceil(state.phaseT) + ' с' : '—';

  ($('toolPal') as HTMLButtonElement).disabled = state.res.wood < COST.pal && state.tool !== 'pal';
  ($('toolCan') as HTMLButtonElement).disabled = state.res.gold < COST.can && state.tool !== 'can';
  ($('toolPeas') as HTMLButtonElement).disabled = state.res.grain < COST.peas;
}

let bannerT: ReturnType<typeof setTimeout> | null = null;

export function showBanner(t: string): void {
  const b = $('banner');
  b.textContent = t;
  b.style.opacity = '1';
  if (bannerT) clearTimeout(bannerT);
  bannerT = setTimeout(() => (b.style.opacity = '0'), ENGINE.BANNER_MS);
}
