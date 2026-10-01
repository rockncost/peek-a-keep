import * as THREE from '../vendor/three.module.min.js';
import { CASTLE_COLORS, approachX } from './content.js';

const PALETTE = { grass:0x8bab60, grassSide:0x68864e, earth:0xa78a62, path:0xd9ad79, stone:0xffe4af, stoneLight:0xffefd0, stoneDark:0xd3b987, blue:0x428cae, wood:0x946441, metal:0x475157, red:0xd76a4d, gold:0xffd369 };
const clamp = THREE.MathUtils.clamp;
const Z = progress => -16.5 + progress * 22.3;

export class GameScene {
  constructor(container) {
    this.container=container; this.clock=0; this.shake=0;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(pointer: coarse)').matches?1.5:2));
    this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.localClippingEnabled=true;
    this.renderer.setClearColor(0x779c71); this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene(); this.scene.fog=new THREE.Fog(0x779c71,48,85);
    this.camera=new THREE.OrthographicCamera(-9,9,16,-16,.1,110);
    this.camera.position.set(5.5,24,28); this.camera.lookAt(0,0,-3.3);
    this.baseCamera=this.camera.position.clone();
    this.scene.add(new THREE.HemisphereLight(0xfff8dc,0x6e8f70,1.8));
    const light=new THREE.DirectionalLight(0xfff0ca,2.4);light.position.set(-10,24,8);light.castShadow=true;
    const shadowSize=matchMedia('(pointer: coarse)').matches?1024:2048;
    light.shadow.mapSize.set(shadowSize,shadowSize);light.shadow.camera.left=-22;light.shadow.camera.right=22;light.shadow.camera.top=25;light.shadow.camera.bottom=-22;light.shadow.normalBias=.035;light.shadow.bias=-.0003;
    light.target.position.set(0,0,-4);this.scene.add(light,light.target);
    this.materials=new Map();this.boxGeo=new THREE.BoxGeometry(1,1,1);this.sphereGeo=new THREE.IcosahedronGeometry(1,1);
    this.particles=[];this.damageNumbers=[];this.numberTextures=new Map();this.enemyMeshes=new Map();this.ballMeshes=new Map();this.arrowMeshes=new Map();this.flags=[];
    this.buildTerrain();this.buildRegions();this.buildCastle();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();
  }
  mat(color,castle=false,extra={}) {
    const key=`${color}-${castle}-${JSON.stringify(extra)}`;
    if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.92,metalness:0,...(castle?{clippingPlanes:[new THREE.Plane(new THREE.Vector3(0,1,0),-.04)],clipShadows:true}:{}),...extra}));
    return this.materials.get(key);
  }
  box(parent,x,y,z,w,h,d,color,castle=false){
    const m=new THREE.Mesh(this.boxGeo,this.mat(color,castle));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  sphere(parent,x,y,z,r,color,castle=false){const m=new THREE.Mesh(this.sphereGeo,this.mat(color,castle));m.position.set(x,y,z);m.scale.setScalar(r);m.castShadow=true;parent.add(m);return m;}
  cylinder(parent,x,y,z,r,h,color,vertices=10,castle=false){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,vertices),this.mat(color,castle));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  flag(parent,x,y,z,color,castle=false){
    this.cylinder(parent,x,y+.46,z,.035,1,color===PALETTE.red?0x6b5140:0x9b835a,6,castle);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.64,-.13,0,0,-.34,0],3));geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,this.mat(color,castle,{side:THREE.DoubleSide}));m.position.set(x,y+.93,z);parent.add(m);this.flags.push(m);return m;
  }
  buildTerrain(){
    const terrain=new THREE.Group();this.scene.add(terrain);
    this.box(terrain,0,-.72,-5,14,1.25,37,PALETTE.earth);
    this.box(terrain,0,-.1,-5,14,.28,37,PALETTE.grass);
    this.box(terrain,0,.055,-5,5.3,.09,37,PALETTE.path);
    for(let i=0;i<37;i++){
      const z=-22.5+i;const offset=Math.sin(i*5.7)*.16;
      for(const side of[-1,1])this.box(terrain,side*(2.7+offset),.1,z,.23,.1,.6,PALETTE.path);
    }
    let seed=39;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<60;i++){
      const side=i%2?1:-1,x=side*(3.1+rand()*3.1),z=-22+rand()*33;
      if(i%4===0){
        const tree=new THREE.Group();tree.position.set(x,0,z);terrain.add(tree);
        const height=1.1+rand()*.8;this.box(tree,0,height*.45,0,.19,height,.19,0x94724b);
        const canopy=this.box(tree,0,height+.35,0,.9+rand()*.25,1.1,.9,[0x739c54,0x719647,0x94b95d][i%3]);canopy.rotation.y=rand()*.5;
        this.box(tree,.13,height+.94,.07,.65,.3,.7,0xa2c571);
      }else if(i%5===0){const rock=this.sphere(terrain,x,.19,z,.2+rand()*.2,0xc9c5a0);rock.scale.y*=.7;}
      else {const clump=this.box(terrain,x,.09,z,.13,.18,.15,0x77944e);clump.rotation.y=rand();}
    }
    for(const side of[-1,1])for(let i=0;i<7;i++){
      const z=-15+i*3;this.box(terrain,side*4,.35,z,.14,.7,.16,0xab8e5d);
      if(i<6)this.box(terrain,side*4,.42,z+1.5,.1,.13,2.9,0xbc9c68);
    }
    // A few flat road stones make distance and enemy motion easy to judge.
    for(let i=0;i<17;i++)this.box(terrain,Math.sin(i*17)*2,.117,-19+i*1.65,.18,.012,.12,0xe7c695);
    this.box(terrain,0,.13,6.1,4.7,.13,4.45,0x53604b);
    this.box(terrain,0,.205,6.1,4.02,.02,3.9,0x273c35);
    for(const side of[-1,1]){
      this.box(terrain,side*2.2,.28,6.1,.34,.3,4.45,PALETTE.stoneDark);
      this.box(terrain,0,.28,6.1+side*2.05,4.7,.3,.35,PALETTE.stoneDark);
    }
    for(let i=0;i<7;i++)this.box(terrain,-1.98+i*.66,.45,8.16,.59,.1,.38,PALETTE.stone);
    this.aura=new THREE.Mesh(new THREE.RingGeometry(2.8,2.86,60),new THREE.MeshBasicMaterial({color:0xffda70,transparent:true,opacity:0,side:THREE.DoubleSide}));this.aura.rotation.x=-Math.PI/2;this.aura.position.set(0,.17,6.1);this.scene.add(this.aura);
  }
  crenellations(parent,x,y,z,w,d,castle=true){
    this.box(parent,x,y-.12,z,w+.13,.21,d+.13,PALETTE.stoneLight,castle);
    const n=Math.max(3,Math.round(w/.39));for(let i=0;i<n;i++)for(const side of[-1,1])this.box(parent,x-w/2+i*w/(n-1),y+.13,z+side*d/2,.24,.32,.24,PALETTE.stone,castle);
    if(d>.8)for(const side of[-1,1])this.box(parent,x+side*w/2,y+.13,z,.24,.32,.24,PALETTE.stone,castle);
  }
  buildRegions(){
    this.regions={};
    for(const id of ['river','mountain','courtyard']){const g=new THREE.Group();this.scene.add(g);g.visible=false;this.regions[id]=g;}
    const river=this.regions.river;
    this.box(river,0,.13,-6.13,13.9,.08,3.3,0x65a8b0);
    for(let i=0;i<12;i++)this.box(river,0,.23,-7.65+i*.28,1.65,.15,.24,0xb68a58);
    for(const side of [-1,1]){
      this.box(river,side*.86,.5,-6.12,.1,.1,3.6,0x846342);
      for(let i=0;i<4;i++)this.box(river,side*.86,.37,-7.7+i*1.05,.13,.7,.13,0x846342);
    }
    for(let i=0;i<15;i++)this.box(river,Math.sin(i*2)*5,.19,-7.5+(i%5)*.6,.65,.01,.045,0xafd8cf);
    const mountain=this.regions.mountain;
    this.box(mountain,0,.12,-6.3,5.3,.08,23,0x8b9581);
    for(let i=0;i<48;i++){
      const p=i/48,x=approachX(0,p,'mountain');this.box(mountain,x,.19,Z(p),3.55,.11,.62,0xd0b994);
      if(i%4===0)for(const side of[-1,1]){const rock=this.sphere(mountain,side*(3.7+(i%3)*.4),.8,Z(p),1.2+(i%5)*.13,0x89927e);rock.scale.y=1.5;}
    }
    const court=this.regions.courtyard;
    for(let z=-19;z<4;z+=1.3)for(let x=-3;x<=3;x+=1.3)this.box(court,x,.15,z,1.23,.13,1.23,((Math.round(z/1.3)+Math.round(x/1.3))%2)?0xd4c7a7:0xc1b99c);
    for(const side of[-1,1])for(let i=0;i<6;i++){
      this.cylinder(court,side*3.7,.8,-17+i*3.3,.22,1.5,0xded7bd);
      this.box(court,side*3.7,1.62,-17+i*3.3,.63,.22,.63,0xf0dfb9);
      this.box(court,side*1.95,.25,-17+i*3.3,.08,.05,.7,0xa97a68);
    }
  }
  buildCastle(){
    this.castle=new THREE.Group();this.castle.position.set(0,0,6.1);this.scene.add(this.castle);
    this.box(this.castle,0,.96,.55,3.4,1.65,1.72,PALETTE.stone,true);
    this.box(this.castle,0,1.73,-.25,1.9,3.15,1.8,PALETTE.stone,true);
    this.box(this.castle,0,.21,.1,3.7,.23,3.2,PALETTE.stoneDark,true);
    this.crenellations(this.castle,0,3.4,-.25,1.9,1.8);
    for(const side of[-1,1]){
      this.box(this.castle,side*1.47,1.22,.75,.91,2.25,1.1,PALETTE.stone,true);
      this.crenellations(this.castle,side*1.47,2.46,.75,.91,1.1);
      this.box(this.castle,side*1.47,1.6,1.31,.26,.73,.025,PALETTE.blue,true);
      this.box(this.castle,side*.48,2.62,.658,.17,.42,.025,0x685f4d,true);
      this.flag(this.castle,side*1.47,2.49,.73,PALETTE.blue,true);
    }
    this.box(this.castle,0,.79,1.421,.66,1.15,.04,0x675640,true);
    const arch=this.cylinder(this.castle,0,1.35,1.437,.33,.04,0x675640,12,true);arch.rotation.x=Math.PI/2;
    for(let i=0;i<3;i++)this.box(this.castle,-.21+i*.21,.8,1.457,.035,1.04,.025,0x4c4538,true);
    this.box(this.castle,0,.92,1.47,.62,.05,.03,0xb39259,true);
    this.gateBrace=new THREE.Group();this.castle.add(this.gateBrace);
    for(const y of [.48,.95,1.3])this.box(this.gateBrace,0,y,1.52,.74,.1,.08,0xb7d3c0,true);
    this.counterweight=new THREE.Group();this.castle.add(this.counterweight);
    const pulley=this.cylinder(this.counterweight,1.03,2.95,-.3,.27,.16,0xc49d58,10,true);pulley.rotation.z=Math.PI/2;
    this.box(this.counterweight,1.14,2.13,-.3,.035,1.5,.035,0x675640,true);
    this.box(this.counterweight,1.14,1.55,-.3,.37,.5,.36,0x697a70,true);
    this.box(this.castle,0,2.16,.68,.53,.67,.045,PALETTE.blue,true);
    this.box(this.castle,0,2.21,.71,.15,.27,.02,0xffdc79,true);
    this.flag(this.castle,0,3.5,-.49,PALETTE.blue,true);
    // Simple masonry accents; deliberately no textures or downloaded art.
    for(let i=0;i<9;i++)this.box(this.castle,(i%3-1)*.58,.5+Math.floor(i/3)*.53,1.426,.22,.10,.023,PALETTE.stoneLight,true);
    this.archers=[];
    for(const side of[-1,1]){
      const archer=new THREE.Group();archer.position.set(side*.57,3.5,-.14);this.castle.add(archer);
      this.cylinder(archer,0,.2,0,.13,.4,PALETTE.blue,8,true);this.sphere(archer,0,.54,0,.17,0xffdca3,true);
      const cap=this.sphere(archer,0,.63,.02,.175,0xeee8d5,true);cap.scale.y*=.55;
      const bow=new THREE.Mesh(new THREE.TorusGeometry(.21,.025,4,14,Math.PI),this.mat(0x91683e,true));bow.rotation.z=Math.PI/2;bow.position.set(side*.15,.32,-.12);archer.add(bow);this.archers.push(archer);
    }
  }
  createEnemy(type){
    const group=new THREE.Group();this.scene.add(group);
    const ram=type==='ram',double=type==='double',armored=type==='armored',volley=type==='volley',ballista=type==='ballista';
    const accent=type==='support'?0x68a374:type==='boss'?0x966377:type==='mortar'?0xdba04d:ram?0xaa7050:armored?0x9777ba:volley?0xd45976:ballista?0x3dada8:double?0xe39e4b:PALETTE.red;
    this.box(group,0,.45,0,1.05,.19,1.35,PALETTE.wood);
    for(const side of[-1,1])for(const front of[-1,1]){
      const wheel=this.cylinder(group,side*.59,.29,front*.43,.28,.15,0x635244,10);wheel.rotation.z=Math.PI/2;
      const hub=this.cylinder(group,side*.68,.29,front*.43,.085,.03,0xd8bb82,8);hub.rotation.z=Math.PI/2;
    }
    let weakPoint=null,armor=null;
    if(type==='boss'){
      this.box(group,0,1.3,0,2.35,2,2.6,0x727b7b);
      this.crenellations(group,0,2.45,0,2.3,2.5,false);
      for(const side of[-1,1]){
        this.box(group,side*1.03,1.8,.35,.5,2.1,.85,0xab9e89);
        const gun=this.cylinder(group,side*.68,1.48,1.5,.25,.7,0x3d494b);gun.rotation.x=Math.PI/2;
        for(let i=0;i<3;i++){const wheel=this.cylinder(group,side*1.2,.38,-.9+i*.9,.43,.2,0x4c4f47);wheel.rotation.z=Math.PI/2;}
      }
      armor=this.box(group,0,1.65,1.33,.8,.85,.09,0x53636a);
      weakPoint=this.box(group,0,1.65,1.4,.62,.64,.06,0xffce67);weakPoint.material=new THREE.MeshBasicMaterial({color:0xffce67});
    }else if(type==='support'){
      this.box(group,0,.83,0,1.1,.63,1.4,0x779975);
      for(const x of [-.26,.26])this.box(group,x,1.3,-.2,.43,.35,.5,0xb79561);
      this.box(group,0,.95,.72,.57,.13,.04,0xe2f0d1);this.box(group,0,.95,.74,.13,.52,.04,0xe2f0d1);
    }else if(type==='mortar'){
      const tube=this.cylinder(group,0,1.05,0,.37,.95,0x455354);tube.rotation.x=.6;
      const mouth=this.cylinder(group,0,1.45,.26,.27,.04,0x243335);mouth.rotation.x=.6;
      this.box(group,0,.66,0,.83,.22,.84,accent);
    }else if(ram){
      // Thick beams and iron roof visibly explain the ram's much larger health pool.
      this.box(group,0,1.19,0,1.3,.3,1.65,0x767b6c);
      for(const side of[-1,1]){
        this.box(group,side*.46,.81,0,.17,.9,1.25,PALETTE.wood);
        this.box(group,side*.42,1.36,0,.1,.055,1.65,0xc4b98c);
      }
      const log=this.cylinder(group,0,.76,.36,.27,1.9,0xb1976b,8);log.rotation.x=Math.PI/2;
      const nose=this.cylinder(group,0,.76,1.24,.31,.25,PALETTE.metal,8);nose.rotation.x=Math.PI/2;
    }else if(ballista){
      this.box(group,0,.9,.1,.18,.18,1.6,0xb98b51);
      for(const side of[-1,1]){
        const arm=this.box(group,side*.35,.93,.48,.79,.12,.15,0x8a613d);arm.rotation.y=side*.33;
        const string=this.box(group,side*.30,.95,.22,.71,.027,.027,0xffebc2);string.rotation.y=side*-.5;
      }
      this.box(group,0,1.04,.5,.065,.065,1.45,0xe8dcc0);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(.14,.31,4),this.mat(0x5d857e));tip.rotation.x=Math.PI/2;tip.position.set(0,1.04,1.25);group.add(tip);
      this.box(group,0,.68,-.2,.55,.33,.5,0x688f80);
    }else{
      const radius=volley?.15:double?.2:armored?.36:.29;
      for(const x of(volley?[-.33,0,.33]:double?[-.23,.23]:[0])){
        const y=volley&&x===0?1.02:.84;
        const gun=this.cylinder(group,x,y,.19,radius,armored?1.3:1.11,PALETTE.metal,10);gun.rotation.x=Math.PI/2-.14;
        const mouth=this.cylinder(group,x,y+.08,armored?.86:.77,radius*.74,.026,0x252f30,10);mouth.rotation.x=Math.PI/2-.14;
        const band=this.cylinder(group,x,y+.01,.3,radius+.023,.11,armored?0xb7a0c9:0x73817a,10);band.rotation.x=Math.PI/2-.14;
      }
      this.box(group,0,.6,-.2,.7,.25,.6,0xb58d58);
      if(armored){
        for(const side of[-1,1]){
          this.box(group,side*.5,.79,0,.13,.65,1.5,0x697179);
          this.box(group,side*.575,.8,.25,.035,.25,.3,accent);
        }
        this.box(group,0,.58,.7,1.06,.31,.13,0x727b83);
      }
      if(volley)this.box(group,0,.59,.3,1.13,.18,.7,accent);
    }
    const flag=this.flag(group,type==='boss'?.9:.48,type==='boss'?2.6:type==='support'?1.5:ram?1.4:1,-.4,accent);
    const spark=this.sphere(group,-.27,1.2,-.35,.11,0xffd870);spark.material=new THREE.MeshBasicMaterial({color:0xffda6c});spark.visible=false;
    const halo=new THREE.Mesh(new THREE.RingGeometry(.79,.84,32),new THREE.MeshBasicMaterial({color:0xffe4a5,side:THREE.DoubleSide,transparent:true,opacity:.0}));halo.rotation.x=-Math.PI/2;halo.position.y=.19;group.add(halo);
    const healthY=type==='boss'?3.95:type==='support'?2.7:ram?2.46:2.09;
    this.box(group,0,healthY,0,1.17,.1,.08,0x253f33);
    const hp=this.box(group,-.01,healthY,.045,1.13,.09,.025,0xffe8a6);hp.material=new THREE.MeshBasicMaterial({color:0xffe8a6});
    group.userData={spark,halo,hp,flag,accent,hitUntil:0,weakPoint,armor};return group;
  }
  sync(map,items,create,update){
    const ids=new Set(items.map(i=>i.id));for(const[id,mesh]of map)if(!ids.has(id)){
      this.scene.remove(mesh);
      if(mesh.userData.flag)this.flags=this.flags.filter(f=>f!==mesh.userData.flag);
      const cached=new Set(this.materials.values());
      mesh.traverse(child=>{
        if(child.geometry&&child.geometry!==this.boxGeo&&child.geometry!==this.sphereGeo)child.geometry.dispose();
        if(child.material&&!cached.has(child.material))child.material.dispose();
      });
      map.delete(id);
    }
    for(const item of items){let mesh=map.get(item.id);if(!mesh){mesh=create(item);map.set(item.id,mesh);}update(mesh,item);}
  }
  burst(x,y,z,color,count=12){
    for(let i=0;i<count;i++){
      const m=new THREE.Mesh(this.boxGeo,this.mat(color));m.scale.setScalar(.07+Math.random()*.1);m.position.set(x,y,z);this.scene.add(m);
      this.particles.push({mesh:m,life:.45+Math.random()*.5,velocity:new THREE.Vector3((Math.random()-.5)*4,1+Math.random()*3,(Math.random()-.5)*4)});
    }
  }
  damageNumber(event){
    const key=`${event.damage}-${event.powered}`;
    if(!this.numberTextures.has(key)){
      const canvas=document.createElement('canvas');canvas.width=128;canvas.height=96;
      const ctx=canvas.getContext('2d');ctx.font='900 58px Trebuchet MS, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.lineWidth=9;ctx.strokeStyle='#263f38';ctx.strokeText(`−${event.damage}`,64,48);ctx.fillStyle=event.powered?'#9ff4ff':'#fff4c9';ctx.fillText(`−${event.damage}`,64,48);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;this.numberTextures.set(key,texture);
    }
    const material=new THREE.SpriteMaterial({map:this.numberTextures.get(key),depthTest:false,transparent:true});
    const sprite=new THREE.Sprite(material);sprite.position.set(approachX(event.lane,event.progress,this.terrain),2.65,Z(event.progress));sprite.scale.set(1.35,1.01,1);sprite.renderOrder=10;this.scene.add(sprite);
    this.damageNumbers.push({sprite,life:.65});
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;this.renderer.setSize(w,h,false);const viewH=32;this.camera.left=-viewH*w/h/2;this.camera.right=viewH*w/h/2;this.camera.top=viewH/2;this.camera.bottom=-viewH/2;this.camera.updateProjectionMatrix();}
  render(state,dt,events=[],menu=false){
    this.clock+=dt;
    this.terrain=state.terrain;
    for(const [id,group] of Object.entries(this.regions))group.visible=state.terrain===id;
    this.mat(PALETTE.blue,true).color.setHex(CASTLE_COLORS[state.cosmetic]?.color||PALETTE.blue);
    this.mat(PALETTE.blue,true,{side:THREE.DoubleSide}).color.setHex(CASTLE_COLORS[state.cosmetic]?.color||PALETTE.blue);
    const X=(lane,p)=>approachX(lane,p,state.terrain);
    const target=-3.95*(1-state.exposure);this.castle.position.y=target;
    this.gateBrace.visible=state.upgrade==='gate'&&state.gateShield>0;
    this.counterweight.visible=state.upgrade==='counterweight';
    this.archers.forEach(a=>a.scale.setScalar(state.upgrade==='archers'?1.15:1));
    this.castle.rotation.z=state.exposure>.02&&state.exposure<.97?Math.sin(this.clock*45)*.012:0;
    this.aura.material.opacity=state.power?.65+Math.sin(this.clock*6)*.2:0;this.aura.scale.setScalar(1+Math.sin(this.clock*3)*.025);
    this.flags.forEach((f,i)=>{f.rotation.y=Math.sin(this.clock*4+i)*.13;f.rotation.x=Math.sin(this.clock*3+i)*.035;});
    for(const archer of this.archers)archer.rotation.x=Math.sin(this.clock*4)*.035;
    this.sync(this.enemyMeshes,state.enemies,e=>this.createEnemy(e.type),(mesh,e)=>{
      mesh.position.set(X(e.lane,e.progress),.1+Math.sin(this.clock*12+e.id)*.015,Z(e.progress));
      if(e.type==='boss'){mesh.userData.weakPoint.visible=e.bossPhase!=='salvo';mesh.userData.armor.visible=e.bossPhase==='salvo';mesh.userData.flag.material.color.setHex(e.enraged?0xd65f48:mesh.userData.accent);}
      if(e.type==='support')mesh.userData.flag.scale.setScalar(e.exposedUntil>state.time?1.3:1);
      mesh.userData.spark.visible=e.warning>.02;mesh.userData.spark.scale.setScalar(.7+e.warning*(.5+Math.sin(this.clock*35)*.3));
      mesh.userData.halo.material.opacity=e.warning*.75;mesh.userData.halo.scale.setScalar(1+e.warning*.18);
      mesh.userData.hp.scale.x=1.13*Math.max(0,e.hp/e.maxHp);mesh.userData.hp.position.x=-.565+mesh.userData.hp.scale.x/2;
      mesh.userData.hp.material.color.setHex(this.clock<mesh.userData.hitUntil?0xffffff:0xffe8a6);
    });
    this.sync(this.ballMeshes,state.projectiles,p=>{
      const g=new THREE.Group();
      if(p.type==='ballista'){
        this.box(g,0,0,0,.13,.13,.95,0x3f776d);
        const tip=new THREE.Mesh(new THREE.ConeGeometry(.19,.35,4),this.mat(0xffc392));tip.rotation.x=Math.PI/2;tip.position.z=.52;g.add(tip);
      }else{
        const b=this.sphere(g,0,0,0,p.type==='armored'?.3:.23,0x374646);b.material=this.mat(0x374646,false,{roughness:.5});
      }
      const trail=this.sphere(g,0,0,-.3,.15,p.type==='volley'?0xffa4ad:0xffd48b);trail.scale.z=.45;g.userData.trail=trail;this.scene.add(g);
      if(p.type==='mortar'){
        const shadow=new THREE.Mesh(new THREE.RingGeometry(.4,.57,24),new THREE.MeshBasicMaterial({color:0xffd481,transparent:true,opacity:.7,side:THREE.DoubleSide,depthTest:false}));shadow.rotation.x=-Math.PI/2;g.add(shadow);g.userData.shadow=shadow;
      }
      return g;
    },(m,p)=>{const height=1.15+Math.sin(p.progress*Math.PI)*(p.type==='mortar'?4.3:p.type==='ballista'?.65:1.4);m.position.set(X(p.lane,p.from)*(1-p.progress*.8),height,Z(p.from)+(6.3-Z(p.from))*p.progress);if(p.type!=='ballista'&&p.type!=='mortar')m.rotation.z+=dt*3;m.userData.trail.visible=true;if(m.userData.shadow){m.userData.shadow.position.set(-m.position.x,.23-height,6.3-m.position.z);m.userData.shadow.scale.setScalar(1.6-p.progress*.65);m.userData.shadow.material.opacity=.3+p.progress*.6;}});
    this.sync(this.arrowMeshes,state.arrows,a=>{
      const g=new THREE.Group(),color=a.powered?0x9df3ff:0xffefbb;
      const shaft=this.box(g,0,0,0,a.powered?.18:.12,a.powered?.18:.12,1.2,color);shaft.material=new THREE.MeshBasicMaterial({color});
      const head=new THREE.Mesh(new THREE.ConeGeometry(a.powered?.24:.18,.43,4),new THREE.MeshBasicMaterial({color:a.powered?0x56d7ed:0xc98339}));head.rotation.x=-Math.PI/2;head.position.z=-.67;g.add(head);
      const trail=this.box(g,0,0,.8,a.powered?.23:.16,a.powered?.23:.16,.65,color);trail.material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.45});
      this.scene.add(g);return g;
    },(m,a)=>{const x=X(a.lane,a.targetProgress);m.position.set(x*a.progress,3.35+(1.25-3.35)*a.progress,5.7+(Z(a.targetProgress)-5.7)*a.progress);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),new THREE.Vector3(x,-2.1,Z(a.targetProgress)-5.7).normalize());});
    for(const e of events){
      if(e.type==='enemyHit'){
        this.damageNumber(e);this.burst(X(e.lane,e.progress),1.1,Z(e.progress),e.powered?0x91efff:0xffe8ad,4);
        const target=this.enemyMeshes.get(e.enemyId);if(target)target.userData.hitUntil=this.clock+.14;
      }
      if(e.type==='kill')this.burst(X(e.lane,e.progress),e.enemyType==='boss'?2:.8,Z(e.progress),e.powered?0xffdc7e:0xba9561,e.enemyType==='boss'?45:15);
      if(e.type==='repair')this.burst(X(e.lane,e.progress),1.2,Z(e.progress),0x97e5a0,8);
      if(e.type==='armorBlock')this.burst(X(e.lane,e.progress),1.6,Z(e.progress),0xa5bac3,4);
      if(e.type==='hit'){this.shake=.2;this.burst(0,2,6,0xffbc93,16);}
      if(e.type==='gateBlock'){this.shake=.1;this.burst(0,1,6,0xb7e3c2,22);}
      if(e.type==='duck')this.burst(0,.5,6,0xe4d0a0,9);
      if(e.type==='perfect')this.burst(0,.8,6,0xffdc73,16);
      if(e.type==='win')for(let i=0;i<8;i++)this.burst((i-3.5)*1.1,5+Math.random()*3,2+Math.random()*6,[0xffd673,0x9bc9cf,0xffb98d][i%3],7);
    }
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;if(p.life<=0){this.scene.remove(p.mesh);this.particles.splice(i,1);continue;}p.velocity.y-=7*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*4;p.mesh.rotation.z+=dt*3;p.mesh.scale.multiplyScalar(1-dt*.7);}
    for(let i=this.damageNumbers.length-1;i>=0;i--){const n=this.damageNumbers[i];n.life-=dt;if(n.life<=0){this.scene.remove(n.sprite);n.sprite.material.dispose();this.damageNumbers.splice(i,1);continue;}n.sprite.position.y+=dt*1.3;n.sprite.material.opacity=Math.min(1,n.life*3);}
    this.shake=Math.max(0,this.shake-dt);this.camera.position.copy(this.baseCamera);if(this.shake>0&&!matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;}
    this.renderer.render(this.scene,this.camera);
  }
}
