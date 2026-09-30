import { GameModel, ENEMY_TYPES, LEVEL_CONFIGS } from '../src/model.js';

export function simulate(level, { seed = 1234, lead = 0.29, reaction = 0, limit = 180 } = {}) {
  const model = new GameModel(level, seed);
  const dt = 1 / 60;
  let maxAlive = 0, furthest = 0, hidden = 0, longestHold = 0, hold = 0;
  let decisionAt = 0;
  while (model.state.phase === 'playing' && model.state.time < limit) {
    const state = model.state;
    if (state.time >= decisionAt) {
      model.setHolding(state.projectiles.some(ball => ball.duration - ball.elapsed < lead));
      decisionAt = state.time + reaction;
    }
    model.update(dt);
    maxAlive = Math.max(maxAlive, state.enemies.length);
    furthest = Math.max(furthest, ...state.enemies.map(enemy => enemy.progress));
    if (state.holding) { hidden += dt; hold += dt; } else hold = 0;
    longestHold = Math.max(longestHold, hold);
    model.drainEvents();
  }
  const state = model.state;
  return { phase: state.phase, hearts: state.hearts, kills: state.kills, time: +state.time.toFixed(1), perfects: state.perfects, maxAlive, furthest: +furthest.toFixed(2), hidden: +(hidden / state.time).toFixed(2), longestHold: +longestHold.toFixed(2) };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/balance-report.mjs')) {
  const rows = LEVEL_CONFIGS.map((config, index) => {
    const level = index + 1;
    const expert = simulate(level);
    const cautious = simulate(level, { lead: 0.8 });
    const human = simulate(level, { lead: 0.43, reaction: 0.18 });
    return { level, hp: config.formation.reduce((sum, type) => sum + (type === 'ram' ? config.ramHp : ENEMY_TYPES[type].maxHp + config.healthBonus), 0), expert: `${expert.phase}/${expert.hearts}`, cautious: `${cautious.phase}/${cautious.hearts}`, human: `${human.phase}/${human.hearts}`, ...Object.fromEntries(Object.entries(expert).filter(([key]) => !['phase','hearts','kills'].includes(key))) };
  });
  console.table(rows);
}
