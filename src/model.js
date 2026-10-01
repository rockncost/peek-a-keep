import { UPGRADE_UNLOCK_LEVEL, validUpgrade } from './upgrades.js';
import { routeConfig, seededRandom } from './content.js';

/** Pure, deterministic game rules. All times are seconds and positions are 0–1. */
export const TOTAL_LEVELS = 19;

// Each ranged unit changes the rhythm; rams trade all ranged attacks for durability.
export const ENEMY_TYPES = Object.freeze({
  cannon: { name: 'Cannon', description: 'One shot, then a long reload.', maxHp: 3, speed: 0.023, points: 100, burstCount: 1, burstGap: 0, flightTime: 1.1, warningTime: 0.85, impactOffset: 0 },
  double: { name: 'Twin cannon', description: 'Two close shots. Wait for the second.', maxHp: 4, speed: 0.023, points: 140, burstCount: 2, burstGap: 0.34, flightTime: 1.1, warningTime: 0.85, impactOffset: 0 },
  ram: { name: 'Battering ram', description: 'Slow, heavily reinforced, and relentless.', maxHp: 14, speed: 0.026, points: 220, burstCount: 0, burstGap: 0, flightTime: 0, warningTime: 0, impactOffset: 0 },
  armored: { name: 'Ironclad', description: 'Thick armor protects a heavy cannon.', maxHp: 7, speed: 0.020, points: 180, burstCount: 1, burstGap: 0, flightTime: 1.3, warningTime: 1.05, impactOffset: 0.18 },
  volley: { name: 'Volley cart', description: 'Three spaced shots keep you underground.', maxHp: 5, speed: 0.024, points: 180, burstCount: 3, burstGap: 0.46, flightTime: 1.1, warningTime: 0.85, impactOffset: 0 },
  ballista: { name: 'Ballista', description: 'A bright wind-up warns of a fast bolt.', maxHp: 4, speed: 0.025, points: 180, burstCount: 1, burstGap: 0, flightTime: 0.70, warningTime: 1.05, impactOffset: 1.28 },
  mortar: { name:'Mortar',description:'High, slow shells. Watch the landing shadow and whistle.',maxHp:6,speed:.021,points:220,burstCount:1,burstGap:0,flightTime:2.05,warningTime:1.2,impactOffset:.65 },
  support: { name:'Repair wagon',description:'Repairs nearby engines three times. Archers prioritize its open banner.',maxHp:5,speed:.022,points:250,burstCount:0,burstGap:0,flightTime:0,warningTime:0,impactOffset:0 },
  boss: { name:'Moving Fortress',description:'Armored salvo, exposed reload, then a final ram advance. Fire at the open weak point.',maxHp:40,speed:.008,points:1800,burstCount:2,burstGap:.5,flightTime:1.1,warningTime:.9,impactOffset:0 },
});

const level = (label, spawnInterval, cycleTime, ramHp, healthBonus, formation) =>
  Object.freeze({ label, spawnInterval, cycleTime, ramHp, healthBonus, total: formation.length, formation: Object.freeze(formation) });

export const LEVEL_CONFIGS = Object.freeze([
  level('First light', 3.9, 5.8, 14, 0, ['cannon','cannon','cannon','cannon','cannon','cannon','cannon','cannon']),
  level('At the gate', 4.2, 5.8, 14, 0, ['cannon','cannon','ram','cannon','cannon','cannon','cannon','cannon']),
  level('Double trouble', 4.3, 5.6, 15, 0, ['cannon','double','cannon','ram','double','cannon','double','cannon','double']),
  level('Iron procession', 4.6, 5.6, 16, 0, ['armored','cannon','double','ram','cannon','armored','double','cannon','double','cannon']),
  level('Heavy company', 3.8, 5.4, 17, 0, ['double','armored','cannon','ram','double','cannon','armored','double','cannon','armored','double']),
  level('Rain of iron', 3.6, 5.2, 18, 0, ['volley','cannon','armored','ram','double','volley','cannon','armored','double','volley','cannon']),
  level('No quiet ground', 3.5, 5.0, 19, 0, ['volley','double','armored','ram','volley','cannon','double','armored','volley','double','armored','cannon']),
  level('A sharper threat', 3.3, 4.9, 20, 0, ['ballista','cannon','volley','ram','armored','double','ballista','volley','cannon','armored','double','ballista','volley']),
  level('The siege council', 3.1, 4.8, 21, 0, ['armored','volley','ballista','ram','double','cannon','armored','ballista','volley','double','cannon','armored','ballista','volley']),
  level('The last keep', 2.9, 4.7, 22, 0, ['volley','armored','ballista','ram','double','cannon','volley','armored','ballista','double','volley','armored','cannon','ballista','double']),
  level('The decoy battery',3.7,5.9,22,0,['mortar','cannon','mortar','ram','ballista','mortar','cannon','armored']),
  level('The convoy',3.5,5.8,22,0,['armored','support','ram','mortar','double','ballista','armored','volley','support','mortar']),
  level('The Moving Fortress',5.5,6.5,22,0,['armored','mortar','boss']),
  {...level('The old mountain keep',3.8,5.4,20,0,['cannon','armored','double','ram','volley','ballista','armored','double','mortar']),terrain:'mountain',noUpgrade:true,brief:'The mountain outpost has no workshop. Use the longer shell flight to counterattack.'},
  {...level('The wounded courtyard',3.9,5.6,20,0,['cannon','double','armored','ram','volley','ballista','mortar','armored','double']),terrain:'courtyard',hearts:2,brief:'This battered outpost has two hearts. Read both lanes before rising.'},
  {...level('The bridge convoy',3.5,5.6,21,0,['cannon','ram','armored','ram','double','ram','mortar','ram','ballista','support']),terrain:'river',brief:'Four rams are crossing the bridge. Keep firing through their reload windows.'},
  {...level('The siege muster',3.8,5.8,22,0,['cannon','mortar','ram','ballista','armored','volley','double','mortar','ballista','armored','volley','support']),terrain:'mountain',brief:'A fixed mixed battery combines slow mortar arcs and fast bolts. Each retry keeps the same formation.'},
  {...level('The long watch',3.8,5.6,20,0,['cannon','double','ram','armored','cannon','double','volley','ballista','ram','armored','mortar','support','mortar','volley','armored','ram','ballista','double']),terrain:'river',waveEnds:[6,12],brief:'Three waves. Clear the field to recover three hearts between waves.'},
  {...level('The royal siege',4.8,5.8,22,0,['mortar','armored','volley','boss']),terrain:'courtyard',brief:'The fortress returns with artillery escorts. Clear them, then strike its exposed reload.'},
]);

export function getLevelConfig(levelNumber,route=null) {
  const number=Math.min(TOTAL_LEVELS, Math.max(1, Math.floor(Number(levelNumber) || 1)));
  const base=LEVEL_CONFIGS[number-1];
  if(route&&number>=4&&number<=12)return routeConfig(base,route,number);
  const terrain=base.terrain||(number<=3?'plain':number<=6?'river':number<=9?'mountain':number===11?'mountain':number===12?'river':'courtyard');
  return {...base,terrain};
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const STEP = 1 / 120;

export class GameModel {
  constructor(level = 1, seed = 1234, upgrade = null, options = {}) {
    level = clamp(Math.floor(Number(level) || 1), 1, TOTAL_LEVELS);
    this.random = seededRandom(seed);
    this.events = [];
    this.nextId = 1;
    this.spawned = 0;
    this.spawnTimer = 0.45;
    this.config = options.config || getLevelConfig(level,options.route);
    this.spawnInterval = this.config.spawnInterval;
    this.shotTimer = 0.15;
    this.waveIndex=0;
    this.duckStarted = -Infinity;
    upgrade = this.config.noUpgrade?null:level >= UPGRADE_UNLOCK_LEVEL || options.mode ? validUpgrade(upgrade) : null;
    this.riseSpeed = upgrade === 'counterweight' ? 6 : 4;
    this.fireInterval = upgrade === 'archers' ? 0.55 : 0.68;
    this.state = {
      phase: 'playing', level, time: 0, hearts: clamp(options.hearts??this.config.hearts??3,1,3), score: 0, kills: 0,
      total: this.config.total,
      enemies: [], projectiles: [], arrows: [],
      exposure: 1, holding: false, power: false, combo: 0, perfects: 0,
      progress: 0, spawned: 0, upgrade, gateShield: upgrade === 'gate' ? 1 : 0,
      terrain:this.config.terrain||'plain',mode:options.mode||'campaign',round:options.round||1,
      cosmetic:options.cosmetic||'blue',maxCombo:0,ramKills:0,ramBreaches:0,
    };
  }

  setHolding(holding) {
    const s = this.state;
    holding = Boolean(holding);
    if (s.phase !== 'playing' || s.holding === holding) return;
    s.holding = holding;
    if (holding) this.duckStarted = s.time;
    this.emit(holding ? 'duck' : 'rise');
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  emit(type, details = {}) {
    this.events.push({ type, time: this.state.time, ...details });
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0 || this.state.phase !== 'playing') return;
    // Fixed-size integration prevents tunnelling through impacts on slower devices.
    let remaining = dt;
    while (remaining > 0.0000001 && this.state.phase === 'playing') {
      const step = Math.min(STEP, remaining);
      this.tick(step);
      remaining -= step;
    }
  }

  spawnEnemy() {
    const s = this.state;
    const index = this.spawned++;
    const type = this.config.formation[index % this.config.total];
    const archetype = ENEMY_TYPES[type];
    const maxHp = type === 'ram' ? this.config.ramHp : archetype.maxHp + this.config.healthBonus;
    // Batteries fire within a shared attack window, leaving a reliable counterattack
    // window even when several survive. Units never shoot immediately on spawning.
    const firstImpact = 2.75 + archetype.impactOffset;
    const flightTime=archetype.flightTime*(s.terrain==='mountain'?1.15:1);
    const earliestShot = s.time + 1.10 + this.random() * 0.12;
    const cycle = Math.max(0, Math.ceil((earliestShot + flightTime - firstImpact) / this.config.cycleTime));
    const alignedAttack = firstImpact + cycle * this.config.cycleTime - flightTime - s.time;
    // A newly arrived cannon must threaten the keep before three arrows destroy it.
    // After this opening shot it joins the battery's shared reload rhythm.
    const openingAttack = type !== 'ram' && alignedAttack > 1.7;
    const attackTimer = openingAttack ? earliestShot - s.time : alignedAttack;
    s.enemies.push({
      id: this.nextId++, type, lane: s.terrain==='courtyard'?(index%2?-1:1):(index + Math.floor(s.level / 3)) % 3 - 1,
      progress: 0.035, hp: maxHp, maxHp, warning: 0,
      speed: archetype.speed,
      attackTimer, openingAttack,
      burstTimer: -1, burstRemaining: 0,
      repairTimer:3.8,repairsLeft:3,exposedUntil:0,bossElapsed:0,bossFired:0,bossPhase:'salvo',enraged:false,
    });
    s.spawned = this.spawned;
  }

  fireEnemy(enemy) {
    const s = this.state;
    s.projectiles.push({
      id: this.nextId++, lane: enemy.lane, progress: 0, from: enemy.progress,
      duration: ENEMY_TYPES[enemy.type].flightTime*(s.terrain==='mountain'?1.15:1), elapsed: 0, type: enemy.type,whistled:false,
    });
    this.emit('enemyShot', { enemyId: enemy.id, lane: enemy.lane, enemyType: enemy.type });
  }

  hurt(reason, details = {}) {
    const s = this.state;
    if (reason === 'breach' && s.gateShield > 0) {
      s.gateShield -= 1;
      this.emit('gateBlock', details);
      return;
    }
    s.hearts = Math.max(0, s.hearts - 1);
    s.combo = 0;
    s.power = false;
    this.emit('hit', { reason, hearts: s.hearts, ...details });
    if (s.hearts === 0) {
      s.phase = 'lost';
      this.emit('lose');
    }
  }

  tickSupport(enemy,dt) {
    enemy.repairTimer-=dt;
    enemy.warning=enemy.repairsLeft>0?clamp(1-enemy.repairTimer/1.2,0,1):0;
    if(enemy.repairTimer>0||enemy.repairsLeft===0)return;
    enemy.repairTimer=6;
    const allies=this.state.enemies.filter(other=>other!==enemy&&other.type!=='boss'&&other.hp>0&&other.hp<other.maxHp&&Math.abs(other.progress-enemy.progress)<.22);
    if(!allies.length)return;
    enemy.repairsLeft--;
    enemy.exposedUntil=this.state.time+3;
    for(const ally of allies){ally.hp=Math.min(ally.maxHp,ally.hp+1);this.emit('repair',{enemyId:ally.id,lane:ally.lane,progress:ally.progress});}
    this.emit('supportOpen');
  }

  tickBoss(enemy,dt) {
    const previous=enemy.bossPhase;
    if(enemy.hp<=enemy.maxHp*.25){
      enemy.bossPhase='ram';enemy.speed=.028;enemy.warning=0;
    }else{
      if(!enemy.enraged&&enemy.hp<=enemy.maxHp*.5){enemy.enraged=true;this.emit('bossEnrage');}
      const cycle=enemy.enraged?5.9:6.5;
      enemy.bossElapsed+=dt;
      if(enemy.bossElapsed>=cycle){enemy.bossElapsed-=cycle;enemy.bossFired=0;}
      const shots=enemy.enraged?[.85,1.35,1.85]:[.85,1.35];
      while(enemy.bossFired<shots.length&&enemy.bossElapsed>=shots[enemy.bossFired]){this.fireEnemy(enemy);enemy.bossFired++;}
      enemy.bossPhase=enemy.bossElapsed<(enemy.enraged?2.6:2.2)?'salvo':'reload';
      enemy.warning=enemy.bossPhase==='salvo'?clamp(enemy.bossElapsed/.85,0,1):0;
    }
    if(previous!==enemy.bossPhase)this.emit('bossPhase',{phase:enemy.bossPhase});
  }

  tick(dt) {
    const s = this.state;
    s.time += dt;
    s.exposure = clamp(s.exposure + (s.holding ? -5 : this.riseSpeed) * dt, 0, 1);
    this.spawnTimer -= dt;
    const waveBoundary=this.config.waveEnds?.[this.waveIndex];
    const waveWaiting=this.spawned===waveBoundary;
    if(waveWaiting&&s.enemies.length===0&&s.projectiles.length===0){this.waveIndex++;s.hearts=3;s.gateShield=s.upgrade==='gate'?1:0;this.spawnTimer=2;this.emit('recovery',{wave:this.waveIndex+1});}
    if (!waveWaiting && this.spawned < s.total && this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer += this.spawnInterval;
    }

    for (const enemy of s.enemies) {
      let movement=enemy.speed*dt*(s.terrain==='mountain'?.86:1);
      if(s.terrain==='river'&&enemy.progress>.37&&enemy.progress<.56){
        movement=Math.min(movement,.015*dt);
        const ahead=s.enemies.filter(other=>other!==enemy&&other.progress>enemy.progress&&other.progress<.63).sort((a,b)=>a.progress-b.progress)[0];
        if(ahead)movement=Math.min(movement,Math.max(0,ahead.progress-enemy.progress-.07));
      }
      enemy.progress += movement;
      if (enemy.progress >= 1) {
        enemy.breached = true;
        if(enemy.type==='ram')s.ramBreaches++;
        this.hurt('breach', { enemyId: enemy.id, lane: enemy.lane });
        if (s.phase !== 'playing') return;
        continue;
      }
      if (enemy.type === 'ram') continue;
      if(enemy.type==='support'){this.tickSupport(enemy,dt);continue;}
      if(enemy.type==='boss'){this.tickBoss(enemy,dt);continue;}
      const archetype = ENEMY_TYPES[enemy.type];
      if (enemy.burstTimer >= 0) {
        enemy.burstTimer -= dt;
        if (enemy.burstTimer < 0) {
          this.fireEnemy(enemy);
          enemy.burstRemaining -= 1;
          if (enemy.burstRemaining > 0) enemy.burstTimer += archetype.burstGap;
        }
      }
      enemy.attackTimer -= dt;
      enemy.warning = clamp(1 - enemy.attackTimer / archetype.warningTime, 0, 1);
      if (enemy.attackTimer <= 0) {
        this.fireEnemy(enemy);
        enemy.burstRemaining = archetype.burstCount - 1;
        if (enemy.burstRemaining > 0) enemy.burstTimer = archetype.burstGap;
        if (enemy.openingAttack) {
          const firstImpact = 2.75 + archetype.impactOffset;
          const earliestNextShot = s.time + archetype.burstGap * (archetype.burstCount - 1) + 1.4;
          const flight=archetype.flightTime*(s.terrain==='mountain'?1.15:1);
          const cycle = Math.ceil((earliestNextShot + flight - firstImpact) / this.config.cycleTime);
          enemy.attackTimer = firstImpact + cycle * this.config.cycleTime - flight - s.time;
          enemy.openingAttack = false;
        } else {
          enemy.attackTimer += this.config.cycleTime;
        }
        enemy.warning = 0;
      }
    }
    s.enemies = s.enemies.filter(enemy => !enemy.breached);

    this.shotTimer = Math.max(0, this.shotTimer - dt);
    if (!s.holding && s.exposure >= 0.76 && this.shotTimer <= 0 && s.enemies.length) {
      // Ignore enemies already covered by arrows in flight when another target exists.
      const byDistance = [...s.enemies].sort((a, b) => {
        const priority=e=>e.type==='support'&&e.exposedUntil>s.time?2:e.type==='boss'&&e.bossPhase==='salvo'?-1:0;
        return priority(b)-priority(a)||b.progress-a.progress;
      });
      const target = byDistance.find(enemy => {
        const incomingDamage = s.arrows.reduce((sum, arrow) =>
          sum + (arrow.targetId === enemy.id ? arrow.damage : 0), 0);
        return incomingDamage < enemy.hp;
      }) || byDistance[0];
      const powered = s.power;
      s.power = false;
      s.arrows.push({
        id: this.nextId++, lane: target.lane, progress: 0, targetId: target.id,
        powered, damage: powered ? 2 : 1, elapsed: 0, duration: 0.35, targetProgress: target.progress,
      });
      this.shotTimer = this.fireInterval;
      this.emit('shot', { targetId: target.id, lane: target.lane, powered, damage: powered ? 2 : 1 });
    }

    for (const arrow of s.arrows) {
      arrow.elapsed += dt;
      arrow.progress = clamp(arrow.elapsed / arrow.duration, 0, 1);
      const target = s.enemies.find(enemy => enemy.id === arrow.targetId);
      if (target) arrow.targetProgress = target.progress;
      if (arrow.progress >= 1 && target && target.hp > 0) {
        if(target.type==='boss'&&target.bossPhase==='salvo'){
          this.emit('armorBlock',{enemyId:target.id,lane:target.lane,progress:target.progress});continue;
        }
        const damage = Math.min(target.hp, arrow.damage);
        target.hp = Math.max(0, target.hp - arrow.damage);
        this.emit('enemyHit', {
          enemyId: target.id, lane: target.lane, progress: target.progress,
          damage, hp: target.hp, maxHp: target.maxHp, powered: arrow.powered,
        });
        if (target.hp <= 0) {
          s.kills += 1;
          if(target.type==='ram')s.ramKills++;
          const points = ENEMY_TYPES[target.type].points
            + (arrow.powered ? 50 : 0);
          s.score += points;
          this.emit('kill', {
            enemyId: target.id, lane: target.lane, progress: target.progress,
            enemyType: target.type, powered: arrow.powered, points,
          });
        }
      }
    }
    s.arrows = s.arrows.filter(arrow => arrow.progress < 1);
    s.enemies = s.enemies.filter(enemy => enemy.hp > 0);

    for (const projectile of s.projectiles) {
      projectile.elapsed += dt;
      projectile.progress = clamp(projectile.elapsed / projectile.duration, 0, 1);
      if(projectile.type==='mortar'&&!projectile.whistled&&projectile.duration-projectile.elapsed<.8){projectile.whistled=true;this.emit('mortarWhistle');}
      if (projectile.progress < 1) continue;
      if (s.exposure < 0.28) {
        const sinceDuck = s.time - this.duckStarted;
        const perfect = s.holding && sinceDuck >= 0.17 && sinceDuck <= 0.60;
        if (perfect) {
          s.power = true;
          s.perfects += 1;
          s.combo += 1;
          s.maxCombo=Math.max(s.maxCombo,s.combo);
          const points = 25 * Math.min(s.combo, 4);
          s.score += points;
          this.emit('perfect', { lane: projectile.lane, combo: s.combo, points });
        } else {
          this.emit('dodge', { lane: projectile.lane });
        }
      } else {
        this.hurt('cannonball', { lane: projectile.lane });
        if (s.phase !== 'playing') return;
      }
    }
    s.projectiles = s.projectiles.filter(projectile => projectile.progress < 1);
    const resolved = this.spawned - s.enemies.length;
    s.progress = clamp(resolved / s.total, 0, 1);
    if (this.spawned === s.total && s.enemies.length === 0 && s.projectiles.length === 0) {
      s.phase = 'won';
      s.progress = 1;
      s.score += s.hearts * 200;
      this.emit('win', { score: s.score, hearts: s.hearts });
    }
  }
}
