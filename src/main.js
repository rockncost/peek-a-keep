import { GameModel, TOTAL_LEVELS, ENEMY_TYPES, getChallengeConfig } from './model.js';
import { GameScene } from './scene.js';
import { GameAudio, DEFAULT_MUSIC_VOLUME, DEFAULT_SFX_VOLUME } from './audio.js';
import { volumePercent, volumeFromPercent } from './volume-ui.js';
import { UPGRADES, UPGRADE_UNLOCK_LEVEL, UPGRADE_MILESTONES, validUpgrade } from './upgrades.js';

import { ROUTES, CASTLE_COLORS, CHALLENGES, routeBlock, validRoute, dailyDate, dailyConfig, endlessConfig } from './content.js';
import { restoreProgress, recordResult } from './progress.js';

const $=id=>document.getElementById(id);
const introductions={1:'Watch the cannonballs!',2:'Reinforced rams need sustained fire.',3:'Twin cannons fire twice. Wait for both.',4:'Ironclads have thick armor.',6:'Volley carts fire three spaced shots.',8:'Ballistas fire fast bolts. Watch the wind-up.'};
const SAVE_KEY='peek-a-keep-save-v1';
let saved=restoreProgress(null);
try{saved=restoreProgress(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch{}
const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(saved));}catch{}};
const audio=new GameAudio();audio.musicVolume=saved.musicVolume;audio.sfxVolume=saved.sfxVolume;audio.muted=saved.muted;
let scene,model=new GameModel(1),mode='title',lastTime=0,toastTimer=0,flashTimer=0,resultTimer=-1,guideReturn='title';
const holds=new Set();
let workshopLevel=null;
let pendingRun=null,runContext={kind:'campaign',level:1};
let settingsReturn='title';
const workshopUnlocked=()=>saved.unlocked>=UPGRADE_UNLOCK_LEVEL;
const heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21S2 14.7 2 7.8C2 2.1 9 1 12 6c3-5 10-3.9 10 1.8C22 14.7 12 21 12 21z"/></svg>';

function updateSound(){
  $('soundButton').innerHTML=audio.muted?'<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6"/></svg>':'<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4zM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></svg>';
  $('soundButton').setAttribute('aria-label',audio.muted?'Unmute sound':'Mute sound');
  if($('settingsMute')){$('settingsMute').textContent=audio.muted?'Unmute all sound':'Mute all sound';$('settingsMute').setAttribute('aria-pressed',String(audio.muted));}
  if($('muteNote'))$('muteNote').textContent=audio.muted?'All sound is muted. Your volume choices are saved.':'Volume choices are saved automatically.';
}
function toggleSound(){audio.muted=!audio.muted;audio.unlock();saved.muted=audio.muted;save();updateSound();}
function releaseAll(){holds.clear();model.setHolding(false);}
function setMenu(html,style=''){
  audio.setActive(mode!=='paused'&&!(mode==='guide'&&guideReturn==='paused')&&!(mode==='settings'&&settingsReturn==='paused'));
  $('overlay').className=`overlay ${style}`;$('overlay').innerHTML=html;$('overlay').hidden=false;
  $('controls').hidden=true;$('pauseButton').disabled=true;$('combatHint').textContent='';
}
function title(){
  runContext={kind:'campaign',level:1};
  releaseAll();mode='title';model=new GameModel(1);model.state.enemies=[{id:990,type:'cannon',lane:-1,progress:.18,hp:3,maxHp:3,warning:0},{id:991,type:'cannon',lane:1,progress:.02,hp:3,maxHp:3,warning:0}];
  model.state.cosmetic=saved.cosmetic;$('hud').hidden=true;$('toast').classList.remove('visible');
  setMenu(`<div class="start-heading"><span class="eyebrow">A CASTLE THAT DUCKS</span><h1 class="game-title"><span>PEEK-</span><span>A-KEEP</span></h1><p>A little courage. A lot of ducking.</p></div><div class="start-bottom"><div class="start-instructions"><strong>Hold</strong> to hide underground.<br><strong>Release</strong> to let your archers fire.</div><button class="primary-button" data-action="play">${saved.unlocked>1?'Continue the defense':'Defend the keep'}</button><div class="start-links"><button class="secondary-button" data-action="levels">Choose a siege${saved.completed===TOTAL_LEVELS?' · 13/13':''}</button><button class="secondary-button" data-action="guide">Enemy guide</button><button class="secondary-button" data-action="settings">Settings</button></div>${workshopUnlocked()?`<button class="secondary-button workshop-link" data-action="workshop">Castle workshop${saved.upgrade?' · '+UPGRADES[saved.upgrade].name:' · New!'}</button>`:''}<button class="secondary-button workshop-link" data-action="extras">More defenses · Daily & Endless</button><button class="secondary-button" data-action="wardrobe">Castle colors</button></div>`,'start');
}
function startLevel(level){
  runContext={kind:'campaign',level};
  const block=routeBlock(level);
  if(block&&!saved.routes[block]){chooseRoute(level);return;}
  if(level>=UPGRADE_UNLOCK_LEVEL&&!saved.upgrade){workshop(level);return;}
  launchRun(runContext);
}
function chooseRoute(level){
  releaseAll();mode='routes';$('hud').hidden=true;
  const block=routeBlock(level);
  setMenu('<div class="panel route-panel"><span class="eyebrow">A FORK IN THE ROAD</span><h1>Choose the approach.</h1><p>Your route shapes sieges '+block+'–'+(block+2)+'. You can change it from Choose a siege.</p><div class="upgrade-choices">'+Object.entries(ROUTES).map(([id,r])=>'<button class="upgrade-choice" data-route="'+id+'" data-route-level="'+level+'"><span class="upgrade-icon">'+r.icon+'</span><span class="upgrade-copy"><strong>'+r.name+'</strong><span>'+r.description+'</span><b>'+r.suggestion+'</b></span></button>').join('')+'</div><button class="secondary-button" data-action="levels">Back to sieges</button></div>');
}
function launchRun(run){
  releaseAll();runContext=run;audio.setActive(true);audio.unlock();
  let config,seed=run.seed??Math.floor(Math.random()*0x7fffffff),level=run.level??13;
  const options={mode:run.kind,cosmetic:saved.cosmetic};
  if(run.kind==='campaign'){delete options.mode;options.route=saved.routes[routeBlock(level)];}
  if(run.kind==='endless'){config=endlessConfig(run.round);options.hearts=run.hearts;options.round=run.round;}
  if(run.kind==='daily'){const daily=dailyConfig(run.date);config=daily.config;seed=daily.seed;}
  if(run.kind==='challenge'){
    const challenge=CHALLENGES[run.challenge];level=challenge.level;options.hearts=challenge.hearts;config=getChallengeConfig(run.challenge);
  }
  if(config)options.config=config;
  const upgrade=run.kind==='challenge'&&CHALLENGES[run.challenge].noUpgrade?null:saved.upgrade;
  model=new GameModel(level,seed,upgrade,options);mode='playing';resultTimer=-1;
  $('overlay').hidden=true;$('hud').hidden=false;$('controls').hidden=false;$('pauseButton').disabled=false;
  $('levelNumber').textContent=run.kind==='campaign'?'SIEGE '+String(level).padStart(2,'0')+' / 13':run.kind==='endless'?'ENDLESS · ROUND '+run.round:run.kind==='daily'?'DAILY · '+run.date:'CHALLENGE BANNER';
  $('levelName').textContent=model.config.label;
  toast(run.kind==='campaign'?(introductions[level]||({11:'Mortars arc high. Watch the landing shadow.',12:'Repair wagons expose their banner after healing.',13:'The fortress opens its weak point to reload.'}[level])||'Stand your ground'):run.kind==='endless'?'Round '+run.round+' · '+(ROUTES[model.state.terrain]?.name||'Open road'):'Read the threats. Defend the keep.',3);
  updateHUD();
}
function extras(){
  releaseAll();mode='extras';$('hud').hidden=true;
  const date=dailyDate();
  setMenu('<div class="panel extras-panel"><span class="eyebrow">ANOTHER DAY AT THE BATTLEMENTS</span><h1>More defenses.</h1><button class="mode-choice" data-action="endless"><strong>∞ Endless defense</strong><span>Escalating rounds. Recover and refit every three.<br>Best: '+saved.endlessBest.score.toLocaleString()+' · '+saved.endlessBest.round+' rounds cleared</span></button><button class="mode-choice" data-action="daily"><strong>☀ Daily siege</strong><span>'+date+' · Changes at midnight UTC.<br>Same formation for everyone. Your best: '+(saved.dailyBest[date]||0).toLocaleString()+'</span></button><span class="eyebrow challenge-heading">OPTIONAL CHALLENGE BANNERS</span>'+Object.entries(CHALLENGES).map(([id,c])=>'<button class="mode-choice" data-challenge="'+id+'"><strong>'+c.name+(saved.challengeBest[id]?' · ✓':'')+'</strong><span>'+c.description+'</span></button>').join('')+'<button class="secondary-button" data-action="title">Back to the keep</button></div>');
}
function wardrobe(){
  releaseAll();mode='wardrobe';$('hud').hidden=true;
  setMenu('<div class="panel"><span class="eyebrow">FLY YOUR COLORS</span><h1>A keep of your own.</h1><p>Cosmetic rewards. Earn them in any mode.</p><div class="upgrade-choices">'+Object.entries(CASTLE_COLORS).map(([id,c])=>'<button class="upgrade-choice '+(saved.cosmetic===id?'selected':'')+'" data-color="'+id+'" '+(saved.colors.includes(id)?'':'disabled')+'><span class="color-swatch" style="background:#'+c.color.toString(16).padStart(6,'0')+'"></span><span class="upgrade-copy"><strong>'+c.name+(saved.cosmetic===id?' · FITTED':'')+'</strong><span>'+c.requirement+'</span></span></button>').join('')+'</div><button class="secondary-button" data-action="title">Back to the keep</button></div>');
}
function refitRun(run){
  if(run.kind==='challenge'&&CHALLENGES[run.challenge].noUpgrade){launchRun(run);return;}
  pendingRun=run;workshop();
}
function restartRun(){
  const run=runContext;
  if(run.kind==='endless')launchRun({kind:'endless',round:1,score:0,hearts:3});
  else launchRun({...run});
}
function pause(){
  if(mode!=='playing')return;releaseAll();mode='paused';
  setMenu(`<div class="panel pause-panel"><span class="eyebrow">TAKE A BREATHER</span><span class="medal">Ⅱ</span><h1>The siege can wait.</h1><p>Your little kingdom is right where you left it.</p>${model.state.upgrade?`<div class="pause-upgrade"><strong>${UPGRADES[model.state.upgrade].name}</strong><span>${UPGRADES[model.state.upgrade].detail}</span></div>`:''}<button class="primary-button" data-action="resume">Back to the battlements</button><button class="secondary-button" data-action="guide">Enemy guide</button><button class="secondary-button" data-action="settings">Settings</button><button class="secondary-button" data-action="restart">Restart siege</button><button class="secondary-button" data-action="title">Return to title</button></div>`);
}
function resume(){if(mode!=='paused')return;mode='playing';$('overlay').hidden=true;$('controls').hidden=false;$('pauseButton').disabled=false;audio.setActive(true);audio.unlock();}
function settings(){
  settingsReturn=mode==='paused'?'paused':'title';releaseAll();mode='settings';
  setMenu(`<div class="panel settings-panel"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h1>Sound your way.</h1><p>A quiet tune. A mighty cannon.<br>Set the balance that feels right.</p><div class="volume-setting"><div><label for="musicVolume">Music</label><output id="musicVolumeValue" for="musicVolume">${volumePercent(audio.musicVolume,saved.musicVolumeCeiling)}%</output></div><input id="musicVolume" class="audio-slider" type="range" min="0" max="100" value="${volumePercent(audio.musicVolume,saved.musicVolumeCeiling)}" aria-describedby="musicHelp"><small id="musicHelp">Hammer and Gate · looping background track</small></div><div class="volume-setting"><div><label for="sfxVolume">Sound effects</label><output id="sfxVolumeValue" for="sfxVolume">${volumePercent(audio.sfxVolume,saved.sfxVolumeCeiling)}%</output></div><input id="sfxVolume" class="audio-slider" type="range" min="0" max="100" value="${volumePercent(audio.sfxVolume,saved.sfxVolumeCeiling)}" aria-describedby="sfxHelp"><small id="sfxHelp">Cannons, arrows, ducks, and victory sounds</small></div><button class="secondary-button preview-sfx" data-action="preview-cannon">Test cannon · Pphhh-BOOM</button><p id="muteNote" class="settings-note"></p><div class="settings-actions"><button id="settingsMute" class="secondary-button" data-action="mute"></button><button class="secondary-button" data-action="audio-defaults">Reset volumes</button></div><button class="primary-button" data-action="settings-back">${settingsReturn==='paused'?'Back to the pause menu':'Back to the keep'}</button></div>`);
  updateSound();
}
function closeSettings(){if(settingsReturn==='paused'){mode='playing';pause();}else title();}
function setVolume(channel,value){
  audio[channel]=value;saved[channel]=audio[channel];save();
  if($(channel)){$(channel).value=volumePercent(audio[channel],saved[channel+'Ceiling']);$(channel+'Value').textContent=`${volumePercent(audio[channel],saved[channel+'Ceiling'])}%`;}
}
function workshop(nextLevel=null){
  releaseAll();workshopLevel=nextLevel;mode='workshop';$('hud').hidden=true;
  setMenu(`<div class="panel workshop-panel"><span class="eyebrow">THE CASTLE WORKSHOP</span><h1>Strengthen the keep.</h1><p>Choose one upgrade for sieges 4–13 and extra modes.</p><div class="upgrade-choices">${Object.entries(UPGRADES).map(([id,upgrade])=>`<button class="upgrade-choice ${saved.upgrade===id?'selected':''}" data-upgrade="${id}" aria-pressed="${saved.upgrade===id}"><span class="upgrade-icon" aria-hidden="true">${upgrade.icon}</span><span class="upgrade-copy"><strong>${upgrade.name}${saved.upgrade===id?' <small>FITTED</small>':''}</strong><b>${upgrade.stat}</b><span>${upgrade.summary}</span></span></button>`).join('')}</div><div class="workshop-note">${nextLevel?`Choose to begin siege ${nextLevel}.`:'Choose to fit your keep.'} Swap here between sieges; upgrades never stack.</div><button class="secondary-button" data-action="${nextLevel?'levels':'title'}">${nextLevel?'Choose a different siege':'Back to the keep'}</button></div>`);
}
function levels(){
  mode='levels';$('hud').hidden=true;
  setMenu(`<div class="panel"><span class="eyebrow">THE LITTLE CAMPAIGN</span><h1>Pick your siege.</h1><p>Defend a siege to unlock the next.</p><div class="level-grid">${Array.from({length:TOTAL_LEVELS},(_,i)=>`<button class="level-choice ${i+1===saved.unlocked?'selected':''}" data-level="${i+1}" ${i+1>saved.unlocked?'disabled':''} aria-label="Siege ${i+1}${i+1>saved.unlocked?', locked':''}">${i+1}${i<saved.completed?'<small> ✓</small>':''}</button>`).join('')}</div><div class="route-links">${[4,7,10].filter(block=>saved.unlocked>=block).map(block=>`<button class="secondary-button" data-route-level="${block}" data-change-route="1">Sieges ${block}–${block+2} · ${ROUTES[saved.routes[block]]?.name||'Choose route'}</button>`).join('')}</div><button class="secondary-button" data-action="title">Back to the keep</button></div>`);
}
function enemyGuide(){
  guideReturn=mode==='paused'?'paused':'title';mode='guide';
  const unlockedAt={cannon:1,ram:2,double:3,armored:4,volley:6,ballista:8,mortar:11,support:12,boss:13};
  setMenu(`<div class="panel guide-panel"><span class="eyebrow">KNOW YOUR ENEMY</span><h1>Nine siege engines.</h1><div class="enemy-guide">${Object.entries(ENEMY_TYPES).map(([type,enemy])=>`<article class="enemy-entry ${type}"><div><strong>${enemy.name}</strong><span>${type==='ram'?'14–22':enemy.maxHp} HP · Siege ${unlockedAt[type]}</span></div><p>${enemy.description}</p></article>`).join('')}</div><div class="guide-note"><strong>Arrows: 1 damage.</strong> A perfect duck charges one <strong>2-damage</strong> shot. Cyan arrows and damage numbers show the bonus.</div><button class="secondary-button" data-action="guide-back">${guideReturn==='paused'?'Back to the pause menu':'Back to the keep'}</button></div>`);
}
function result(){
  const s=model.state,won=s.phase==='won',campaign=runContext.kind==='campaign',final=won&&campaign&&s.level===TOTAL_LEVELS;
  mode='result';releaseAll();
  const earned=recordResult(saved,s,runContext);save();
  const endless=runContext.kind==='endless',totalScore=(runContext.score||0)+s.score;
  const heading=final?'Long live the keep!':won?'Still standing.':'A little too brave.';
  const description=final?'Thirteen sieges. The Moving Fortress has fallen.':endless?(won?(runContext.round%3===0?'Recovery break: three hearts restored. Choose your next upgrade.':'The next round brings a new formation. Hearts carry over.'):'Your defense reached round '+runContext.round+'. Best score: '+saved.endlessBest.score.toLocaleString()):won?'The flags fly another day. Take a bow, then a breath.':'Watch the incoming shells. Hide before they reach your castle.';
  setMenu('<div class="panel"><span class="eyebrow">'+(campaign?'SIEGE '+String(s.level).padStart(2,'0'):endless?'ENDLESS · ROUND '+runContext.round:runContext.kind==='daily'?'DAILY · '+runContext.date:'CHALLENGE BANNER')+(won?' DEFENDED':' · SETBACK')+'</span><span class="medal">'+(won?'✦':'◇')+'</span><h1>'+heading+'</h1><p>'+description+'</p>'+(earned.length?'<div class="reward-note">New castle colors: '+earned.join(', ')+'!</div>':'')+'<div class="result-stats"><div><strong>'+totalScore.toLocaleString()+'</strong><span>Score</span></div><div><strong>'+s.perfects+'</strong><span>Perfect ducks</span></div><div><strong>'+(won?s.hearts:s.kills)+'</strong><span>'+(won?'Hearts saved':'Defeated')+'</span></div></div><button class="primary-button" data-action="'+(won&&((campaign&&!final)||endless)?'next':'restart')+'">'+(won&&endless?'On to round '+(runContext.round+1):won&&campaign&&!final?'On to siege '+(s.level+1):final?'Defend it again':'One more try')+'</button><button class="secondary-button" data-action="'+(campaign?'levels':'extras')+'">'+(campaign?'Choose a siege':'More defenses')+'</button><button class="secondary-button" data-action="title">Back to the keep</button></div>');
}
function toast(message,duration=1.5,type=''){$('toast').textContent=message;$('toast').className=`toast visible ${type}`;toastTimer=duration;}
function updateHUD(){
  const s=model.state;
  const upgrade=UPGRADES[s.upgrade];
  $('upgradeStatus').hidden=!upgrade;
  $('upgradeStatus').textContent=upgrade?`${upgrade.icon} ${upgrade.name}${s.upgrade==='gate'?(s.gateShield?' · BLOCK READY':' · BLOCK USED'):''}`:'';
  $('score').textContent=((runContext.score||0)+s.score).toLocaleString();
  $('terrainName').textContent=ROUTES[s.terrain]?.name||'Open road';
  const boss=s.enemies.find(e=>e.type==='boss');$('bossStatus').hidden=!boss;
  if(boss){$('bossLabel').textContent='MOVING FORTRESS · '+(boss.bossPhase==='ram'?'FINAL RAM ADVANCE':boss.bossPhase==='reload'?'WEAK POINT OPEN':boss.enraged?'ENRAGED SALVO':'ARMORED SALVO');$('bossHealth').style.width=(boss.hp/boss.maxHp*100)+'%';$('bossValue').textContent=boss.hp+' / '+boss.maxHp;}
  if($('hearts').dataset.value!==String(s.hearts)){$('hearts').dataset.value=String(s.hearts);$('hearts').innerHTML=Array.from({length:3},(_,i)=>i<s.hearts?heart:heart.replace('<svg','<svg class="empty"')).join('');$('hearts').setAttribute('aria-label',`${s.hearts} hearts remaining`);}
  $('waveLabel').textContent=`${s.kills} / ${s.total} defeated`;$('waveProgress').style.width=`${s.progress*100}%`;
  $('duckButton').classList.toggle('held',s.holding);$('duckButton').setAttribute('aria-pressed',String(s.holding));
  $('controlTitle').textContent=s.holding?(s.exposure<.28?'Safe underground':'Ducking…'):'Hold to hide';$('controlSubtitle').textContent=s.holding?'Release to fire back':'Release to fire';
  $('castleStatus').textContent=s.holding?'KEEPING A LOW PROFILE':'ARCHERS READY';$('stateDot').style.background=s.holding?'#abd6ed':'#c4f3a1';$('powerLabel').hidden=!s.power;
  const danger=s.projectiles.some(p=>p.duration-p.elapsed<.65);
  $('combatHint').textContent=mode!=='playing'?'':danger?(s.holding?'STAY DOWN…':'INCOMING · HOLD TO HIDE'):boss?.bossPhase==='reload'?'ALL CLEAR · WEAK POINT OPEN':boss?.bossPhase==='ram'?'ALL CLEAR · STOP THE FORTRESS':s.holding&&s.enemies.length?'ALL CLEAR · RELEASE TO FIRE':'';
  $('combatHint').style.color=danger&&!s.holding?'#fff0b3':'#f2efd1';
}
function processEvents(events){
  for(const event of events){
    audio.play(event.type,event);
    if(event.type==='perfect')toast(`Perfect duck!${event.combo>1?' ×'+event.combo:''}  +${event.points}`,1.4,'perfect');
    if(event.type==='dodge')toast('Missed me!',.9);
    if(event.type==='supportOpen')toast('Repair banner open · Archers targeting wagon',2);
    if(event.type==='bossEnrage')toast('Fortress enraged · Three-shot salvo!',2.5,'damage');
    if(event.type==='bossPhase'&&event.phase==='ram')toast('Final ram advance · Keep firing!',2.5);
    if(event.type==='gateBlock')toast('Gate held! Breach blocked.',1.8,'perfect');
    if(event.type==='hit'){toast(event.reason==='breach'?'They reached the gate!':'Ouch! Duck a little sooner.',1.8,'damage');$('hitFlash').classList.add('active');flashTimer=.23;}
    if(event.type==='win'||event.type==='lose'){releaseAll();mode='ending';resultTimer=event.type==='win'?1.45:.85;$('pauseButton').disabled=true;$('controls').hidden=true;}
  }
}
$('overlay').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  audio.unlock();
  if(button.dataset.upgrade){
    saved.upgrade=validUpgrade(button.dataset.upgrade);save();
    const nextLevel=workshopLevel,run=pendingRun;pendingRun=null;
    if(run){launchRun(run);return;}
    if(nextLevel)startLevel(nextLevel);else {title();toast(`${UPGRADES[saved.upgrade].name} fitted!`,2);}
    return;
  }
  if(button.dataset.route){const level=Number(button.dataset.routeLevel);saved.routes[routeBlock(level)]=validRoute(button.dataset.route);save();startLevel(level);return;}
  if(button.dataset.changeRoute){chooseRoute(Number(button.dataset.routeLevel));return;}
  if(button.dataset.color){saved.cosmetic=button.dataset.color;save();model.state.cosmetic=saved.cosmetic;wardrobe();return;}
  if(button.dataset.challenge){refitRun({kind:'challenge',challenge:button.dataset.challenge});return;}
  if(button.dataset.level){startLevel(Number(button.dataset.level));return;}
  const action=button.dataset.action;
  if(action==='play')startLevel(saved.unlocked);
  if(action==='title'){pendingRun=null;title();}
  if(action==='extras'){pendingRun=null;extras();}
  if(action==='wardrobe')wardrobe();
  if(action==='endless')refitRun({kind:'endless',round:1,score:0,hearts:3});
  if(action==='daily')refitRun({kind:'daily',date:dailyDate()});
  if(action==='levels')levels();
  if(action==='resume')resume();
  if(action==='restart')restartRun();
  if(action==='next'){
    if(runContext.kind==='endless'){const round=runContext.round+1,run={kind:'endless',round,score:runContext.score+model.state.score,hearts:(round-1)%3===0?3:model.state.hearts};if((round-1)%3===0)refitRun(run);else launchRun(run);return;}
    const next=Math.min(TOTAL_LEVELS,model.state.level+1);
    if(UPGRADE_MILESTONES.includes(model.state.level)){pendingRun=null;workshop(next);}else startLevel(next);
  }
  if(action==='workshop'&&workshopUnlocked())workshop();
  if(action==='guide')enemyGuide();
  if(action==='settings')settings();
  if(action==='settings-back')closeSettings();
  if(action==='mute')toggleSound();
  if(action==='preview-cannon')audio.play('enemyShot',{enemyType:'cannon'});
  if(action==='audio-defaults'){saved.musicVolumeCeiling=DEFAULT_MUSIC_VOLUME;saved.sfxVolumeCeiling=DEFAULT_SFX_VOLUME;setVolume('musicVolume',DEFAULT_MUSIC_VOLUME);setVolume('sfxVolume',DEFAULT_SFX_VOLUME);}
  if(action==='guide-back'){if(guideReturn==='paused'){mode='playing';pause();}else title();}
});
$('pauseButton').addEventListener('click',pause);
$('soundButton').addEventListener('click',toggleSound);
$('overlay').addEventListener('input',event=>{
  if(event.target.id==='musicVolume'||event.target.id==='sfxVolume'){setVolume(event.target.id,volumeFromPercent(event.target.value,saved[event.target.id+'Ceiling']));audio.unlock();}
});
$('game').addEventListener('pointerdown',event=>{
  if(mode!=='playing'||event.button!==0||event.target.closest('button:not(#duckButton)'))return;
  event.preventDefault();audio.unlock();holds.add(event.pointerId);model.setHolding(true);
  try{$('game').setPointerCapture(event.pointerId);}catch{/* The pointer may have been cancelled by the browser. */}
});
function pointerEnd(event){holds.delete(event.pointerId);if(!holds.size)model.setHolding(false);}
$('game').addEventListener('pointerup',pointerEnd);$('game').addEventListener('pointercancel',pointerEnd);$('game').addEventListener('lostpointercapture',pointerEnd);
$('game').addEventListener('contextmenu',event=>event.preventDefault());
window.addEventListener('keydown',event=>{
  if(event.code==='KeyP'||event.code==='Escape'){if(event.repeat)return;if(mode==='playing'){event.preventDefault();pause();}else if(mode==='paused'){event.preventDefault();resume();}else if(mode==='settings'){event.preventDefault();closeSettings();}return;}
  if(mode==='playing'&&(event.code==='Space'||event.code==='ArrowDown')){event.preventDefault();if(!event.repeat){audio.unlock();holds.add(event.code);model.setHolding(true);}}
});
window.addEventListener('keyup',event=>{if(event.code==='Space'||event.code==='ArrowDown'){holds.delete(event.code);if(!holds.size)model.setHolding(false);}});
window.addEventListener('blur',()=>{releaseAll();if(mode==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseAll();if(mode==='playing')pause();}});

function frame(now){
  const dt=Math.min((now-lastTime)/1000||0,0.05);lastTime=now;
  let events=[];
  if(mode==='playing'){model.update(dt);events=model.drainEvents();processEvents(events);}
  if(mode==='title')model.state.exposure=.91+Math.sin(now/1600)*.09;
  if(mode!=='paused')scene.render(model.state,dt,events,mode==='title');
  if(mode==='playing'||mode==='ending')updateHUD();
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('visible');}
  if(flashTimer>0){flashTimer-=dt;if(flashTimer<=0)$('hitFlash').classList.remove('active');}
  if(resultTimer>=0){resultTimer-=dt;if(resultTimer<0)result();}
  requestAnimationFrame(frame);
}
try{
  scene=new GameScene($('scene'));
  scene.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();$('errorText').textContent='The 3D view was interrupted. Reload to get back to the keep. Your unlocked sieges are saved.';$('bootError').hidden=false;});
  updateSound();title();requestAnimationFrame(frame);
}catch(error){console.error(error);$('errorText').textContent='The 3D view could not start. Try a recent Chrome, Edge, Firefox, or Safari with hardware acceleration enabled.';$('bootError').hidden=false;}
