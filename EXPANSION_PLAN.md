# Where Peek-a-Keep can grow

**Version 1.4 implements this first expansion.** The design below is retained as the rationale. Mortars, capped repair wagons, the three-phase Moving Fortress, three campaign routes and terrain rules, cosmetic banner colors, endless defense, daily sieges, and three challenge banners are playable. See [README.md](README.md) for controls and exact rules.

Next steps should follow player feedback: tune the boss's counterattack windows and route balance, add more authored challenge formations, and consider distinct flag emblems as additional cosmetic rewards. Currency, grinding, large upgrade trees, accounts and multiplayer remain deferred.

Keep the one-button rule: hide to survive, rise to fire. New content should change when the player makes that decision. Extra health alone makes battles longer; new attack rhythms make them interesting.

## Recommended first expansion: The Moving Fortress

Add three optional sieges after the current ten, keeping the existing campaign and saves intact.

1. **The decoy battery:** introduce a mortar that visibly launches a high, slow shell. Mix it with quick ballistas so the player must read different arrival times. The shell has an obvious shadow and a descending whistle. Teach it alone before mixing it with existing enemies.
2. **The convoy:** a support wagon periodically repairs nearby engines. It carries a clearly marked banner and has a short exposed window after repairing. During that window the archers automatically prioritize it, so the existing single input remains sufficient. Kill it early or face a longer siege; cap repairs so a wave cannot stall forever.
3. **The Moving Fortress:** the first boss, built from the same simple 3D shapes. It advances slowly and cycles through a readable cannon salvo, a reload that exposes its weak point, and a ram approach. Its firing schedule changes at half health, with a clear visual transition and a safe recovery window. Avoid random unavoidable overlaps. Give it a visible boss bar and a memorable victory animation.

This adds a new timing problem, a priority target, and a finale without requiring new controls. Prototype the mortar and boss first; include the repair wagon only if automatic targeting feels fair.

## Make the campaign choices matter

Offer a fork after each set of three sieges. A heavy convoy route favors Twin Archers; a crowded gate route favors Reinforced Gate; a staggered artillery route rewards Counterweight. Show the expected threats before the player chooses and allow fitting an upgrade there.

Routes should offer different problems at comparable difficulty. Keep one active upgrade rather than piling on permanent damage bonuses. Optional objectives can award banners, castle colors, and flag designs: finish with three hearts, stop every ram, or earn a run of perfect ducks. Basic campaign progress should remain possible without completing them.

## Add places with one meaningful rule each

- **River crossing:** enemies bunch up at a visible bridge, creating dangerous volleys but leaving useful reload windows.
- **Mountain pass:** a winding road makes approach distance and artillery travel different. Keep projectiles and warning cues clearly visible.
- **Royal courtyard:** attackers arrive from two visibly marked lanes, alternating pressure. Make every incoming shot readable before trying simultaneous attacks.

Use geometry, palette changes, and a few props. Terrain should affect battle pacing, not just recolor the background. Introduce one rule per area before combining it with others.

## Replay modes after the campaign expansion

**Endless defense:** escalating rounds assembled from tested formations, with a recovery and upgrade-choice break every three rounds. Increase composition difficulty before increasing raw health. Save a local best score.

**Daily siege:** a date-seeded formation shared by everyone, with a local score history. Start without accounts or an online leaderboard.

**Challenge banners:** short authored missions such as two hearts, restricted upgrades, or an extra ram convoy. Show restrictions before starting; keep them optional.

## Order of work

1. Prototype the mortar and a three-phase boss in one test siege.
2. Human-test warning clarity, counterattack windows, and automatic targeting.
3. Ship the three-siege expansion with a small set of cosmetic rewards.
4. Add branching routes and one terrain rule.
5. Build endless mode from the formations that proved enjoyable.

Defer currencies, grind, a large upgrade tree, and multiplayer until the battle variety is strong enough to support them. The next release should be a more memorable defense, not a larger menu.
