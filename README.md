# The Great Tab Keeper
<img src="docs/chibi/chibi.png" width="500" height="500" alt="chibi">

Reduce tab clutter in chrome using plain-text tab rules, scheduled cleanup, archive restore.

open the dashboard from the toolbar icon. rules run automatically in background every 5 minutes; you can also hit **run now**.

## how to use this extension

not published to the chrome web store yet. install from a [github release](https://github.com/mhtocs/the-great-tab-keeper/releases) zip or build locally (see [setup](#setup)).

### install from a release

1. open [releases](https://github.com/mhtocs/the-great-tab-keeper/releases) and download `the-great-tab-keeper-v<version>.zip` for the version you want.
2. unzip it anywhere (e.g. downloads). you get one folder; that's the extension.
3. in chrome, open **extensions**, turn on **developer mode**, click **load unpacked**, and select that unzipped folder (the folder itself, not the zip file).
4. pin or open **The Great Tab Keeper** from the toolbar to open the dashboard. set rules, save, and leave the engine on for scheduled cleanup (or use **run now**).

to update later, download a newer zip, remove the old unpacked extension in chrome, and load the new folder (or replace the folder contents and hit **reload** on the extension card).

### build from source

see [setup](#setup). after `npm run build`, use the same **load unpacked** step and choose the `dist` folder in the repo.

## screenshots

### rules

editor with sample rules from tests: `keep`, `archive`, `discard`, `suspend`, plus `url=` and `inactive>`. one rule per line; engine toggle; save / run now.

![rules tab](docs/screenshots/rules.png)

### suspend

suspended tabs show the original title and url (plain text). reload restores the page; nothing goes to archive.

![suspended tab](docs/screenshots/suspend.png)

### archive

archived tabs land here. click a title to restore. grouped by day with the rule that archived each tab.

![archive tab](docs/screenshots/archive.png)

### logs

plain-text dev log in storage: cycles, archives, suspends, restores. not a per-tab audit trail.

![logs tab](docs/screenshots/logs.png)

### settings

evaluation interval and archive retention. saves immediately; interval change reschedules the alarm.

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

[published releases](https://github.com/mhtocs/the-great-tab-keeper/releases) include a zip of `dist/` for load unpacked in chrome.

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
