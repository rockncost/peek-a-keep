import test from 'node:test';
import assert from 'node:assert/strict';
import {GameModel,getLevelConfig,TOTAL_LEVELS} from '../src/model.js';
import {restoreProgress,recordResult} from '../src/progress.js';
test('campaign assigns terrain and adapts former extra modes into authored defenses',()=>{
  assert.equal(TOTAL_LEVELS,19);
  assert.deepEqual([1,4,7,10,11,12,13].map(n=>getLevelConfig(n).terrain),['plain','river','mountain','courtyard','mountain','river','courtyard']);
  assert.equal(new GameModel(14,7,{gate:5}).state.upgrades.gate,0);
  assert.equal(new GameModel(15,7,{gate:5}).state.hearts,2);
  assert.equal(getLevelConfig(16).formation.filter(t=>t==='ram').length,4);
  assert.deepEqual(getLevelConfig(17),getLevelConfig(17));
  assert.ok(getLevelConfig(19).formation.includes('boss'));
});
test('endurance waves wait for all threats, restore hearts, and never spawn a new wave inside an old salvo',()=>{
  const model=new GameModel(18,7,{gate:5});model.spawned=6;model.state.spawned=6;model.state.hearts=1;model.state.gateShield=0;model.spawnTimer=-5;
  model.state.projectiles=[{id:99,type:'cannon',lane:0,from:0,duration:1,elapsed:0,progress:0}];model.setHolding(true);
  model.update(.5);assert.equal(model.spawned,6);assert.equal(model.state.hearts,1);assert.equal(model.waveIndex,0);
  model.update(.6);assert.equal(model.state.hearts,3);assert.equal(model.state.gateShield,1);assert.equal(model.waveIndex,1);assert.equal(model.spawned,6);
  assert.equal(model.drainEvents().filter(e=>e.type==='recovery').length,1);
  model.update(2.1);assert.equal(model.spawned,7);
});
test('tester access survives reload without unlocking progress or claiming victory rewards',()=>{
  const saved=restoreProgress({testAccess:true,unlocked:1,completed:0,musicVolume:.04});
  assert.equal(saved.testAccess,true);assert.equal(saved.unlocked,1);
  const state={phase:'won',level:19,score:1234,hearts:3,ramKills:1,ramBreaches:0,maxCombo:5};
  const before=structuredClone(saved);assert.deepEqual(recordResult(saved,state,{kind:'campaign',testing:true}),[]);assert.deepEqual(saved,before);
  recordResult(saved,state,{kind:'campaign'});assert.equal(saved.completed,19);
  const reset=restoreProgress(null);assert.equal(reset.testAccess,false);assert.equal(reset.unlocked,1);assert.equal(reset.upgrades.gate,0);assert.deepEqual(reset.best,{});assert.equal(reset.musicVolume,.08);
});
