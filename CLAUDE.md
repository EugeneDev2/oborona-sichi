# Оборона Січі

2.5D ізометричний екшн + tower defense + економіка. Дике Поле, XVII ст.
Козак Мамай захищає Січ від орди: шабля, частокіл, гармати, селяни-збирачі,
flow-field pathfinding.

## Стек
Vite + TypeScript + Canvas 2D. Без фреймворків. Без ECS.
UI — звичайний DOM поверх канваса.

## Статус: Ф0 завершено
Порт прототипу закінчено (П1–П12). Файл `_prototype.html` видалено з робочого
дерева — він лишився в git-історії (до коміту П12), при потребі:
`git show <коміт-до-П12>:_prototype.html`.

**ДЖЕРЕЛО ІСТИНИ ТЕПЕР — КОД у src/.** Далі — Ф1 за docs/ROADMAP.md.

## Правила
- Числа балансу (HP, швидкості, ціни, тайминги) живуть ТІЛЬКИ в data/config.ts
  і міняються ТІЛЬКИ на пряме прохання. Ніяких «заодно підкрутив».
- Відомі баги B1–B6 (docs/BACKLOG.md) збережені СВІДОМО. Не виправляти без
  прямого рішення. Бачиш нове неоптимальне — не чіпай, скажи словами,
  запишемо в бекЛог.
- Нові фічі — тільки за ROADMAP (Ф1+), не «за компанію» з іншою задачею.
- Кожен крок завершується робочою грою (npm run dev).

## Структура
src/
  main.ts   — стан, game loop (порядок систем НЕ міняти), склейка модулів
  core/     iso.ts camera.ts input.ts viewport.ts
  sim/      state.ts flowfield.ts waves.ts combat.ts effects.ts
  entities/ player.ts enemy.ts peasant.ts structure.ts
  render/   renderer.ts ground.ts entities.ts effects.ts
  ui/       hud.ts buildbar.ts overlays.ts
  data/     config.ts types.ts

## Інваріанти
- render/ НЕ мутує стан гри. Тільки читає. (sim/effects.ts частинки СТВОРЮЄ,
  render/effects.ts їх МАЛЮЄ — не плутати.)
- Усі магічні числа — тільки в data/config.ts. Піксельні координати спрайтів —
  не константи, це малюнок (render/entities.ts).
- КРИТИЧНО: dist у computeFlow — тільки Float64Array. НЕ МІНЯТИ на Float32 —
  похибка округлення робить частину карти недосяжною.
- Кадрозалежні кроки — навмисні, НЕ переводити на dt (див. B6 у BACKLOG):
  s.fire -= 0.016 за кадр (updateStructures), фізика частинок за кадр
  (updateEffects).
- UI читає стан і шле команди. Нічого не рахує сам.

## Успадковані рішення порту (вже вшиті в код)
1. Декей s.fire — в updateStructures, не в drawCannon (за кадр, не dt).
2. drawCossack читає p.walking зі стану; прапорець ставить updatePlayer.
3. updateHUD викликається з game loop: після update-систем, перед render(),
   тільки коли гра йде.
4. Атака (Пробіл/J/клік/тач) іде через прапорець consumeAttack —
   максимум один кадр затримки проти синхронного виклику в прототипі.
