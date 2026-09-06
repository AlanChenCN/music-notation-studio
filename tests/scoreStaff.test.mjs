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
test('left-follow keeps its playback anchor while both Trainer and Editor center notation in each slot', () => {
  const editor=renderToStaticMarkup(createElement(ScoreStaff,props))
  const trainer=renderToStaticMarkup(createElement(ScoreStaff,{...props,followLeft:true,readOnly:true}))
  const cursorX=trainer.match(/class="score-playback-cursor" x1="([^"]+)"/)[1]
  const trainerNoteX=trainer.match(/<ellipse cx="([^"]+)"/)[1]
  const editorNoteX=editor.match(/<ellipse cx="([^"]+)"/)[1]
  assert.notEqual(trainerNoteX,cursorX)
  assert.equal(trainerNoteX,editorNoteX)
  assert.match(trainer,/padding-left:20%;padding-right:80%/)
  assert.match(editor,/score-edit-cursor/)
  assert.doesNotMatch(trainer,/score-edit-cursor/)
})

test('Trainer feedback shares results across tied segments and marks warnings per live pitch', () => {
  const tiedScore={version:1,title:'feedback',tempo:90,timeSignature:[3,4],events:[
    {id:'long',startBeat:0,duration:4,pitches:[60]},
    {id:'current',startBeat:4,duration:1,pitches:[62]},
  ]}
  const markup=renderToStaticMarkup(createElement(ScoreStaff,{
    ...props,
    score:tiedScore,
    selected:'current',
    beat:4.2,
    playing:true,
    followLeft:true,
    readOnly:true,
    practiceActiveEventId:'current',
    practiceEventResults:{long:'correct',current:'hit'},
    livePitches:[60,65],
    liveWarningPitches:[65],
  }))
  assert.equal((markup.match(/score-practice-result--correct/g) ?? []).length,1)
  assert.equal((markup.match(/>✓<\/text>/g) ?? []).length,1)
  assert.match(markup,/score-event-frame--practice-current score-event-frame--practice-hit/)
  assert.match(markup,/data-live-pitch="65" data-live-warning="true"/)
  assert.doesNotMatch(markup,/data-live-pitch="60" data-live-warning/)

  const editor=renderToStaticMarkup(createElement(ScoreStaff,{...props,score:tiedScore}))
  assert.doesNotMatch(editor,/score-event-frame--practice/)
  assert.doesNotMatch(editor,/score-practice-result/)
})
