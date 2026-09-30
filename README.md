# Peek-a-Keep

A portrait 3D castle game about knowing when to disappear. Pop up to fire at an approaching siege army, then sink your whole castle underground before its cannonballs arrive. A last-moment duck earns a powered return volley. Hiding forever will not save you: siege carts keep rolling toward the gate.

Ten levels gradually combine six enemies: cannons, twin cannons, reinforced battering rams, armored ironclads, three-shot volley carts, and fast-bolt ballistas. Later waves arrive closer together and leave less time to counterattack. Progress and your castle upgrade are saved locally in your browser. The game uses simple geometric models, bundled Three.js, synthesized effects, and the supplied **Hammer and Gate** background track; it makes no external network requests at runtime.

## Controls

- **Hold touch, left mouse button, or Space:** hide the castle.
- **Release:** rise and fire automatically.
- **P or Escape:** pause or resume.
- **Sound button:** toggle music and effects, including from menus. Audio starts after the first interaction. The looping music pauses with the siege or when the page is hidden, then resumes from the same position.
- **Settings** on the title or pause menu: adjust music and sound effects separately, preview the cannon blast, or reset the volumes. Changes are saved automatically.

Designed for portrait phones, with mouse and keyboard support on desktop. A modern browser with WebGL2 is required.

Ordinary arrows deal **1 damage**. Last-second ducks charge the next arrow for **2 damage**, shown by a larger cyan projectile and cyan damage number. Every full-health enemy needs multiple hits; an injured enemy can still be finished by one arrow. Early ducks are safe, but do not earn the bonus and consume valuable firing time. Three hits or breaches end a siege; victory restores your hearts for the next one. Enemies signal a shot with a glowing fuse and ground ring. Twin cannons fire twice; volley carts fire three spaced shots. Use the **Enemy guide** on the title or pause menu for their strengths.

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

Upgrades apply to sieges **4–10**, including restarts. Replaying the first three sieges keeps their original rules. Existing saves retain all unlocked levels and scores; if you already reached siege 4 or later, continuing offers the new upgrade choice immediately. The gate block renews on every new siege or restart.

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

Run `npm test` for deterministic game-rule and audio tests, including independent volumes, master mute, cannon layering/cleanup, upgrade effects, and later-campaign completion with each choice. With the server running, open `http://127.0.0.1:4173/tests/browser.html` and click **Run checks** for real browser input, settings persistence, paused settings, music decoding, upgrade milestones/swaps, victory, and saved-progress checks. Allow about three minutes and keep that page visible until it finishes. The test restores its original save; using `127.0.0.1` also isolates it from a game being played on `localhost`.

Run `npm run balance` for a simulation report covering enemy health, simultaneous threats, approach distance, time under cover, and precise versus cautious timing policies. Simulations verify that all ten sieges remain completable; they do not replace human difficulty feedback.

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
