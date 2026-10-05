# Peek-a-Keep

A portrait 3D castle game about knowing when to disappear. Pop up to fire at an approaching siege army, then sink your whole castle underground before its cannonballs arrive. A last-moment duck earns a powered return volley. Hiding forever will not save you: siege carts keep rolling toward the gate.

One 19-siege campaign introduces nine engines and follows an authored journey through open roads, narrow bridges, winding mountain passes and alternating courtyard lanes. Late defenses combine restricted equipment, a damaged keep, reinforced convoys, mixed artillery and a three-wave endurance siege before the final Moving Fortress. There are no separate mode or route selectors. Progress, scores, upgrades, colors and audio settings stay local. The game uses bundled Three.js, simple geometric models, synthesized effects and the supplied **Hammer and Gate** track, with no external runtime requests.

## Controls

- **Hold touch, left mouse button, or Space:** hide the castle.
- **Release:** rise and fire automatically.
- **P or Escape:** pause or resume.
- **Sound button:** toggle music and effects, including from menus. Audio starts after the first interaction. The looping music pauses with the siege or when the page is hidden, then resumes from the same position.
- **Settings** on the title or pause menu: adjust music and sound effects separately, preview the cannon blast, or reset the volumes. Changes are saved automatically.

Designed for portrait phones, with mouse and keyboard support on desktop. A modern browser with WebGL2 is required.

Ordinary arrows deal **1 damage**. Last-second ducks charge the next arrow for **2 damage**, shown by a larger cyan projectile and cyan damage number. Every full-health enemy needs multiple hits; an injured enemy can still be finished by one arrow. Early ducks are safe, but do not earn the bonus and consume valuable firing time. Three hits or breaches end a siege; victory restores your hearts for the next one. Enemies signal a shot with a glowing fuse and ground ring. Twin cannons fire twice; volley carts fire three spaced shots. Use the **Enemy guide** on the title or pause menu for their strengths.

## Version 1.7: weather and immediate upgrades

Campaign weather is authored, with no extra menu choices: rain in sieges 6/12/16/18, mountain fog in 9/11/14/17, and dusk in 10/13/15/19. Rain halves the visible fuse warning and reveals mortar landing rings later. Fog conceals distant engines. Synthesized wind-up cues complement incoming shells and the always-readable INCOMING prompt; sound is optional. Weather never changes impact timing. Reduced-motion players do not see moving rain.

A fresh keep begins with **zero stars and zero upgrades**. Win siege 1 to open the workshop. The tutorial siege always uses the basic keep, even on replay. All purchased ranks stack from siege 2 onward; siege 14 temporarily disables equipment without deleting purchases.

Destroyed engines drop stars: cannon 5, twin cannon 7, ram 11, ironclad/volley/ballista 9, mortar 11, repair wagon 13, fortress 90. Stars are banked at the result screen, including kills in a lost siege. Perfect ducks still power arrows but do not create currency. Each victory pays **at least 50 stars**: if enemy drops total less, a completion bonus makes up the difference. Replays pay too. Every purchase costs 50 stars, so each completed siege funds at least one remaining small rank or unlocked advanced rank. Purchases are optional; continuing without buying remains possible.

There are **45 purchasable ranks** across three branches:

| Branch | Small improvements, five ranks each | Advanced upgrade |
| --- | --- | --- |
| The Barrage | Archer drills: +3% firing rate per rank. Fine fletching: +4% arrow speed per rank. | Piercing ballista: every eighth to fourth shot damages a nearby second engine with a 1-damage arrow. |
| The Shadows | Counterweights: +4% rise speed per rank. Steady nerves: +0.02 seconds to the early edge of a perfect duck per rank. | Kinetic springboard: a powered return shot scatters one to two extra 1-damage arrows at different engines. |
| The Bastion | Deep foundations: +3% duck speed per rank. Rampart screens: 1% more protection during ducking per rank. | Iron portcullis: block a breach; rebuild in 80–40 seconds and renew at endurance recovery. |

Buy three small ranks in a branch to unlock its advanced upgrade. Every purchased rank works immediately. Piercing cadence improves from every eighth shot to every fourth; springboard adds one arrow at rank one and increases the frequency of a second; portcullis blocks a breach and rebuilds in 80 seconds at rank one, improving to 40 seconds at rank five. Bonus arrows cannot bypass fortress armor. Existing purchased ranks and stars are preserved.

Older saves retain progression, scores, colors, tester access and actual audio settings. The old free fitted upgrade is replaced by the new tree; migration grants **50 catch-up stars per previously completed siege**, with no free upgrade ranks. This credit is applied only once. Tester victories never grant stars or rewards. Reset clears the wallet and all upgrade ranks.

## Version 1.5: one campaign

Terrain is now assigned by the campaign. Sieges 1–3 teach the original controls on an open road; 4–6 teach the bridge queue; 7–9 use a slower winding mountain road with 15% longer shell flight; 10 onward combine terrains with the new enemy mechanics. Courtyard attackers alternate between two lanes. The original siege numbers and saved unlocks are retained.

The former extra-mode ideas become six authored campaign defenses after siege 13:

| Siege | Defense |
| --- | --- |
| 14 · The old mountain keep | No upgrade at this outpost. Longer shell flight provides time to counterattack. |
| 15 · The wounded courtyard | A damaged keep starts with two hearts. Read the alternating lanes. |
| 16 · The bridge convoy | Four reinforced rams cross the narrow bridge, supported by artillery and a repair wagon. |
| 17 · The siege muster | A fixed mixed battery combines mortar arcs and quick bolts. Retries keep the same formation; no daily calendar or extra menu. |
| 18 · The long watch | Three escalating waves. The next waits until every engine and shell is gone, then restores three hearts and a gate brace, with a two-second recovery break. |
| 19 · The royal siege | The fortress returns with artillery escorts for the campaign finale. |

Mortars launch high shells with a landing ring and descending whistle. Repair wagons have three one-HP repairs and become an automatic priority target for three seconds after repairing. The fortress blocks arrows during its armored salvo, exposes a golden weak point while reloading, fires a third shot after half health, and becomes a ram at one-quarter health.

Purchased upgrades now stack. The no-equipment siege temporarily disables them without changing your saved ranks. Hearts reset for each new siege, except the authored two-heart defense. Castle colors remain cosmetic rewards for three hearts, stopping a ram without a ram breach, or five perfect ducks without taking damage.

### Testing controls

Open **Settings**, then tap the invisible **44 × 44 area in the upper-left corner of the game** five times, with less than two seconds between taps. A toast confirms tester access. **Choose a siege** now permits all 19 defenses, including after reload. Repeat the five taps to disable it. Test victories do not change campaign progress, records or rewards; introductory and restricted siege rules still apply. Tester access uses the purchased ranks; it grants no free equipment or money.

**Reset all saves** is visible in Settings. Its confirmation screen clears this game's local save, including progress, scores, equipment, colors, legacy extra-mode records, tester access, mute and volume choices. Cancel preserves everything. No other browser data is touched.

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

This historical release introduced the original single-choice workshop. Version 1.6 replaces it with the star-funded tree described above.

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

Run `npm test` for deterministic rules, audio, and save checks, including all 19 sieges, gradual and completed upgrade builds, star affordability, migration, capped repairs, boss phases, endurance recovery and tester isolation. With the server running, open `http://127.0.0.1:4173/tests/browser.html` and click **Run checks** for real browser input, first-victory earnings, purchases, advanced upgrade UI, audio, hidden tester access, campaign restrictions, endurance waves, the final fortress and save reset. Allow about four minutes and keep that page visible until it finishes. The test restores its original save; using `127.0.0.1` isolates it from a game being played on `localhost`.

Run `npm run balance` for a simulation report covering enemy health, simultaneous threats, approach distance, time under cover, and precise versus cautious timing policies. Simulations verify that all nineteen sieges remain completable; they do not replace human difficulty feedback.

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
