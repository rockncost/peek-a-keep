import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, getLevelConfig, LEVEL_CONFIGS } from '../src/model.js';
import { ROUTES, approachX } from '../src/content.js';
import { restoreProgress, recordResult } from '../src/progress.js';

function play(model,limit=180){
  while(model.state.phase==='playing'&&model.state.time<limit){model.setHolding(model.state.projectiles.some(p=>p.duration-p.elapsed<.34));model.update(1/60);model.drainEvents();}
  return model.state;
}
function isolated(type){
  const model=new GameModel(13,7,null,{config:{...LEVEL_CONFIGS[12],total:1,formation:[type]}});model.spawnEnemy();model.spawnTimer=Infinity;return [model,model.state.enemies[0]];
}
test('all three routes remain completable with each upgrade, on every eligible siege',()=>{
  for(const route of Object.keys(ROUTES))for(let level=4;level<=12;level++)for(const upgrade of ['counterweight','archers','gate']){
    const s=play(new GameModel(level,99,{[upgrade]:5},{route}));
    assert.equal(s.phase,'won',`${route}, ${level}, ${upgrade}`);assert.equal(s.hearts,3,`${route}, ${level}, ${upgrade}`);
  }
});
test('bridge queues engines, mountain changes flight, courtyard alternates lanes',()=>{
  const river=new GameModel(9,7,null,{route:'river'});river.spawnEnemy();river.spawnEnemy();river.spawnTimer=Infinity;
  const [front,back]=river.state.enemies;front.progress=.48;back.progress=.43;river.setHolding(true);river.update(.1);
  assert.equal(back.progress,.43);assert.ok(front.progress<.482);
  assert.ok(Math.abs(approachX(1,.465,'river'))<.15);
  const mountain=new GameModel(8,7,null,{route:'mountain'});mountain.spawnEnemy();mountain.fireEnemy(mountain.state.enemies[0]);
  assert.ok(Math.abs(mountain.state.projectiles[0].duration-.70*1.15)<1e-8);
  assert.notEqual(approachX(0,.2,'mountain'),0);
  const court=new GameModel(8,7,null,{route:'courtyard'});for(let i=0;i<4;i++)court.spawnEnemy();
  assert.deepEqual(court.state.enemies.map(e=>e.lane),[1,-1,1,-1]);
  assert.equal(court.state.total,getLevelConfig(8).total+1);
});
test('mortar emits one descending whistle and has a longer readable flight',()=>{
  const [model,enemy]=isolated('mortar');enemy.attackTimer=.1;model.setHolding(true);model.update(2);
  assert.equal(model.drainEvents().filter(e=>e.type==='mortarWhistle').length,1);
  assert.equal(model.state.hearts,3);assert.equal(model.state.projectiles[0].duration,2.05);
  model.update(.3);assert.equal(model.drainEvents().filter(e=>e.type==='mortarWhistle').length,0);
});
test('repair wagon heals nearby injured engines only three times and becomes a priority target',()=>{
  const [model,wagon]=isolated('support');wagon.progress=.2;wagon.speed=0;
  const ally={...wagon,id:777,type:'ram',hp:10,maxHp:22,progress:.21,speed:0};
  const far={...ally,id:778,progress:.9};model.state.enemies.push(ally,far);
  model.setHolding(true);model.update(3.9);assert.equal(ally.hp,11);assert.equal(far.hp,10);assert.equal(wagon.repairsLeft,2);
  assert.ok(wagon.exposedUntil>model.state.time);
  model.setHolding(false);model.update(.21);assert.equal(model.state.arrows[0].targetId,wagon.id);
  model.setHolding(true);model.update(18);assert.equal(wagon.repairsLeft,0);assert.equal(ally.hp,13);
});
test('boss armor blocks arrows, reload exposes it, half health adds a third shot, final quarter becomes a ram',()=>{
  const [model,boss]=isolated('boss');model.update(.52);assert.equal(boss.hp,40);assert.ok(model.drainEvents().some(e=>e.type==='armorBlock'));
  boss.bossElapsed=3;boss.bossFired=2;model.shotTimer=0;model.update(.52);assert.equal(boss.hp,39);
  boss.hp=20;boss.bossElapsed=0;boss.bossFired=0;model.setHolding(true);model.update(2);
  assert.equal(model.drainEvents().filter(e=>e.type==='enemyShot').length,3);assert.equal(boss.enraged,true);
  boss.hp=10;model.update(.01);assert.equal(boss.bossPhase,'ram');assert.equal(boss.speed,.028);
  const before=model.state.projectiles.length;model.update(6);assert.ok(model.state.projectiles.length<=before);
});
test('legacy saves preserve real volume and progression, including unlocking the expansion after siege ten',()=>{
  const old={unlocked:10,completed:10,best:{10:1234},upgrade:'gate',musicVolume:.03,sfxVolume:.25};
  const saved=restoreProgress(old);assert.equal(saved.unlocked,11);assert.equal(saved.completed,10);assert.equal(saved.best[10],1234);
  assert.equal(saved.musicVolume,.03);assert.equal(saved.sfxVolume,.25);assert.equal(saved.upgrades.gate,0);assert.equal(saved.stars,500);
  assert.deepEqual(saved.colors,['blue']);assert.equal(restoreProgress({routes:{4:'__proto__'},cosmetic:'unknown'}).cosmetic,'blue');
});
test('campaign wins award colors and preserve the best siege score',()=>{
  const saved=restoreProgress(null),state={phase:'won',level:4,score:1000,hearts:3,ramKills:1,ramBreaches:0,maxCombo:5};
  assert.equal(recordResult(saved,state,{kind:'campaign'}).length,3);
  assert.equal(saved.unlocked,5);assert.equal(saved.completed,4);
  recordResult(saved,{...state,score:500},{kind:'campaign'});assert.equal(saved.best[4],1000);
});
