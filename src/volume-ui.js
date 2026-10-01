import { validVolume } from './audio.js';

// Percentages describe the game's chosen mix, rather than raw browser gain.
// A louder legacy preference keeps its own ceiling, so migration never turns it down.
export function volumeCeiling(value, previousCeiling, defaultVolume){
  return Math.max(defaultVolume,validVolume(value,defaultVolume),validVolume(previousCeiling,defaultVolume));
}
export function volumePercent(value,ceiling){
  return Math.round(validVolume(value,0)/ceiling*100);
}
export function volumeFromPercent(percent,ceiling){
  return validVolume(Number(percent)/100,0)*ceiling;
}
