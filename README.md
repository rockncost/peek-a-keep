# Peek-a-Keep

A portrait 3D castle game about knowing when to disappear. Pop up to fire at an approaching siege army, then sink your whole castle underground before its cannonballs arrive. A last-moment duck earns a powered return volley. Hiding forever will not save you: siege carts keep rolling toward the gate.

Thirteen sieges introduce nine engines, ending with the Moving Fortress boss. Choose campaign routes through a bridge, mountain pass, or royal courtyard, then replay in endless defense, a date-seeded daily siege, and optional challenges. Progress, scores, routes, equipment, castle colors, and sound settings are saved locally in your browser. The game uses simple geometric models, bundled Three.js, synthesized effects, and the supplied **Hammer and Gate** background track; it makes no external network requests at runtime.

## Controls

- **Hold touch, left mouse button, or Space:** hide the castle.
- **Release:** rise and fire automatically.
- **P or Escape:** pause or resume.
- **Sound button:** toggle music and effects, including from menus. Audio starts after the first interaction. The looping music pauses with the siege or when the page is hidden, then resumes from the same position.
- **Settings** on the title or pause menu: adjust music and sound effects separately, preview the cannon blast, or reset the volumes. Changes are saved automatically.

Designed for portrait phones, with mouse and keyboard support on desktop. A modern browser with WebGL2 is required.

Ordinary arrows deal **1 damage**. Last-second ducks charge the next arrow for **2 damage**, shown by a larger cyan projectile and cyan damage number. Every full-health enemy needs multiple hits; an injured enemy can still be finished by one arrow. Early ducks are safe, but do not earn the bonus and consume valuable firing time. Three hits or breaches end a siege; victory restores your hearts for the next one. Enemies signal a shot with a glowing fuse and ground ring. Twin cannons fire twice; volley carts fire three spaced shots. Use the **Enemy guide** on the title or pause menu for their strengths.

## Version 1.4: The Moving Fortress

The original ten base formations are preserved. Three new sieges follow them:

- **11 · The decoy battery:** a 6-HP mortar launches high, slow shells. Watch the landing ring and listen for the descending whistle before impact. It appears alone before other engines join.
- **12 · The convoy:** a 5-HP repair wagon heals injured engines close to it by one HP, up to three times. Its green banner opens for three seconds after a successful repair; archers automatically prioritize it then.
- **13 · The Moving Fortress:** a 40-HP rolling castle. Its armored salvo blocks arrows. Release during the golden weak-point reload to deal damage. At half health it turns red and fires three shells per salvo. At one-quarter health it stops firing and advances as a ram. The boss bar shows health and phase.

After sieges 3, 6, and 9, choose an upgrade and a route for the next three sieges. Each route shows its rule and a suggested upgrade. Routes can be changed from **Choose a siege**:

| Route | Rule |
| --- | --- |
| River crossing | A visible narrow bridge slows and queues engines. Its formation replaces one light cannon with an ironclad. |
| Mountain pass | Enemies take a slower winding approach; artillery shells fly 15% longer. |
| Royal courtyard | Engines alternate between two marked lanes, with an extra ram. |

**More defenses** opens replay modes. All allow choosing an upgrade before starting, except the challenge that disables it:

- **Endless defense:** deterministic escalating formations, with tougher compositions before extra HP. Hearts carry between rounds. Every three victories restore three hearts and offer refitting; every ninth round is a fortress. Local best score and cleared round are saved. Restart begins a fresh run.
- **Daily siege:** everyone receives the same date-seeded formation and terrain. The date changes at midnight UTC and stays fixed when retrying a run. The last 14 dates' local best winning scores are kept; there is no online leaderboard.
- **Challenge banners:** two hearts, no upgrades, or a four-ram convoy. They have separate local scores and do not unlock campaign sieges.

**Castle colors** rewards successful defenses: emerald for three hearts, copper for destroying a ram without any ram breach, and violet for a streak of five perfect ducks. Colors affect the keep's cloth and flags only. Rewards can be earned in any mode.

Existing saves keep their progress, scores, upgrade and actual audio levels. Completing the old tenth siege unlocks siege 11 automatically. The expansion uses the same hold/release control throughout.

## Version 1.3.1: volume display

Both sliders now show **100%** at the existing default loudness. This changes the UI scale only: music still uses the same 0.08 playback gain and SFX the same 0.8 master gain. A 50% slider setting means half of that channel's established level. Saved playback levels are preserved, including silence and older louder choices; the latter retain a stable custom UI ceiling. Reset restores the established mix and shows 100% for both.

See [EXPANSION_PLAN.md](EXPANSION_PLAN.md) for the expansion design and remaining ideas.

## Version 1.3: quiet music and powerful cannons

- Music defaults to **8%**, down from 34%. Sound effects default to **80%**. Existing saves without volume settings receive these defaults; explicit choices, including 0%, are preserved.
- Separate **Music** and **Sound effects** sliders range from 0–100%. Master mute keeps your slider values, and **Reset volumes** restores the defaults without changing progress or upgrades.
- Cannons now make a synthesized **Pphhh-BOOM**: a short air rush, ignition crack, dropping bass boom, and filtered rumble. Ironclads have a deeper, longer blast. Ballistas retain a separate sharp firing sound.
- All effects share the SFX volume control and a compressor that tames overlapping cannon salvos. Audio nodes disconnect when finished. No additional sound files or network requests are needed.
- Settings opened during a siege keep it paused. The cannon preview lets you try the SFX level while the background track remains paused.

## Version 1.2: castle workshop and music

Win siege **3** to open the workshop before siege 4. Choose **one** upgrade:

| Upgrade | Effect | Tradeoff |
| --- | --- | --- |
| **Counterweight** | Rise speed increases from 4 to 6: **50% faster**. | More firing time after each duck; duck speed and enemy warnings are unchanged. |
| **Twin archers** | Fire every **0.55 seconds**, instead of 0.68: about **24% more often**. | Better sustained damage against armor and rams; individual arrows still deal 1 or 2 damage. |
| **Reinforced gate** | Block **one breach per siege** without losing a heart. | The brace is consumed, and later breaches hurt normally. Cannonballs are never blocked. |

Only one upgrade is active at a time. The **Castle workshop** on the title lets you swap between sieges. Winning sieges **6** and **9** also offers a fresh choice before advancing. Equipment and an upgrade label appear on the keep; the gate label shows whether its block is ready or used. The pause menu explains the fitted upgrade.

Upgrades apply to sieges **4–13** and extra modes, including restarts. Replaying the first three sieges keeps their original rules. Existing saves retain all unlocked levels and scores; if you already reached siege 4 or later, continuing offers the upgrade choice. The gate block renews on every new siege or endless round.

`assets/Hammer_and_Gate.mp3` is the user-supplied main background music. It loops quietly alongside the effects at the selected volume. Its bytes are copied unchanged from the supplied file and included in the itch.io archive.

## Version 1.1 balance changes

- Authored formations introduce ironclads in siege 4, volley carts in siege 6, and ballistas in siege 8. Sieges 8–10 combine all six types.
- Rams have **14 HP** on introduction, rising to **22 HP** in the final siege, compared with 5 HP originally. They start at the same road position and move more slowly than before.
- Fresh ranged units fire an opening shot before joining coordinated salvos, with reload gaps for counterattacks.
- Player arrows are more than twice as thick, have visible arrowheads and trails, and produce damage numbers and hit sparks.
- Existing unlocked sieges remain available. Use **Choose a siege** to replay the revised campaign.

## Run locally

Install Node.js 18 or later, then run from the source project folder:

```sh
npm start
```

Open **http://localhost:4173**. No `npm install` or build step is needed. Use a local web server instead of opening `index.html` directly because the game uses JavaScript modules. Set the `PORT` environment variable to use another port.

## Development checks

Run `npm test` for deterministic rules, audio, and save checks, including all 13 sieges, every route/upgrade pairing, capped repairs, boss phases, sampled daily sieges, and opening endless rounds. With the server running, open `http://127.0.0.1:4173/tests/browser.html` and click **Run checks** for real browser input, audio, routes, the fortress, daily/endless progression, restrictions, cosmetics and save persistence. Allow about six minutes and keep that page visible until it finishes. The test restores its original save; using `127.0.0.1` isolates it from a game being played on `localhost`.

Run `npm run balance` for a simulation report covering enemy health, simultaneous threats, approach distance, time under cover, and precise versus cautious timing policies. Simulations verify that all thirteen sieges remain completable; they do not replace human difficulty feedback.

The browser check uses a portrait iframe and simulated touch pointer events. A real iOS/Android device check is still recommended before publishing.

## Package for itch.io

```sh
npm run package
```

The command creates `dist/peek-a-keep-itch.zip` with `index.html` at its root and all runtime assets included. The packaging script requires only Node.js and works on Windows, macOS, and Linux.

1. Create or edit a project on itch.io and choose **HTML Game**.
2. Upload `dist/peek-a-keep-itch.zip` and mark it **This file will be played in the browser** if that option appears.
3. Choose **Embed in page**, with a suggested viewport of **450 × 800**, or **Click to launch in fullscreen**.
4. Enable the **Fullscreen button** and **Mobile Friendly**. Leave scrollbars disabled.
5. Save the project and preview it on desktop and a phone before publishing.

These settings follow the [itch.io HTML5 upload guide](https://itch.io/docs/creators/html5). Keep all asset paths relative when making changes. To play the packaged ZIP locally, extract it and serve its folder with any static web server; the development scripts stay in the source project.

## Third-party software

Three.js is included locally in `vendor/` under the MIT license. Its license notice is distributed as `vendor/LICENSE.three`. The background music is the supplied `Hammer_and_Gate.mp3`; all visuals are generated from geometry, and sound effects are synthesized in the browser.
