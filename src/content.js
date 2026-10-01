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
export const validRoute = route => Object.hasOwn(ROUTES,route||'')?route:null;
// Shared projection keeps arrows attached to targets on winding roads and bridges.
export function approachX(lane,progress,terrain){
  if(terrain==='river'){const pinch=Math.max(0,1-Math.abs(progress-.465)/.18);return lane*1.5*(1-pinch*.92);}
  if(terrain==='mountain')return lane*.9+Math.sin(progress*Math.PI*3)*1.35;
  return lane*(terrain==='courtyard'?1.95:1.5);
}
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
