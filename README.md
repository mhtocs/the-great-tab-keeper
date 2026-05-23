# tabcleaner

chrome extension: plain-text tab rules, scheduled cleanup, graveyard restore, dev logs.

open the dashboard from the toolbar icon. rules run on an alarm; you can also hit **run now**.

## screenshots

captured from the built extension in headed chromium (`npm run screenshots:readme`).

### rules

default editor: one rule per line, engine toggle, save / run now. header shows engine state, graveyard count, next run, last run.

![rules tab](docs/screenshots/rules.png)

### graveyard

closed tabs land here. click a title to restore. grouped by day with the rule that closed each tab.

![graveyard tab](docs/screenshots/graveyard.png)

### logs

plain-text dev log in storage — cycles, closes, restores. not a per-tab audit trail.

![logs tab](docs/screenshots/logs.png)

### settings

evaluation interval and graveyard retention. saves immediately; interval change reschedules the alarm.

![settings tab](docs/screenshots/settings.png)

## setup

```bash
npm install
npm run build
```

load unpacked from `dist/` in chrome: extensions → developer mode → load unpacked → choose the `dist/` folder.

iterative builds: `npm run watch` rebuilds `dist/` on change; reload the extension after each build.

## commands

| command | purpose |
| ------- | ------- |
| `npm run build` | production build to `dist/` |
| `npm test` | `lib/**` unit tests |
| `npm run test:ui` | vue component tests |
| `npm run test:e2e` | playwright + loaded extension (headed) |
| `npm run verify` | build + unit + ui + lint + e2e |
| `npm run screenshots:readme` | refresh `docs/screenshots/` for this file |

## license

MIT — see [LICENSE](LICENSE).
