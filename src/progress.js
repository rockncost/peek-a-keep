import { TOTAL_LEVELS } from './model.js';
import { CASTLE_COLORS, validRoute } from './content.js';
import { upgradeRanks, siegeReward } from './upgrades.js';
import { DEFAULT_MUSIC_VOLUME, DEFAULT_SFX_VOLUME, validVolume } from './audio.js';
import { volumeCeiling } from './volume-ui.js';

const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const integer=(value,min,max)=>Math.min(max,Math.max(min,Math.floor(Number(value)||0)));
const scores=value=>Object.fromEntries(Object.entries(object(value)).filter(([key,score])=>key.length<40&&Number.isFinite(score)&&score>=0));
export function restoreProgress(value) {
  const data=object(value),completed=integer(data.completed,0,TOTAL_LEVELS);
  const colors=['blue',...Object.keys(CASTLE_COLORS).filter(id=>id!=='blue'&&Array.isArray(data.colors)&&data.colors.includes(id))];
  return {
    unlocked:Math.max(integer(data.unlocked,1,TOTAL_LEVELS),Math.min(TOTAL_LEVELS,completed+1)),completed,
    best:scores(data.best),muted:!!data.muted,
    currencyVersion:1,stars:data.currencyVersion===1?integer(data.stars,0,1e9):completed*50,
    upgrades:upgradeRanks(data.currencyVersion===1?data.upgrades:null),
    settledRuns:Array.isArray(data.settledRuns)?data.settledRuns.filter(id=>typeof id==='string').slice(-32):[],
    testAccess:data.testAccess===true,
    musicVolume:validVolume(data.musicVolume,DEFAULT_MUSIC_VOLUME),sfxVolume:validVolume(data.sfxVolume,DEFAULT_SFX_VOLUME),
    musicVolumeCeiling:volumeCeiling(data.musicVolume,data.musicVolumeCeiling,DEFAULT_MUSIC_VOLUME),
    sfxVolumeCeiling:volumeCeiling(data.sfxVolume,data.sfxVolumeCeiling,DEFAULT_SFX_VOLUME),
    routes:Object.fromEntries([4,7,10].map(block=>[block,validRoute(object(data.routes)[block])]).filter(([,route])=>route)),
    colors,cosmetic:colors.includes(data.cosmetic)?data.cosmetic:'blue',
    endlessBest:{score:integer(object(data.endlessBest).score,0,1e9),round:integer(object(data.endlessBest).round,0,1e6)},
    dailyBest:Object.fromEntries(Object.entries(scores(data.dailyBest)).filter(([date])=>/^\d{4}-\d{2}-\d{2}$/.test(date)).sort().slice(-14)),
    challengeBest:scores(data.challengeBest),
  };
}
export function awardColors(saved,state) {
  if(state.phase!=='won')return [];
  const earned=[];
  for(const [id,condition] of [['emerald',state.hearts===3],['copper',state.ramKills>0&&state.ramBreaches===0],['royal',state.maxCombo>=5]]) {
    if(condition&&!saved.colors.includes(id)){saved.colors.push(id);earned.push(CASTLE_COLORS[id].name);}
  }
  return earned;
}
export function recordResult(saved,state,run) {
  if(run.testing)return [];
  if(run.id&&saved.settledRuns.includes(run.id))return [];
  saved.stars=Math.min(1e9,saved.stars+siegeReward(state));
  if(run.id)saved.settledRuns=[...saved.settledRuns,run.id].slice(-32);
  const won=state.phase==='won';
  if(run.kind==='campaign'&&won){saved.unlocked=Math.max(saved.unlocked,Math.min(TOTAL_LEVELS,state.level+1));saved.completed=Math.max(saved.completed,state.level);saved.best[state.level]=Math.max(saved.best[state.level]||0,state.score);}
  return awardColors(saved,state);
}
