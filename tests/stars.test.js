import test from 'node:test';import assert from 'node:assert/strict';
import {UPGRADES,UPGRADE_COST,upgradeRanks,upgradeStats,upgradeCount,canBuild,buyUpgrade,siegeReward,starsForEnemy} from '../src/upgrades.js';
import {GameModel,TOTAL_LEVELS,getLevelConfig} from '../src/model.js';
import {restoreProgress,recordResult} from '../src/progress.js';
function play(model){while(model.state.phase==='playing'&&model.state.time<150){model.setHolding(model.state.projectiles.some(p=>p.duration-p.elapsed<.34));model.update(1/60);model.drainEvents();}return model.state;}
test('fresh defense has zero currency or upgrades; old saves receive catch-up stars once without free equipment',()=>{
  const fresh=restoreProgress(null);assert.equal(fresh.stars,0);assert.equal(upgradeCount(fresh.upgrades),0);assert.equal(buyUpgrade(fresh,'archers'),false);
  const old=restoreProgress({completed:7,unlocked:8,upgrade:'archers',musicVolume:.04});assert.equal(old.stars,350);assert.equal(upgradeCount(old.upgrades),0);assert.equal(old.musicVolume,.04);
  old.stars=0;assert.equal(restoreProgress(old).stars,0);
});
test('every completed siege funds a smallest purchase even with no money left, and settlement cannot pay twice',()=>{
  for(let level=1;level<=TOTAL_LEVELS;level++){
    const model=new GameModel(level,level*7159),state=play(model);assert.equal(state.phase,'won',`siege ${level}`);
    const saved=restoreProgress(null),run={kind:'campaign',id:'siege-'+level};recordResult(saved,state,run);
    assert.ok(saved.stars>=UPGRADE_COST,`siege ${level} underpaid`);const before=saved.stars;recordResult(saved,state,run);assert.equal(saved.stars,before);
    assert.equal(buyUpgrade(saved,'archers'),true);
  }
  assert.equal(starsForEnemy(100),5);assert.equal(siegeReward({phase:'won',stars:0}),50);assert.equal(siegeReward({phase:'lost',stars:5}),5);
});
test('purchase checks balance, prerequisites and caps; mixed branches stack in small increments',()=>{
  const saved=restoreProgress({completed:1});assert.equal(saved.stars,50);assert.equal(buyUpgrade(saved,'ballista'),false);assert.equal(buyUpgrade(saved,'archers'),true);assert.equal(saved.stars,0);assert.equal(buyUpgrade(saved,'counterweight'),false);
  saved.stars=1000;for(let i=0;i<4;i++)assert.equal(buyUpgrade(saved,'archers'),true);assert.equal(buyUpgrade(saved,'archers'),false);
  assert.equal(canBuild(saved.upgrades,'ballista'),true);assert.equal(buyUpgrade(saved,'counterweight'),true);
  const stats=upgradeStats(saved.upgrades);assert.ok(Math.abs(stats.fireInterval-.68/1.15)<1e-9);assert.equal(stats.riseSpeed,4.16);assert.equal(stats.gate,false);
  assert.equal(buyUpgrade(saved,'__proto__'),false);assert.equal(upgradeRanks({archers:Infinity,nerve:-1,gate:99}).gate,5);
});
test('all blueprints have no effect for stages one through four and activate only at five',()=>{
  for(const [id,stat] of [['ballista','piercing'],['springboard','scatter'],['gate','gate']]){
    for(let rank=1;rank<5;rank++)assert.equal(upgradeStats({[id]:rank})[stat],false);
    assert.equal(upgradeStats({[id]:5})[stat],true);
  }
  assert.equal(new GameModel(1,7,{archers:5,gate:5}).fireInterval,.68);
  assert.equal(upgradeCount(new GameModel(14,7,{archers:5,gate:5}).state.upgrades),0);
});
test('completed offensive blueprints spread damage between targets; they cannot bypass fortress armor',()=>{
  function setup(ranks){const m=new GameModel(4,7,ranks);m.spawnTimer=Infinity;m.state.enemies=[{id:100,type:'ram',hp:100,maxHp:100,speed:0,progress:.4,lane:0},{id:101,type:'ram',hp:100,maxHp:100,speed:0,progress:.3,lane:0},{id:102,type:'ram',hp:100,maxHp:100,speed:0,progress:.2,lane:0}];return m;}
  const incomplete=setup({ballista:4,springboard:4});incomplete.state.power=true;incomplete.update(.52);assert.equal(incomplete.state.enemies[1].hp,100);
  const scatter=setup({springboard:5});scatter.state.power=true;scatter.update(.52);assert.deepEqual(scatter.state.enemies.map(e=>e.hp),[98,99,99]);
  const piercing=setup({ballista:5});piercing.shotsFired=3;piercing.update(.52);assert.deepEqual(piercing.state.enemies.map(e=>e.hp),[99,99,100]);
  const boss=new GameModel(13,7,{ballista:5,springboard:5},{config:{...getLevelConfig(13),formation:['boss'],total:1}});boss.spawnEnemy();boss.spawnTimer=Infinity;boss.shotsFired=3;boss.state.power=true;boss.update(.52);assert.equal(boss.state.enemies[0].hp,40);
});
test('finished portcullis blocks exactly one breach and renews; cannonballs still hurt',()=>{
  const m=new GameModel(4,7,{gate:5});m.spawnTimer=Infinity;m.hurt('cannonball');assert.equal(m.state.hearts,2);assert.equal(m.state.gateShield,1);m.hurt('breach');assert.equal(m.state.hearts,2);m.hurt('breach');assert.equal(m.state.hearts,1);
  assert.equal(new GameModel(5,7,{gate:5}).state.gateShield,1);assert.equal(new GameModel(5,7,{gate:4}).state.gateShield,0);
});
test('campaign remains completable with one purchased rank per siege and with all construction finished',()=>{
  const saved=restoreProgress(null),full=Object.fromEntries(Object.keys(UPGRADES).map(id=>[id,5]));
  for(let level=1;level<=TOTAL_LEVELS;level++){
    const state=play(new GameModel(level,level*7159,saved.upgrades));assert.equal(state.phase,'won',`gradual siege ${level}`);recordResult(saved,state,{kind:'campaign',id:String(level)});
    const id=Object.keys(UPGRADES).find(id=>canBuild(saved.upgrades,id));assert.equal(buyUpgrade(saved,id),true);
    assert.equal(play(new GameModel(level,7,full)).phase,'won',`full siege ${level}`);
  }
});
