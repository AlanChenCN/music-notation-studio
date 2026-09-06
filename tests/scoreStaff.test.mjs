import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ScoreStaff from '../src/score/ScoreStaff.tsx'
const score = { version:1, title:'test', tempo:90, timeSignature:[4,4], events:[{id:'a',startBeat:0,duration:1,pitches:[60]}] }
const props = { score, selected:'a', beat:0, playing:false, previewPitches:[], previewDuration:1, insertionIndex:0, onSelect:()=>{}, onEnd:()=>{} }
test('live pitches use the same staff height as target notes, with distinguishable hollow glyphs', () => {
  const markup=renderToStaticMarkup(createElement(ScoreStaff,{...props,readOnly:true,livePitches:[21,60,61,108]}))
  assert.match(markup,/实奏音符：A0、C4、C#4、C8/)
  const live=markup.split('class="score-live-notes"')[1]
  assert.match(live,/fill="none"/)
  const targetY=markup.match(/<ellipse[^>]*cy="([^"]+)"/)[1]
  const liveY=live.match(/data-live-pitch="60"[\s\S]*?<ellipse[^>]*cy="([^"]+)"/)[1]
  assert.equal(liveY,targetY)
  assert.doesNotMatch(markup,/在末尾继续写入/)
})
test('left-follow layout aligns targets to event onset while the editor keeps centered notation', () => {
  const editor=renderToStaticMarkup(createElement(ScoreStaff,props))
  const trainer=renderToStaticMarkup(createElement(ScoreStaff,{...props,followLeft:true,readOnly:true}))
  const cursorX=trainer.match(/class="score-playback-cursor" x1="([^"]+)"/)[1]
  assert.equal(trainer.match(/<ellipse cx="([^"]+)"/)[1],cursorX)
  assert.notEqual(editor.match(/<ellipse cx="([^"]+)"/)[1],cursorX)
  assert.match(trainer,/padding-left:20%;padding-right:80%/)
  assert.match(editor,/score-edit-cursor/)
  assert.doesNotMatch(trainer,/score-edit-cursor/)
})
