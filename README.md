# Оборона Січі

2.5D ізометричний екшн + tower defense + економіка про оборону козацької Січі
в Дикому Полі XVII століття.

**▶ Грати:** https://eugenedev2.github.io/oborona-sichi/

Ти — козак Мамай. Орда суне хвилями з країв карти до Січі. Рубай її шаблею,
став частокіл і гармати, наймай селян і посилай їх по дерево, золото та
пшеницю. Орда шукає обхід навколо стін (flow-field pathfinding) — лиши
коридор і заведи її під гармати. Січ впала — гра закінчилась.

## Керування

| Дія | Клавіша / миша |
|---|---|
| Рух | WASD / стрілки (телефон — джойстик) |
| Удар шаблею | Пробіл, J або клік по порожньому місцю (телефон — 🗡) |
| Частокіл / гармата | 1 / 2, потім клік по клітинці |
| Скинути інструмент | Escape |
| Знести споруду | правий клік (повертає половину вартості) |
| Послати селянина | клік по лісу, копальні чи пшениці |
| Викликати хвилю раніше | кнопка «⚔ Хвиля!» |
| Дебаг шляху орди | F |

## Запуск

```bash
npm install
npm run dev        # dev-сервер (http://localhost:5173/oborona-sichi/)
npm run build      # tsc + продакшн-збірка в dist/
npm run preview    # переглянути збірку
npm run lint       # ESLint
npm run test:flow  # смоук-тест flow field
```

Деплой на GitHub Pages — автоматично з `main` (`.github/workflows/deploy.yml`).

## Стек і структура

Vite + TypeScript + Canvas 2D. Без фреймворків, без ECS.
UI — звичайний DOM поверх канваса.

```
src/
  main.ts     стан гри, game loop, склейка модулів
  core/       iso.ts camera.ts input.ts viewport.ts
  sim/        state.ts flowfield.ts waves.ts combat.ts effects.ts
  entities/   player.ts enemy.ts peasant.ts structure.ts
  render/     renderer.ts ground.ts entities.ts effects.ts   (стан не мутує)
  ui/         hud.ts buildbar.ts overlays.ts                 (DOM поверх канваса)
  data/       config.ts (увесь баланс) types.ts
```

## Документація

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — дизайн-документ
- [docs/ROADMAP.md](docs/ROADMAP.md) — план фаз Ф0–Ф4
- [docs/BACKLOG.md](docs/BACKLOG.md) — відомі баги, збережені свідомо
