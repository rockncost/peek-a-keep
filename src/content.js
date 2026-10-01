export const ROUTES = Object.freeze({
  river: {name:'River crossing',icon:'≈',description:'Heavy engines queue at a narrow bridge. Slow advance, crowded volleys.',suggestion:'Twin Archers wear down the convoy.',terrain:'river'},
  mountain: {name:'Mountain pass',icon:'△',description:'A winding approach lengthens shell flight. Artillery attacks need careful timing.',suggestion:'Counterweight helps you fire between shots.',terrain:'mountain'},
  courtyard: {name:'Royal courtyard',icon:'▥',description:'Two alternating lanes and an extra ram press the gate.',suggestion:'Reinforced Gate gives a safety net.',terrain:'courtyard'},
});
export const CASTLE_COLORS = Object.freeze({
  blue:{name:'Sky blue',color:0x428cae,requirement:'Your original colors'},
  emerald:{name:'Emerald banner',color:0x368a65,requirement:'Win with three hearts'},
  copper:{name:'Copper banner',color:0xc18443,requirement:'Win after destroying a ram, with no ram breaches'},
  royal:{name:'Royal violet',color:0x9663b8,requirement:'Win with a five-perfect streak'},
});
export const CHALLENGES = Object.freeze({
  brave:{name:'Two hearts',description:'Defend the courtyard with only two hearts.',level:8,route:'courtyard',hearts:2},
  bare:{name:'Old-fashioned keep',description:'No castle upgrade. Your timing does the work.',level:7,route:'mountain',hearts:3,noUpgrade:true},
  convoy:{name:'Ram convoy',description:'Four reinforced rams. Stop the whole procession.',level:9,route:'river',hearts:3},
});
export const routeBlock = level => level>=4&&level<=12 ? Math.floor((level-4)/3)*3+4 : null;
export const validRoute = route => Object.hasOwn(ROUTES,route||'')?route:null;
export const dailyDate = (date=new Date()) => date.toISOString().slice(0,10);
// Shared projection keeps arrows attached to targets on winding roads and bridges.
export function approachX(lane,progress,terrain){
  if(terrain==='river'){const pinch=Math.max(0,1-Math.abs(progress-.465)/.18);return lane*1.5*(1-pinch*.92);}
  if(terrain==='mountain')return lane*.9+Math.sin(progress*Math.PI*3)*1.35;
  return lane*(terrain==='courtyard'?1.95:1.5);
}
export function seedFromText(text){let seed=2166136261;for(const char of text){seed^=char.charCodeAt(0);seed=Math.imul(seed,16777619);}return seed>>>0;}
export function seededRandom(seed){let value=seed>>>0;return()=>{value+=0x6d2b79f5;let r=Math.imul(value^(value>>>15),value|1);r^=r+Math.imul(r^(r>>>7),r|61);return((r^(r>>>14))>>>0)/4294967296;};}

export function routeConfig(base,route,level){
  if(!validRoute(route))return base;
  const formation=[...base.formation];
  if(route==='river'){
    const index=formation.indexOf('cannon');if(index>=0)formation[index]='armored';
  }
  if(route==='courtyard'&&!formation.includes('boss'))formation.splice(Math.min(4,formation.length),0,'ram');
  return {...base,formation,total:formation.length,terrain:route,route,
    spawnInterval:base.spawnInterval+(route==='river'?.25:.15),label:base.label};
}
export function endlessConfig(round){
  round=Math.max(1,Math.floor(Number(round)||1));
  if(round%9===0)return{label:'Fortress round',formation:['boss'],total:1,spawnInterval:4,cycleTime:6.1,ramHp:22,healthBonus:0,terrain:'courtyard'};
  const pools=[['cannon','double','ram','armored'],['double','armored','ram','volley','ballista'],['mortar','volley','armored','ballista','ram','support','double']];
  const pool=pools[Math.min(2,Math.floor((round-1)/3))],random=seededRandom(round*7159);
  const formation=Array.from({length:Math.min(16,7+round)},(_,i)=>i===0?'cannon':pool[Math.floor(random()*pool.length)]);
  return {label:`Endless round ${round}`,formation,total:formation.length,spawnInterval:Math.max(2.7,4.2-round*.09),cycleTime:Math.max(4.6,5.9-round*.045),ramHp:Math.min(24,16+Math.floor(round/3)),healthBonus:Math.min(3,Math.floor((round-1)/9)),terrain:['plain','river','mountain','courtyard'][Math.floor((round-1)/3)%4]};
}
export function dailyConfig(date=dailyDate()){
  const seed=seedFromText(`peek-a-keep-daily-v1:${date}`),random=seededRandom(seed);
  const pool=['cannon','double','armored','volley','ballista','mortar'];
  const formation=['cannon','mortar','ram',...Array.from({length:8},()=>pool[Math.floor(random()*pool.length)]),'support'];
  return {seed,date,config:{label:'Daily siege',formation,total:formation.length,spawnInterval:3.8,cycleTime:5.8,ramHp:20,healthBonus:0,terrain:['river','mountain','courtyard'][seed%3]}};
}
