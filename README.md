# Music Notation Studio 🎹

A browser-based music notation and practice tool built with React and TypeScript.

一个基于 React 和 TypeScript 构建的浏览器音乐记谱与练习工具。

## Trainer / 乐谱跟练（v0.6.0 开发中）

在 Editor 点击「去练习」可练习当前乐谱；Trainer 也能载入本地已保存乐谱。支持逐音练习与按 BPM 时间轴跟弹、固定轴识别区间、严格顺序判定、谱面即时正确／警告反馈、小节范围、循环、示范播放和本轮成绩，随机练习现可按音域、音符池、和弦、拍号与时值生成标准乐谱，并复用同一跟练界面；自由弹奏独立提供即时谱面与最近试音。练习副本不会修改 Editor 原谱。

See [TRAINER.md](TRAINER.md) for score practice, range selection, scoring, and limits.

## Score Editor / 乐谱编辑

The application opens on the dedicated **Score Editor** tab by default. It shares the bottom Keyboard / MIDI input dock with Trainer; the dock can collapse to keep its controls visible while hiding the piano keys.

应用默认打开独立的 **Score Editor / 乐谱编辑** 选项卡，并与 Trainer 共用底部 Keyboard / MIDI 输入区；Dock 可折叠为仅保留功能键的紧凑状态，USB 与 Bluetooth MIDI 通过统一的 MIDI 按钮进入同一面板分别管理。

Audition notes first. Once all keys are released, the selected pitches and input duration appear at the insertion anchor; they enter the score only after writing. The fixed two-row `Input / Current` editor separates insertion from changes to the selected event.

先自由试音；全部松键后，实际插入锚点会预览音高和输入时值，确认写入后才进入乐谱。“输入 / 当前”固定两行分别处理新增内容和已选事件，当前音高通过最近试音替换。

Editor and Trainer share the same grand-staff geometry, placing middle C between the two inner staff lines. Local save and refresh recovery, JSON import and export, a draggable progress bar, combined play / pause, and 30–240 BPM editing with ±10 controls are included.

Editor 与 Trainer 共用大谱表纵向几何，中央 C 位于高低音谱内侧线之间。支持本地保存、刷新恢复、JSON 导入导出、可拖动进度条、单按钮播放 / 暂停，以及可输入或每次 ±10 调整的 30–240 BPM。

The first release supports common time signatures (`2/4`, `3/4`, `4/4`, `5/4`, `6/8`, `9/8`, `12/8`) and one continuous voice, including simultaneous chords. Score data stores MIDI pitches and beat positions, leaving room for future numbered notation and guitar tablature views; those conversions are not yet implemented.

第一版支持常用拍号（`2/4`、`3/4`、`4/4`、`5/4`、`6/8`、`9/8`、`12/8`）与一个连续声部，也支持同时起止的和弦。乐谱以 MIDI 音高和拍位保存，为后续简谱、吉他谱展示留出扩展空间；这些转换尚未实现。

See [SCORE_EDITOR.md](SCORE_EDITOR.md) for workflows, data format, and limits. Trainer practice remains available as a separate workspace.

使用方法、数据格式和限制见 [SCORE_EDITOR.md](SCORE_EDITOR.md)。Trainer 的练习流程作为独立工作区继续保留。

## Features / 功能

- 🎹 Responsive 88-key virtual piano keyboard (`A0-C8`)<br>
  响应式 88 键虚拟钢琴键盘
- ⌨️ Computer keyboard input with an adjustable white-key base note<br>
  支持电脑键盘输入，并可调整白键基准音
- 🖱️ Mouse click input<br>
  支持鼠标点击输入
- 🔗 Unified Input Layer for Keyboard, Mouse, USB MIDI, and Bluetooth LE MIDI<br>
  Keyboard、Mouse、USB MIDI 和 Bluetooth LE MIDI 统一经过 Input Layer
- 🎹 Polyphonic sampled grand piano with velocity, envelopes, and limiter protection<br>
  支持力度、包络与限幅保护的本地采样多声部三角钢琴音源
- 🔊 Browser sound toggle, enabled by default<br>
  浏览器声音开关，默认开启
- 🎹 USB MIDI input through the shared Unified Input Layer<br>
  通过统一 Input Layer 接入 USB MIDI
- 📡 Bluetooth LE MIDI input through the shared Unified Input Layer<br>
  通过统一 Input Layer 接入 Bluetooth LE MIDI
- 🧩 Application layout with toolbar, Input & Piano Dock, and status bar<br>
  包含工具栏、Input & Piano Dock 和状态栏的应用布局
- 🎼 Complete Grand Staff with treble/bass staves for the full 88-key range<br>
  支持完整 88 键音域的高音谱表与低音谱表
- 🏷️ Five keyboard label display modes<br>
  五种琴键音名显示模式：Hidden、White Keys、Letter、Solfege、All
- 🎼 Independent Note Info area below Grand Staff with Off, Letter, and Solfege modes<br>
  Grand Staff 下方提供独立 Note Info 区域，支持 Off、Letter 和 Solfege 显示模式
- 🎯 Practice Canvas with a 16-note static 4/4 phrase, white-key range bounds, and configurable note pool<br>
  支持 16 音符静态 4/4 练习乐句、白键范围上下界和可配置音符池的 Practice Canvas
- 🔁 Practice Target lifecycle with release-gated cursor advancement<br>
  支持等待当前目标音符释放后再推进 Cursor 的 Practice Target 生命周期
- 🎼 White and black key support<br>
  支持白键和黑键
- 🎶 Multi-note playback<br>
  支持多音同时播放
- 🖥️ Responsive desktop layout with a fixed 88-key Input & Piano Dock<br>
  响应式桌面布局和固定底部 88 键 Input & Piano Dock
- 🪟 Anchored Popover interaction for settings, USB MIDI, and Bluetooth MIDI<br>
  设置、USB MIDI 和 Bluetooth MIDI 使用锚定 Popover 交互
- 🎨 Dark / Light / Custom themes with Follow System and Reset behavior<br>
  支持 Dark、Light、Custom 主题，以及跟随系统和 Reset 行为
- 🎨 Theme Token and CSS Variable system for semantic visual colors<br>
  使用 Theme Token 和 CSS Variable 统一管理语义视觉颜色
- 🎨 Note Color drives Grand Staff notes and derived white/black Piano highlights<br>
  Note Color 同步驱动 Grand Staff 音符，并派生白键、黑键高亮颜色
- 📝 Score Editor with manual note, chord, rest, duration, and time-signature entry<br>
  Score Editor 支持手动录入单音、和弦、休止符、时值与拍号
- ▶️ Score playback with seeking, cursor following, local save, and JSON import/export<br>
  支持定位回放、播放光标跟随、本地保存及 JSON 导入导出

The computer keyboard maps white keys from `A` through `'` and uses
`WERTYUIOP[` as candidate black-key positions. Keyboard Mapping in the Input &
Piano Dock selects the base note and moves it by one octave with the arrow buttons.
The default base is `E3`, placing middle C (`C4`) on `H`. Web Sound, MIDI Input,
and Bluetooth MIDI controls are grouped in the same dock. MIDI Input can drive the
same Piano, Grand Staff, and Browser Sound flow through the shared Input Layer.
Bluetooth LE MIDI uses the Web Bluetooth API and is available through the
Bluetooth button in the Input & Piano Dock in supported secure Chromium browsers.

电脑键盘使用 `A` 到 `'` 映射白键，并使用 `WERTYUIOP[` 作为黑键候选位置。
Input & Piano Dock 中的 Keyboard Mapping 可以选择基准音，并通过方向按钮按八度移动。
默认基准音为 `E3`，因此中央 C（`C4`）位于 `H` 键。Web Sound、MIDI Input 和 Bluetooth MIDI
控制集中在同一个 Dock 中。MIDI Input 可以通过统一 Input Layer 驱动 Piano、Grand Staff
和 Browser Sound。在支持且使用安全上下文的 Chromium 浏览器中，可以通过 Input & Piano Dock
中的 Bluetooth 按钮使用 Web Bluetooth API 连接 Bluetooth LE MIDI。

## Tech Stack / 技术栈

- React
- TypeScript
- Vite
- Web Audio API

## Current Status / 当前状态

当前开发版本为 `v0.6.0`，新增上述 Trainer 乐谱跟练；以下为既有 v0.5.0 功能基础。

Version `v0.5.0` adds the first Score Editor release to the completed Trainer scope: manual score entry, editable time signatures, score playback and seeking, local score persistence, JSON import/export, and a shared grand-staff layout. The existing 88-key piano, Keyboard / Mouse / USB MIDI / Bluetooth LE MIDI input, Unified Input Layer, practice tools, themes, and Input & Piano Dock remain included.

版本 `v0.5.0` 在既有 Trainer 范围上加入第一版 Score Editor：手动录谱、可编辑拍号、乐谱回放与定位、本地乐谱保存、JSON 导入导出，以及共享大谱表布局。原有的 88 键钢琴、Keyboard / Mouse / USB MIDI / Bluetooth LE MIDI 输入、统一 Input Layer、练习工具、主题和 Input & Piano Dock 均继续保留。

## Development / 开发

Install dependencies:

安装依赖：

```bash
npm install
```

Start the development server:

启动开发服务器：

```bash
npm run dev
```

Build, lint, and test the project:

构建、检查并测试项目：

```bash
npm run build
npm run lint
npm test
```

Automated tests use Node.js 24's built-in test runner and the existing TypeScript compiler, with no additional dependencies.

自动化测试使用 Node.js 24 的内置测试运行器及已有 TypeScript 编译器，无新增依赖。
