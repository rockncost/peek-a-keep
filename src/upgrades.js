export const UPGRADE_COST=50;
export const BRANCHES={offense:{name:'The Barrage',icon:'➶'},agility:{name:'The Shadows',icon:'↟'},defense:{name:'The Bastion',icon:'▥'}};
export const UPGRADES=Object.freeze({
  archers:{name:'Archer drills',branch:'offense',max:5,detail:'Each rank fires 3% more often.'},
  fletching:{name:'Fine fletching',branch:'offense',max:5,detail:'Each rank makes arrows travel 4% faster.'},
  ballista:{name:'Piercing ballista',branch:'offense',max:5,advanced:true,detail:'Each rank improves piercing cadence from every eighth to every fourth shot. Sends a 1-damage piercing arrow into a nearby second engine. Fortress armor still blocks it.'},
  counterweight:{name:'Counterweights',branch:'agility',max:5,detail:'Each rank raises the keep 4% faster.'},
  nerve:{name:'Steady nerves',branch:'agility',max:5,detail:'Each rank lets you duck 0.02 seconds earlier and still earn a perfect.'},
  springboard:{name:'Kinetic springboard',branch:'agility',max:5,advanced:true,detail:'Rank 1 adds one extra arrow to each powered return. Higher ranks add a second every fourth, third, second, then every return.'},
  foundations:{name:'Deep foundations',branch:'defense',max:5,detail:'Each rank sinks the keep 3% faster.'},
  screens:{name:'Rampart screens',branch:'defense',max:5,detail:'Each rank protects 1% more of the keep while it ducks. Hearts stay unchanged.'},
  gate:{name:'Iron portcullis',branch:'defense',max:5,advanced:true,detail:'Block a breach, then rebuild in 80 seconds. Each further rank rebuilds 10 seconds faster. Renews between sieges and waves.'},
});
export function upgradeRanks(value){
  const data=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return Object.fromEntries(Object.entries(UPGRADES).map(([id,u])=>[id,typeof data[id]==='number'&&Number.isFinite(data[id])?Math.max(0,Math.min(u.max,Math.floor(data[id]))):0]));
}
export function upgradeCount(ranks){return Object.values(upgradeRanks(ranks)).reduce((sum,n)=>sum+n,0);}
export function canBuild(ranks,id){
  if(!Object.hasOwn(UPGRADES,id))return false;
  const u=UPGRADES[id],r=upgradeRanks(ranks);
  return r[id]<u.max&&(!u.advanced||Object.entries(UPGRADES).filter(([,node])=>node.branch===u.branch&&!node.advanced).reduce((n,[key])=>n+r[key],0)>=3);
}
export function upgradeStats(value){
  const r=upgradeRanks(value);
  return {riseSpeed:4*(1+.04*r.counterweight),duckSpeed:5*(1+.03*r.foundations),fireInterval:.68/(1+.03*r.archers),arrowDuration:.35/(1+.04*r.fletching),perfectWindow:.6+.02*r.nerve,safeExposure:.28+.01*r.screens,piercing:r.ballista>0,pierceInterval:9-r.ballista,scatter:r.springboard>0,scatterInterval:r.springboard===1?Infinity:6-r.springboard,gate:r.gate>0,gateCooldown:90-10*r.gate};
}
export function buyUpgrade(saved,id){
  if(saved.completed<1||saved.stars<UPGRADE_COST||!canBuild(saved.upgrades,id))return false;
  saved.stars-=UPGRADE_COST;saved.upgrades=upgradeRanks(saved.upgrades);saved.upgrades[id]++;return true;
}
export const starsForEnemy=points=>Math.max(1,Math.round(points/20));
export const siegeReward=state=>state.phase==='won'?Math.max(UPGRADE_COST,state.stars||0):state.stars||0;
