import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MUSIC_VOLUME, DEFAULT_SFX_VOLUME } from '../src/audio.js';
import { volumeCeiling, volumePercent, volumeFromPercent } from '../src/volume-ui.js';

test('100% represents the existing mix and 50% is half that loudness',()=>{
  for(const real of [DEFAULT_MUSIC_VOLUME,DEFAULT_SFX_VOLUME]){
    assert.equal(volumePercent(real,real),100);
    assert.equal(volumeFromPercent(100,real),real);
    assert.equal(volumeFromPercent(50,real),real/2);
    assert.equal(volumeFromPercent(0,real),0);
  }
});
test('legacy saved loudness is preserved and its UI ceiling remains stable after lowering it',()=>{
  for(const [real,normal] of [[.21,.08],[1,.8],[0,.08],[.04,.08]]){
    const ceiling=volumeCeiling(real,undefined,normal);
    assert.ok(ceiling>=real);
    assert.ok(volumePercent(real,ceiling)<=100);
    assert.equal(volumeCeiling(real/2,ceiling,normal),ceiling);
    assert.ok(Math.abs(volumeFromPercent(50,ceiling)-ceiling/2)<1e-12);
  }
});
