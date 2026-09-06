import test from 'node:test'
import assert from 'node:assert/strict'
import { generateRandomScore, defaultRandomScoreSettings as defaults, randomPresets } from '../src/practice/randomScore.ts'
import { parseScore, measureBeats, timeSignaturePresets, scoreLength } from '../src/score/scoreModel.ts'
import { midiNumberToPianoNote } from '../src/data/piano.ts'
import { ScorePractice } from '../src/practice/scorePractice.ts'
const rng = (seed=1) => () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/2**32 }
test('all supported meters fill exact bars with only selected durations and survive JSON validation', () => {
  for (const signature of timeSignaturePresets) for (const measures of [2,4,8,16]) {
    const settings={...defaults,timeSignature:[...signature],measures,durations:[.25,.5,1],rests:true}
    const score=generateRandomScore(settings,rng(), 'meter')
    assert.equal(scoreLength(score),measureBeats(signature)*measures)
    assert.deepEqual(parseScore(JSON.stringify(score)),score)
    for(const e of score.events){assert.ok(settings.durations.includes(e.duration)); assert.ok(e.startBeat % measureBeats(signature) + e.duration <= measureBeats(signature));}
    for(let bar=0;bar<measures;bar++) assert.ok(score.events.find(e=>e.startBeat === bar*measureBeats(signature)).pitches.length)
  }
})
test('note pools and ranges include extremes and can stay entirely above or below middle C', () => {
  for (const [lower,upper] of [[21,21],[108,108],[24,36],[73,85]]) {
    const score=generateRandomScore({...defaults,lower,upper,pool:'all'},rng())
    assert.ok(score.events.every(e=>e.pitches.every(p=>p>=lower && p<=upper)))
  }
  for(const pool of ['white','black']) {
    const score=generateRandomScore({...defaults,lower:21,upper:108,pool},rng())
    assert.ok(score.events.every(e=>e.pitches.every(p=>(midiNumberToPianoNote(p).type==='white')===(pool==='white'))))
  }
})
test('chromatic major and minor root-position chords honor every pitch boundary', () => {
  for(const [qualities, third] of [[['major'],4],[['minor'],3]]) {
    const score=generateRandomScore({...defaults,type:'chord',lower:61,upper:68,qualities},rng())
    assert.ok(score.events.every(e=>JSON.stringify(e.pitches)===JSON.stringify([61,61+third,68])))
  }
})
test('impossible settings fail explicitly without mutating the caller or introducing fallback notes', () => {
  for (const patch of [{durations:[]},{durations:[.3]},{lower:80,upper:60},{pool:'black',lower:60,upper:60},{type:'chord',lower:60,upper:65},{type:'chord',qualities:[]},{timeSignature:[3,4],durations:[2]},{timeSignature:[6,8],durations:[4]}]) {
    const config={...defaults,...patch}; const before=JSON.stringify(config)
    assert.throws(()=>generateRandomScore(config,rng())); assert.equal(JSON.stringify(config),before)
  }
})
test('presets are reproducible with a seeded generator and nearby motion favors short intervals', () => {
  for(const preset of randomPresets) assert.deepEqual(generateRandomScore(preset.settings,rng(42),'same'),generateRandomScore(preset.settings,rng(42),'same'))
  const notes=generateRandomScore({...defaults,lower:48,upper:84,motion:'near',measures:16,durations:[.5]},rng()).events.map(e=>e.pitches[0])
  const small=notes.slice(1).filter((p,i)=>Math.abs(p-notes[i])<=4).length
  assert.ok(small/(notes.length-1)>.7)
})
test('generated scores use the existing practice controller and keep independent source sessions', () => {
  let now=0; const random=new ScorePractice(()=>now); const editor=new ScorePractice(()=>now)
  const source=generateRandomScore({...defaults,lower:60,upper:60,measures:2},rng())
  random.load(source); editor.load(source); random.start(); random.press('key',60); random.release('key')
  assert.equal(random.getSnapshot().completed,1); assert.equal(editor.getSnapshot().completed,0)
  random.reset(); assert.deepEqual(random.getSnapshot().score,source)
  random.setMode('timeline'); random.start(); now=20000; random.tick(); assert.equal(random.getSnapshot().missed,source.events.length)
  const previous=random.getSnapshot().score; assert.throws(()=>generateRandomScore({...defaults,durations:[]},rng())); assert.equal(random.getSnapshot().score,previous)
})
