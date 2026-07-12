import './style.css';
import { createViewport, resizeViewport } from './core/viewport';
import { initInput, consumeAttack, flowShown, getHoverTile } from './core/input';
import { updateCamera } from './core/camera';
import { freshState } from './sim/state';
import { recomputeFlow } from './sim/flowfield';
import { attack, updateProjectiles, updateArrows } from './sim/combat';
import { updateEffects } from './sim/effects';
import { updateWaves } from './sim/waves';
import { updatePlayer } from './entities/player';
import { updateEnemies } from './entities/enemy';
import { updatePeasants } from './entities/peasant';
import { updateStructures } from './entities/structure';
import { buildGround } from './render/ground';
import { render } from './render/renderer';
import { updateHUD, showBanner } from './ui/hud';
import { initBuildBar, selectTool } from './ui/buildbar';
import { initOverlays, showGameOver } from './ui/overlays';
import { ENGINE } from './data/config';

const cv = document.getElementById('game') as HTMLCanvasElement;
const vp = createViewport(cv);

/* стан пересоздається в startGame — модулі беруть його через getState */
let state = freshState();
recomputeFlow(state);

/* показ оверлея поразки: сим ставить state.over (hurtSich у combat.ts),
   DOM-частину показуємо з циклу — раз на гру */
let overShown = false;

initInput(cv, () => state);
initBuildBar(() => state);
initOverlays(() => {
  /* startGame() прототипу: новий стан, банер про перший набіг */
  state = freshState();
  recomputeFlow(state);
  state.running = true;
  selectTool(state, null);
  showBanner('Готуйся: перший набіг за 15 с');
  overShown = false;
});

addEventListener('resize', () => resizeViewport(vp));
resizeViewport(vp);

/* пререндер землі: як у прототипі — один раз, при першому resize */
const ground = buildGround(vp.dpr);

/* цикл — як у прототипі: dt обрізається, update тільки коли running */
let lastT = 0;
function loop(t: number): void {
  requestAnimationFrame(loop);
  const dt = Math.min(ENGINE.DT_MAX, (t - lastT) / 1000);
  lastT = t;
  const atk = consumeAttack();
  if (state.running && !state.over) {
    /* порядок систем — точно як в update() прототипу */
    state.time += dt;
    updateWaves(state, dt, showBanner);
    updatePlayer(state, dt);
    updateCamera(state, dt);
    if (atk) attack(state);
    updatePeasants(state, dt);
    updateEnemies(state, dt);
    updateStructures(state, dt);
    updateProjectiles(state, dt);
    updateArrows(state, dt);
    updateEffects(state, dt);
    /* рішення №3 (CLAUDE.md): updateHUD після update(dt), перед render() —
       порядок і частота як в update() прототипу */
    updateHUD(state);
  }
  render(vp, state, ground, getHoverTile(), flowShown());
  if (state.over && !overShown) {
    overShown = true;
    showGameOver(state);
  }
}
requestAnimationFrame(loop);
