export const UPGRADE_COST=50;
export const BRANCHES={offense:{name:'The Barrage',icon:'➶'},agility:{name:'The Shadows',icon:'↟'},defense:{name:'The Bastion',icon:'▥'}};
export const UPGRADES=Object.freeze({
  archers:{name:'Archer drills',branch:'offense',max:5,detail:'Each rank fires 3% more often.'},
  fletching:{name:'Fine fletching',branch:'offense',max:5,detail:'Each rank makes arrows travel 4% faster.'},
  ballista:{name:'Piercing ballista',branch:'offense',max:5,blueprint:true,detail:'Complete all 5 stages: every fourth shot sends a 1-damage piercing arrow into a nearby second engine. Fortress armor still blocks it.'},
  counterweight:{name:'Counterweights',branch:'agility',max:5,detail:'Each rank raises the keep 4% faster.'},
  nerve:{name:'Steady nerves',branch:'agility',max:5,detail:'Each rank lets you duck 0.02 seconds earlier and still earn a perfect.'},
  springboard:{name:'Kinetic springboard',branch:'agility',max:5,blueprint:true,detail:'Complete all 5 stages: a powered return shot scatters two extra 1-damage arrows at different engines.'},
  foundations:{name:'Deep foundations',branch:'defense',max:5,detail:'Each rank sinks the keep 3% faster.'},
  screens:{name:'Rampart screens',branch:'defense',max:5,detail:'Each rank protects 1% more of the keep while it ducks. Hearts stay unchanged.'},
  gate:{name:'Iron portcullis',branch:'defense',max:5,blueprint:true,detail:'Complete all 5 stages: block the first breach in every siege. Renews at endurance recovery breaks.'},
});
export function upgradeRanks(value){
  const data=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return Object.fromEntries(Object.entries(UPGRADES).map(([id,u])=>[id,typeof data[id]==='number'&&Number.isFinite(data[id])?Math.max(0,Math.min(u.max,Math.floor(data[id]))):0]));
}
export function upgradeCount(ranks){return Object.values(upgradeRanks(ranks)).reduce((sum,n)=>sum+n,0);}
export function canBuild(ranks,id){
  if(!Object.hasOwn(UPGRADES,id))return false;
  const u=UPGRADES[id],r=upgradeRanks(ranks);
  return r[id]<u.max&&(!u.blueprint||Object.entries(UPGRADES).filter(([,node])=>node.branch===u.branch&&!node.blueprint).reduce((n,[key])=>n+r[key],0)>=3);
}
export function upgradeStats(value){
  const r=upgradeRanks(value);
  return {riseSpeed:4*(1+.04*r.counterweight),duckSpeed:5*(1+.03*r.foundations),fireInterval:.68/(1+.03*r.archers),arrowDuration:.35/(1+.04*r.fletching),perfectWindow:.6+.02*r.nerve,safeExposure:.28+.01*r.screens,piercing:r.ballista===5,scatter:r.springboard===5,gate:r.gate===5};
}
export function buyUpgrade(saved,id){
  if(saved.completed<1||saved.stars<UPGRADE_COST||!canBuild(saved.upgrades,id))return false;
  saved.stars-=UPGRADE_COST;saved.upgrades=upgradeRanks(saved.upgrades);saved.upgrades[id]++;return true;
}
export const starsForEnemy=points=>Math.max(1,Math.round(points/20));
export const siegeReward=state=>state.phase==='won'?Math.max(UPGRADE_COST,state.stars||0):state.stars||0;
