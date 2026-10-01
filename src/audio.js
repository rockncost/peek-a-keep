export const DEFAULT_MUSIC_VOLUME = .08;
export const DEFAULT_SFX_VOLUME = .8;
export function validVolume(value, fallback){
  return typeof value==='number'&&Number.isFinite(value)?Math.min(1,Math.max(0,value)):fallback;
}

export class GameAudio {
  constructor(){
    this.context=null;this._muted=false;this.unlocked=false;this.active=true;
    this.music=document.getElementById('backgroundMusic');
    this._musicVolume=DEFAULT_MUSIC_VOLUME;this._sfxVolume=DEFAULT_SFX_VOLUME;
    this.music.volume=this._musicVolume;
    document.addEventListener('visibilitychange',()=>this.syncMusic());
  }
  get muted(){return this._muted;}
  set muted(value){this._muted=!!value;this.music.muted=this._muted;this.syncSfx();this.syncMusic();}
  get musicVolume(){return this._musicVolume;}
  set musicVolume(value){this._musicVolume=validVolume(value,DEFAULT_MUSIC_VOLUME);this.music.volume=this._musicVolume;this.syncMusic();}
  get sfxVolume(){return this._sfxVolume;}
  set sfxVolume(value){this._sfxVolume=validVolume(value,DEFAULT_SFX_VOLUME);this.syncSfx();}
  syncSfx(){if(this.sfxBus)this.sfxBus.gain.setTargetAtTime(this.muted?0:this.sfxVolume,this.context.currentTime,.015);}
  setActive(value){this.active=!!value;this.syncMusic();}
  syncMusic(){
    if(this.unlocked&&this.active&&!this.muted&&this.musicVolume>0&&!document.hidden){
      if(this.music.paused)this.music.play().catch(()=>{});
    }else this.music.pause();
  }
  unlock(){
    this.unlocked=true;this.syncMusic();
    try{
      if(!this.context){
        this.context=new(window.AudioContext||window.webkitAudioContext)();
        this.sfxBus=this.context.createGain();
        const limiter=this.context.createDynamicsCompressor();
        limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.18;
        this.sfxBus.connect(limiter);limiter.connect(this.context.destination);this.syncSfx();
        this.noise=this.context.createBuffer(1,Math.ceil(this.context.sampleRate*1.2),this.context.sampleRate);
        const samples=this.noise.getChannelData(0);
        for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      }
      if(this.context.state==='suspended')this.context.resume().catch(()=>{});
    }catch{}
  }
  tone(frequency,duration=.1,type='sine',volume=.05,slide=frequency,delay=0){
    if(this.muted||this.sfxVolume===0||!this.sfxBus||this.context.state!=='running')return;
    const t=this.context.currentTime+delay,o=this.context.createOscillator(),g=this.context.createGain();
    o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t+duration);
    g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.sfxBus);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  noiseBurst(delay,duration,volume,filterType,frequency,endFrequency=frequency){
    if(this.muted||this.sfxVolume===0||!this.noise||this.context.state!=='running')return;
    const t=this.context.currentTime+delay,source=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),gain=this.context.createGain();
    source.buffer=this.noise;filter.type=filterType;filter.Q.value=.65;
    filter.frequency.setValueAtTime(frequency,t);filter.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);
    gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    source.connect(filter);filter.connect(gain);gain.connect(this.sfxBus);source.start(t);source.stop(t+duration+.01);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  cannonBlast(heavy=false){
    // Air rush, sharp ignition, then a dropping bass boom and smoky rumble.
    this.noiseBurst(0,.085,.12,'highpass',1000);
    this.noiseBurst(.065,.065,.2,'highpass',1800);
    this.noiseBurst(.07,heavy?.9:.72,.4,'lowpass',1100,80);
    this.tone(heavy?105:145,heavy?.85:.7,'sine',.38,heavy?32:42,.07);
    this.tone(85,.45,'triangle',.14,35,.075);
  }
  play(type,details={}){
    if(type==='shot')this.tone(750,.085,'triangle',.028,260);
    if(type==='enemyShot'){
      if(details.enemyType==='ballista'){this.noiseBurst(0,.12,.1,'highpass',1600);this.tone(280,.15,'triangle',.07,90);}
      else this.cannonBlast(details.enemyType==='armored');
    }
    if(type==='mortarWhistle')this.tone(1400,.75,'sine',.035,260);
    if(type==='repair'){this.tone(420,.2,'triangle',.03,630);}
    if(type==='armorBlock')this.tone(260,.08,'triangle',.025,170);
    if(type==='bossEnrage'){this.tone(90,.6,'sawtooth',.04,45);}
    if(type==='duck')this.tone(240,.16,'sine',.055,80);
    if(type==='rise')this.tone(120,.15,'sine',.04,310);
    if(type==='kill')this.tone(185,.14,'triangle',.05,70);
    if(type==='hit')this.tone(100,.26,'sawtooth',.038,33);
    if(type==='gateBlock'){this.tone(180,.22,'triangle',.07,90);this.tone(540,.3,'sine',.05,270);}
    if(type==='perfect'){this.tone(660,.18,'sine',.07,990);setTimeout(()=>this.tone(1320,.23,'sine',.06),85);}
    if(type==='win')[523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.tone(f,.35,'triangle',.07),i*110));
    if(type==='lose')[260,220,164].forEach((f,i)=>setTimeout(()=>this.tone(f,.3,'triangle',.055),i*170));
  }
}
