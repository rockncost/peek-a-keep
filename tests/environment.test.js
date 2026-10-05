import test from 'node:test';
import assert from 'node:assert/strict';
import {ENVIRONMENTS,environmentFor} from '../src/environment.js';
import {GameModel,getLevelConfig} from '../src/model.js';
import {upgradeStats,canBuild} from '../src/upgrades.js';
test('weather is authored and leaves attack timing unchanged',()=>{
  assert.equal(environmentFor(1),'clear');assert.equal(environmentFor(6),'rain');assert.equal(environmentFor(9),'fog');assert.equal(environmentFor(19),'dusk');
  assert.ok(ENVIRONMENTS.rain.warningThreshold>ENVIRONMENTS.clear.warningThreshold);
  const config=getLevelConfig(6),a=new GameModel(6,7,null,{config}),b=new GameModel(6,7,null,{config:{...config,environment:'clear'}});
  for(let i=0;i<600;i++){for(const m of [a,b]){m.setHolding(m.state.projectiles.some(p=>p.duration-p.elapsed<.34));m.update(1/60);}}
  assert.deepEqual(a.state.projectiles,b.state.projectiles);assert.equal(a.state.hearts,b.state.hearts);assert.equal(a.state.kills,b.state.kills);
});
test('each advanced rank improves its effect and prerequisites stay within its branch',()=>{
  assert.equal(canBuild({archers:2,counterweight:5},'ballista'),false);assert.equal(canBuild({archers:2,fletching:1},'ballista'),true);
  for(let rank=1;rank<5;rank++){const a=upgradeStats({ballista:rank,springboard:rank,gate:rank}),b=upgradeStats({ballista:rank+1,springboard:rank+1,gate:rank+1});assert.ok(b.pierceInterval<a.pierceInterval);assert.ok(b.scatterInterval<a.scatterInterval);assert.ok(b.gateCooldown<a.gateCooldown);}
});
test('portcullis rebuilds only after its purchased cooldown',()=>{
  for(const rank of [1,5]){const m=new GameModel(4,7,{gate:rank});m.spawnTimer=Infinity;m.hurt('breach');assert.equal(m.state.hearts,3);m.update(m.stats.gateCooldown-.1);assert.equal(m.state.gateShield,0);m.update(.2);assert.equal(m.state.gateShield,1);m.hurt('breach');assert.equal(m.state.hearts,3);}
});
