# The Great Tab Keeper

chrome extension: plain-text tab rules, scheduled cleanup, graveyard restore, dev logs.

open the dashboard from the toolbar icon. rules run on an alarm; you can also hit **run now**.

## how to use this extension

not published to the chrome web store yet. install from a [github release](https://github.com/mhtocs/tabcleaner/releases) zip (when available) or build locally (see [setup](#setup)).

### install from a release

1. open [releases](https://github.com/mhtocs/tabcleaner/releases) and download `the-great-tab-keeper-v<version>.zip` for the version you want.
2. unzip it anywhere (e.g. downloads). you get one folder; that's the extension.
3. in chrome, open **extensions**, turn on **developer mode**, click **load unpacked**, and select that unzipped folder (the folder itself, not the zip file).
4. pin or open **The Great Tab Keeper** from the toolbar to open the dashboard. set rules, save, and leave the engine on for scheduled cleanup (or use **run now**).

to update later, download a newer zip, remove the old unpacked extension in chrome, and load the new folder (or replace the folder contents and hit **reload** on the extension card).

### build from source

see [setup](#setup). after `npm run build`, use the same **load unpacked** step and choose the `dist` folder in the repo.

## screenshots

captured from the built extension in headed chromium (`npm run screenshots:readme`).

### rules

editor with sample rules from tests: `keep`, `close`, `discard`, `sleep`, plus `url=` and `inactive>`. one rule per line; engine toggle; save / run now.

![rules tab](docs/screenshots/rules.png)

### sleep

slept tabs show the original title and url (plain text). reload restores the page; nothing goes to graveyard.

![slept tab](docs/screenshots/sleep.png)

### graveyard

closed tabs land here. click a title to restore. grouped by day with the rule that closed each tab.

![graveyard tab](docs/screenshots/graveyard.png)

### logs

plain-text dev log in storage: cycles, closes, sleeps, restores. not a per-tab audit trail.

![logs tab](docs/screenshots/logs.png)

### settings

evaluation interval and graveyard retention. saves immediately; interval change reschedules the alarm.

![settings tab](docs/screenshots/settings.png)

## setup

```bash
npm install
npm run build          # output in ./dist/
```

```bash
npm test
npm run test:ui
npm run lint
npm run verify         # build + unit + ui + lint + e2e (e2e needs headed playwright)
```

iterative builds: `npm run watch` rebuilds `dist/` on change; reload the extension after each build.

load unpacked from `dist/` in chrome: open extensions, enable developer mode, load unpacked, and choose the `dist/` folder.

ci on push/pr runs `npm ci`, build, unit, ui, and lint (see `.github/workflows/ci.yml`). (e2e is local only, headed playwright + mv3)

### playwright (e2e / screenshots only)

`test:e2e`, `verify`, and `screenshots:readme` load the extension in playwright’s chromium (headed). (this browser is separate from your daily chrome profile)

after `npm install`, run:

```bash
npx playwright install chromium
```

you do not need this to build the extension or load `dist/` in chrome.

### releases

[published releases](https://github.com/mhtocs/tabcleaner/releases) include a zip of `dist/` for load unpacked in chrome.

tag must match `package.json` version (e.g. tag `v0.0.1` and `"version": "0.0.1"`):

```bash
git tag v0.0.1
git push origin v0.0.1
```

github actions builds, tests, and attaches `the-great-tab-keeper-v0.0.1.zip`.

## commands

| command | purpose |
| ------- | ------- |
| `npm run build` | production build to `dist/` |
| `npm test` | `lib/**` unit tests |
| `npm run test:ui` | vue component tests |
| `npm run test:e2e` | playwright + loaded extension (headed) |
| `npm run verify` | build + unit + ui + lint + e2e |
| `npm run screenshots:readme` | refresh `docs/screenshots/` for this file |
| `./scripts/package-extension.sh` | zip `dist/` to `the-great-tab-keeper-v<version>.zip` |

## license

MIT. see [LICENSE](LICENSE).
