export const ENVIRONMENTS=Object.freeze({
  clear:{name:'Clear skies',color:0x779c71,near:48,far:85,warningThreshold:.02,hint:''},
  rain:{name:'Heavy rain',color:0x718b95,near:43,far:75,warningThreshold:.5,hint:'Heavy rain shortens glowing fuse warnings. Watch incoming shells.'},
  fog:{name:'Mountain fog',color:0xb0bbc1,near:31,far:51,warningThreshold:.02,hint:'Fog hides distant engines. Listen for wind-ups; incoming shells remain visible.'},
  dusk:{name:'Dusk',color:0x706b8e,near:46,far:78,warningThreshold:.02,hint:'Dusk falls. Golden fuses and landing rings mark incoming attacks.'},
});
export function environmentFor(level){return [6,12,16,18].includes(level)?'rain':[9,11,14,17].includes(level)?'fog':[10,13,15,19].includes(level)?'dusk':'clear';}
