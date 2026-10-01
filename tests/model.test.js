import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, TOTAL_LEVELS, ENEMY_TYPES, LEVEL_CONFIGS, getLevelConfig } from '../src/model.js';
import { simulate } from '../scripts/balance-report.mjs';


function run(model, policy = () => false, limit = 140) {
  const dt = 1 / 60;
  while (model.state.phase === 'playing' && model.state.time < limit) {
    model.setHolding(policy(model.state));
    model.update(dt);
  }
  return model.state;
}

// A player can read the balls, duck shortly before impact, then fire again.
const timingPolicy = state => state.projectiles.some(ball =>
  ball.duration - ball.elapsed < 0.34);

test('doing nothing loses; hiding forever also loses', () => {
  for (const level of [1, 5, 10]) {
    const exposed = run(new GameModel(level));
    assert.equal(exposed.phase, 'lost', `standing still on level ${level}`);
    assert.equal(exposed.hearts, 0);
    const hidden = run(new GameModel(level), () => true);
    assert.equal(hidden.phase, 'lost', `hiding on level ${level}`);
    assert.equal(hidden.kills, 0);
  }
});
test('a readable timing policy wins every siege with its full starting hearts', () => {
  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    for (const seed of [1234, 7, 99]) {
      const state = run(new GameModel(level, seed), timingPolicy);
      assert.equal(state.phase, 'won', `level ${level}, seed ${seed}`);
      assert.equal(state.hearts, getLevelConfig(level).hearts||3, `level ${level}, seed ${seed}`);
      assert.equal(state.kills, state.total);
      assert.ok(state.perfects > 0);
      assert.ok(state.time > 25 && state.time < 130, `duration ${state.time}`);
    }
  }
});

function singleTarget(type, powered = false) {
  const model = new GameModel(13, 7,null,{config:{...LEVEL_CONFIGS[12],total:1,formation:[type]}});
  let enemy;
  while (!enemy) {
    model.spawnEnemy();
    enemy = model.state.enemies.find(unit => unit.type === type);
  }
  enemy.attackTimer = Infinity;
  enemy.speed = 0;
  if(type==='boss'){enemy.bossElapsed=3;enemy.bossPhase='reload';enemy.bossFired=2;}
  model.state.enemies = [enemy];
  model.spawnTimer = Infinity;
  model.state.power = powered;
  return { model, enemy };
}

test('every full-health enemy survives one ordinary or powered arrow', () => {
  for (const type of Object.keys(ENEMY_TYPES)) {
    for (const powered of [false, true]) {
      const { model, enemy } = singleTarget(type, powered);
      const before = enemy.hp;
      model.update(.52);
      assert.equal(enemy.hp, before - (powered ? 2 : 1), `${type}, powered=${powered}`);
      assert.ok(enemy.hp > 0, `${type} was eliminated in one hit`);
      assert.equal(model.state.kills, 0);
      const hits = model.drainEvents().filter(event => event.type === 'enemyHit');
      assert.equal(hits.length, 1);
      assert.equal(hits[0].damage, powered ? 2 : 1);
      assert.equal(hits[0].hp, enemy.hp);
      model.update(.08);
      assert.equal(enemy.hp, before - (powered ? 2 : 1), 'an expired arrow applied damage twice');
    }
  }
});

test('a finishing arrow eliminates an injured enemy once', () => {
  const { model, enemy } = singleTarget('cannon', true);
  enemy.hp = 1;
  model.update(.52);
  assert.equal(model.state.kills, 1);
  const events = model.drainEvents();
  assert.equal(events.filter(event => event.type === 'kill').length, 1);
  assert.equal(events.find(event => event.type === 'enemyHit').damage, 1);
  model.update(.1);
  assert.equal(model.state.kills, 1);
});

test('rams gain substantial health without faster movement or closer spawning', () => {
  for (const level of [2, 10]) {
    const model = new GameModel(level);
    while (!model.state.enemies.some(unit => unit.type === 'ram')) model.spawnEnemy();
    const ram = model.state.enemies.find(unit => unit.type === 'ram');
    assert.equal(ram.maxHp, level === 2 ? 14 : 22);
    assert.ok(ram.speed <= .0382, 'ram became faster than its original introductory speed');
    assert.equal(ram.progress, .035);
    assert.equal(ENEMY_TYPES.ram.burstCount, 0);
  }
});

test('nine enemy types enter progressively, preserving the original mixed formations', () => {
  const introduced = { cannon: 1, ram: 2, double: 3, armored: 4, volley: 6, ballista: 8,mortar:11,support:12,boss:13 };
  assert.equal(Object.keys(ENEMY_TYPES).length, 9);
  for (const [type, firstLevel] of Object.entries(introduced)) {
    assert.equal(LEVEL_CONFIGS.findIndex(config => config.formation.includes(type)) + 1, firstLevel);
  }
  for (const config of LEVEL_CONFIGS.slice(7,10)) {
    assert.deepEqual(new Set(config.formation), new Set(['cannon','ram','double','armored','volley','ballista']));
  }
});

test('twin and volley carts fire their complete advertised bursts', () => {
  for (const [type, count] of [['double', 2], ['volley', 3]]) {
    const { model, enemy } = singleTarget(type);
    enemy.attackTimer = .2;
    enemy.openingAttack = false;
    model.setHolding(true);
    model.update(.2 + ENEMY_TYPES[type].burstGap * (count - 1) + .06);
    const shots = model.drainEvents().filter(event => event.type === 'enemyShot');
    assert.equal(shots.length, count, type);
  }
});

test('late sieges create more simultaneous threats and demand tighter counterattack timing', () => {
  for (const seed of [1234, 7, 99]) {
    const first = simulate(1, { seed });
    const last = simulate(10, { seed });
    assert.equal(last.phase, 'won', 'precise play must still complete the campaign');
    assert.ok(last.maxAlive >= 5 && last.maxAlive > first.maxAlive);
    assert.ok(last.furthest >= .45, 'late enemies never threatened the approach');
    assert.ok(last.hidden >= .20 && last.hidden > first.hidden * 3);
    assert.ok(last.longestHold < 2, 'salvos require an excessively long continuous hide');
    assert.equal(simulate(1, { seed, lead: .8 }).phase, 'won');
    assert.equal(simulate(10, { seed, lead: .8 }).phase, 'lost', 'hiding too early should sacrifice important firing time');
  }
});

test('timed ducks award power and the next volley consumes it', () => {
  const model = new GameModel();
  while (!model.state.projectiles.length) model.update(1 / 60);
  const projectile = model.state.projectiles[0];
  model.update(projectile.duration - projectile.elapsed - 0.32);
  model.setHolding(true);
  model.update(0.34);
  assert.equal(model.state.perfects, 1);
  assert.equal(model.state.power, true);
  assert.equal(model.state.hearts, 3);
  assert.ok(model.drainEvents().some(event => event.type === 'perfect'));
  model.setHolding(false);
  while (!model.drainEvents().some(event => event.type === 'shot' && event.powered)) {
    model.update(1 / 60);
    assert.ok(model.state.time < 10);
  }
  assert.equal(model.state.power, false);
});

test('early hiding is safe but does not award a perfect', () => {
  const model = new GameModel();
  model.setHolding(true);
  model.update(4);
  assert.equal(model.state.hearts, 3);
  assert.equal(model.state.perfects, 0);
  assert.equal(model.state.power, false);
  assert.ok(model.drainEvents().some(event => event.type === 'dodge'));
});

test('ducking too late takes damage', () => {
  const model = new GameModel();
  while (!model.state.projectiles.length) model.update(1 / 60);
  const projectile = model.state.projectiles[0];
  model.update(projectile.duration - projectile.elapsed - 0.06);
  model.setHolding(true);
  model.update(0.08);
  assert.equal(model.state.hearts, 2);
  assert.equal(model.state.perfects, 0);
});

test('simulation is deterministic and remains unchanged without updates', () => {
  const first = new GameModel(4, 42);
  const second = new GameModel(4, 42);
  for (let frame = 0; frame < 500; frame++) {
    const holding = frame % 120 > 80;
    first.setHolding(holding);
    second.setHolding(holding);
    first.update(1 / 60);
    second.update(1 / 60);
  }
  assert.deepEqual(first.state, second.state);
  const beforePause = structuredClone(first.state);
  first.update(0);
  first.update(-1);
  first.update(NaN);
  assert.deepEqual(first.state, beforePause);
});

test('a finished round freezes and emits its result only once', () => {
  const model = new GameModel();
  run(model, timingPolicy);
  const events = model.drainEvents();
  assert.equal(events.filter(event => event.type === 'win').length, 1);
  const finished = structuredClone(model.state);
  model.update(30);
  model.setHolding(true);
  assert.deepEqual(model.state, finished);
  assert.deepEqual(model.drainEvents(), []);
});
