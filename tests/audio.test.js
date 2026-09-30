import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio, DEFAULT_MUSIC_VOLUME, DEFAULT_SFX_VOLUME, validVolume } from '../src/audio.js';

test('music waits for interaction, follows mute and pause, and keeps its position', () => {
  const previousDocument=globalThis.document, previousWindow=globalThis.window;
  const listeners={};
  const music={paused:true,muted:false,currentTime:42,plays:0,
    play(){this.paused=false;this.plays++;return Promise.resolve();},pause(){this.paused=true;}};
  globalThis.document={hidden:false,getElementById:()=>music,addEventListener:(type,fn)=>listeners[type]=fn};
  globalThis.window={};
  try {
    const audio=new GameAudio();
    assert.equal(music.paused,true);assert.equal(music.plays,0);
    audio.unlock();assert.equal(music.paused,false);
    audio.muted=true;assert.equal(music.paused,true);assert.equal(music.muted,true);
    audio.muted=false;assert.equal(music.paused,false);
    audio.setActive(false);assert.equal(music.paused,true);
    audio.unlock();assert.equal(music.paused,true,'sound interaction must not resume a paused siege');
    audio.setActive(true);assert.equal(music.paused,false);
    document.hidden=true;listeners.visibilitychange();assert.equal(music.paused,true);
    document.hidden=false;listeners.visibilitychange();assert.equal(music.paused,false);
    assert.equal(music.currentTime,42,'mute and pause must not restart the track');
    assert.ok(music.volume>0&&music.volume<1);
  } finally {
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
    if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
  }
});

test('volume defaults are quiet and saved zero is respected; invalid values are sanitized',()=>{
  assert.equal(DEFAULT_MUSIC_VOLUME,.08);
  assert.equal(DEFAULT_SFX_VOLUME,.8);
  assert.equal(validVolume(0,DEFAULT_MUSIC_VOLUME),0);
  assert.equal(validVolume(2,.08),1);assert.equal(validVolume(-1,.08),0);
  for(const invalid of [undefined,null,'80',NaN,Infinity,{}])assert.equal(validVolume(invalid,.08),.08);
});

function audioFixture(run){
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  const music={paused:true,muted:false,currentTime:42,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};
  const param=()=>({value:0,events:[],setValueAtTime(value,time){this.events.push({value,time});},linearRampToValueAtTime(value,time){this.events.push({value,time});},exponentialRampToValueAtTime(value,time){this.events.push({value,time});},setTargetAtTime(value,time){this.events.push({value,time});}});
  const nodes=[];
  function node(kind){const n={kind,connections:[],gain:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(to){this.connections.push(to);},disconnect(){this.disconnected=true;},start(time){this.startTime=time;},stop(time){this.stopTime=time;}};nodes.push(n);return n;}
  class Context{
    constructor(){this.currentTime=10;this.state='running';this.sampleRate=48000;this.destination={};}
    createGain(){return node('gain');}createDynamicsCompressor(){return node('limiter');}
    createOscillator(){return node('oscillator');}createBufferSource(){return node('noise');}createBiquadFilter(){return node('filter');}
    createBuffer(channels,length){const samples=new Float32Array(length);return {getChannelData:()=>samples};}
  }
  globalThis.document={hidden:false,getElementById:()=>music,addEventListener(){}};
  globalThis.window={AudioContext:Context};
  try{const audio=new GameAudio();audio.unlock();run({audio,music,nodes});}
  finally{
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  }
}

test('music and effects volumes are independent, and master mute silences all active effects',()=>audioFixture(({audio,music,nodes})=>{
  audio.sfxVolume=.35;assert.equal(audio.sfxBus.gain.events.at(-1).value,.35);
  assert.equal(music.volume,.08);
  audio.musicVolume=0;assert.equal(music.paused,true);assert.equal(audio.sfxVolume,.35);
  audio.play('shot');assert.equal(nodes.filter(n=>n.kind==='oscillator').length,1);
  const voice=nodes.find(n=>n.kind==='oscillator');
  assert.equal(voice.connections[0].connections[0],audio.sfxBus,'an effect bypassed the SFX slider');
  audio.musicVolume=.21;assert.equal(music.volume,.21);
  audio.muted=true;assert.equal(audio.sfxBus.gain.events.at(-1).value,0);assert.equal(music.paused,true);
  const before=nodes.length;audio.play('enemyShot');assert.equal(nodes.length,before);
  audio.muted=false;assert.equal(audio.sfxBus.gain.events.at(-1).value,.35);assert.equal(music.paused,false);
  audio.sfxVolume=0;const silent=nodes.length;audio.play('enemyShot');assert.equal(nodes.length,silent);
  assert.equal(music.paused,false,'silent effects stopped the music');
}));

test('cannon blast has an air rush before the bass boom; ballistas retain a distinct sound',()=>audioFixture(({audio,nodes})=>{
  audio.play('enemyShot',{enemyType:'cannon'});
  const noise=nodes.filter(n=>n.kind==='noise'),tones=nodes.filter(n=>n.kind==='oscillator');
  assert.equal(noise.length,3);assert.equal(tones.length,2);
  assert.ok(noise[0].startTime<tones[0].startTime,'boom should follow the initial air rush');
  assert.ok(tones[0].frequency.events.at(-1).value<50,'bass tail is too high');
  assert.ok(tones[0].stopTime-tones[0].startTime>=.7,'blast lacks a rumbling tail');
  for(const source of [...noise,...tones]){
    assert.ok(source.stopTime>source.startTime);
    source.onended();assert.equal(source.disconnected,true);
    assert.equal(source.connections[0].disconnected,true);
  }
  const start=nodes.length;audio.play('enemyShot',{enemyType:'ballista'});
  assert.equal(nodes.slice(start).filter(n=>n.kind==='noise').length,1);
  assert.equal(nodes.slice(start).filter(n=>n.kind==='oscillator').length,1);
  const limiter=nodes.find(n=>n.kind==='limiter');
  assert.ok(limiter.ratio.value>=4,'overlapping cannons need a limiter');
}));
