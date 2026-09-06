# Music Notation Studio 项目上下文

## 1. 项目简介

Music Notation Studio 是一个基于 React + TypeScript 开发的 Web 音乐记谱与练习工具。

项目目前向辅助扒谱、记录和回放的音乐工具发展；Trainer 保留为独立练习工作区。既有钢琴学习功能包括：

-   虚拟钢琴键盘
-   电脑键盘输入
-   鼠标操作
-   实时声音反馈
-   MIDI 键盘支持
-   视奏训练
-   练习数据统计

------------------------------------------------------------------------

# 2. 当前版本

## v0.6.0：Trainer 乐谱跟练（开发中）

Trainer 以 Editor 的布局与谱面为基础，新增 Editor 当前乐谱副本交接、本地保存乐谱载入、自由速度音高跟练、起止小节、循环及成绩反馈。随机练习 / 自由弹奏继续独立保留。

`src/practice/scorePractice.ts` 管理音高匹配、松键推进和统计，`ScoreTrainer.tsx` 管理跟练界面与区间，`PracticeTransport.tsx` 共用随机短句和乐谱示范回放。App 按工作区与练习来源分配实奏输入；示范声音仍经过 playback 路由，不计练习成绩。练习副本不改写 Editor；文件模型仍为 version 1。

当前范围、操作与技术债详见 [TRAINER.md](TRAINER.md)。以下 v0.5.0 及更早章节保留发布历史。

## v0.5.0：乐谱编辑第一版（2026-09-06）

新增 Trainer / 乐谱编辑选项卡，底部共用 Keyboard、Web Sound 和统一 MIDI 面板；面板内分别管理 USB MIDI 与 Bluetooth MIDI。Keyboard Dock 支持带动画的折叠状态，折叠后只保留功能控件并隐藏钢琴键，刷新后恢复上次状态。
编辑区使用固定四列的“输入 / 当前”两行矩阵：同类控件严格上下对齐，拍号旁增加独立的编辑位置列显示插入项次与拍位，数字固定宽度居中；输入音 / 当前音只保留音高内容，不再在下方占用辅助文本行。支持试音后写入单音 / 和弦或休止符，并通过最近试音替换当前音高。“回到末尾 / 删除当前”在矩阵右侧等宽上下排列并对应两行；窄屏仅横向滚动，不增加编辑区高度。撤销重做、本地保存与 JSON 导入导出继续保留。
输入音与待写入谱面预览使用主题强调色，当前音与谱面选中事件使用主题蓝色，普通已写入内容保持原谱面色。
回放控制位于乐谱下方，Play Dock 按进度、播放操作和 BPM 分组排列；进度条与拍位保持同一行，Trainer / Editor 共用统一按钮尺寸和分隔样式。支持进度条拖动、准星图标定位到当前事件及单按钮播放 / 暂停；BPM 可直接输入或每次 ±10，编辑光标与播放位置独立。
Trainer / Editor 切换位于应用标题栏，标题随工作区变化；Editor 采用宽幅居中乐谱和紧凑控制栏，时值由左右箭头步进选择。
Trainer 与 Editor 共用大谱表的纵向几何关系，中央 C 位于高低音谱正中。最近试音按待写入时值在实际插入锚点高亮显示，且不改变已有谱面排版；确认后才进入 ScoreDocument。待写入时值与选中事件时值是两个独立编辑状态。

File Dock 保留可编辑乐谱名称和摘要在左侧，文件操作与撤销／重做整体右对齐并保持单行；名称标签文字已移除以节省高度。

新增 src/score/：

- scoreModel.ts：版本化 ScoreDocument / ScoreEvent、连续拍位编辑、文件校验。
- notation.ts、ScoreStaff.tsx：音乐数据到显示片段，跨小节延音和可选择的双谱表。
- ../data/staffGeometry.ts：Trainer / Editor 共用的大谱表纵向几何。
- scoreTransport.ts：回放时钟、暂停、定位和声音生命周期。
- ScoreEditor.tsx、score.css：编辑界面、本地保存、文件操作与历史记录。

数据流：乐谱 → ScoreTransport → Input Layer（playback）→ 独立回放声音及底部键盘高亮。
实奏输入在编辑区仅试音并更新待写入音高，不推进 Trainer。回放不进入 NoteEventFactory 或 PracticeController。
切换前需松开实奏琴键；离开编辑区暂停回放，两个工作区的内容及 Trainer 状态保留。
输入层仍只转发 pressNote / releaseNote，不加入乐谱业务逻辑。

乐谱 v1 支持 `2/4、3/4、4/4、5/4、6/8、9/8、12/8` 拍号与单声部；记录 MIDI 音高、拍位与时值，不保存像素坐标。
未来简谱和吉他谱作为音乐数据的展示 / 乐器适配扩展，目前未实施。
完整使用方式、数据约束、验证和 Technical Debt 见 [SCORE_EDITOR.md](SCORE_EDITOR.md)。

以下各阶段保留原有发布历史；其中功能边界以对应阶段为准。


## v0.4.0-alpha 钢琴训练工具（P5 阶段完成）

第 3.1 阶段（双八度键盘）已完成。
第 3.2 阶段（声音控制）已完成。
P3-003（应用主布局）已完成。
P3-004（高音谱表实时音符显示）已完成。
P4-001（完整 88 键钢琴）已完成。
键盘音名显示模式已完成。
P4-002（输入系统重构）已完成。
P4-003（Web MIDI 技术验证）已完成。
P4-004（MIDI 输入接入）已完成。
P4-005（原生 Bluetooth LE MIDI 支持）已完成，ES120G 实机验证通过。
P5-001（主页面布局重构）已完成。
P5-002（完整 Grand Staff）已完成。
P5-003（主界面交互布局重构）已完成。
P5-004（主题系统与乐谱视觉重设计）已完成。
P6-001（Note Event 与基础练习框架）已完成。
P6-002（Note Practice Timeline 基础练习模式）已完成。
P6-003（Practice Canvas 与 Note Timeline 优化）已完成。
P6-004（Practice Target Lifecycle 状态模型优化）已完成。
P6-005（Chord Model 与基础和弦识别）已完成。
P6-006（Chord Practice 基础练习）已完成。
P6-007（Application Settings 持久化）已完成。

v0.1.0 已完成：

## 钢琴键盘系统

-   白键显示
-   黑键显示
-   数据驱动生成键盘布局
-   按键动画反馈
-   多音同时播放

## 输入系统

支持：

-   电脑键盘输入
-   鼠标点击输入

当前电脑键盘映射：

白键使用：

    A S D F G H J K L ; '

黑键候选位置使用：

    W E R T Y U I O P [

默认基准音为 `E3`，因此 H 键对应中央 C（C4）。白键按照顺序映射，
黑键根据相邻白键之间是否存在钢琴黑键决定是否生成映射。W、Y、O 等
位于 E-F 或 B-C 之间的候选键不会生成映射。

Input & Piano Dock 提供基准自然音下拉菜单，可选择 `A0-G6` 范围内的基准音；
左右箭头每次将基准音移动一个八度。显示出的其余琴键暂时不绑定电脑按键，
目前可通过 MIDI Input 接入完整 A0-C8 范围。

USB MIDI 和 Bluetooth MIDI 均通过 Input Layer 统一驱动 Piano、Grand Staff
和 Browser Sound。当前 USB MIDI 和 Bluetooth MIDI 各自支持一个输入设备，
且不处理 Velocity 响应。

当前输入架构：

    Keyboard
    Mouse
    USB MIDI
    Bluetooth MIDI
            ↓
        Input Layer
            ↓
    Application State
            ↓
    Piano、Grand Staff、Browser Sound

当前 Technical Debt：

-   多输入源同时持有同一音符时，Input Layer 尚未实现 ownership / reference counting。
-   当前 Input Layer 按音名管理状态，Keyboard、Mouse、USB MIDI、Bluetooth MIDI
    的释放顺序可能产生同音符状态冲突。
-   后续可通过 Input Source 或引用计数机制解决，本阶段不处理。

### 五线谱 Note Label 显示布局优化

当前 Note Display 已支持音名辅助显示，但 Note Label 与 Grand Staff 的空间关系仍需要进一步优化。

当前问题：

-   Note Label 与音符、加线之间的布局规则未完全确定；
-   极端音域（A0-C8）下可能影响谱面空间；
-   多音、和弦、左右手显示场景下需要重新设计。

后续优化方向：

-   保持 Note Label 与对应 Note 的关联关系；
-   避免覆盖五线谱线条、音符头和 Ledger Line；
-   支持多音同时显示；
-   支持和弦、左右手等扩展场景；
-   根据音符位置进行自适应布局。

暂不影响当前 P6-001 功能验收。

## 音频系统

基于 Web Audio API 实现。

当前支持：

-   实时声音生成
-   多音同时播放
-   按下持续发声
-   松开停止
-   浏览器声音开关，默认开启并作为用户偏好持久化
-   关闭声音时保持琴键动画与输入功能

------------------------------------------------------------------------

# 3. 当前项目结构

    src/

    ├── audio/
    │   └── sound.ts
    │       音频引擎

    ├── components/
    │   ├── Header.tsx
    │   ├── Toolbar.tsx
    │   ├── ThemePopover.tsx
    │   │   Theme Token 预设、自定义颜色和主题模式选择
    │   ├── NoteDisplaySettings.tsx
    │   │   Note Display 模式选择
    │   ├── NoteInfo.tsx
    │   │   Grand Staff 下方的当前音符辅助信息区域
    │   ├── PracticePopover.tsx
    │   │   Free Play / Practice 模式选择
    │   ├── SettingsPopover.tsx
    │   │   用户偏好、保存与重置设置 Popover
    │   ├── Modal.tsx
    │   │   通用锚定 Popover、Escape、外部点击和背景滚动锁定
    │   ├── KeyLabelsModal.tsx
    │   │   琴键音名显示模式选择
    │   ├── KeyboardBaseModal.tsx
    │   │   Keyboard Base 选择 Popover
    │   ├── InputPianoDock.tsx
    │   │   底部输入控制和 88 键 Piano 区域
    │   ├── InputDeviceButton.tsx
    │   │   USB MIDI、Bluetooth MIDI 紧凑状态按钮
    │   ├── GrandStaff.tsx
    │   │   Grand Staff 乐谱和 Practice 静态目标时间轴
    │   ├── Piano.tsx
    │   ├── StatusBar.tsx
    │   │   状态栏组件
    │   ├── MidiMonitor.tsx
    │   │   USB MIDI 连接和调试 Popover
    │   ├── BluetoothMidiPanel.tsx
    │   │   Bluetooth MIDI 连接 Popover
    │   └── PianoKey.tsx
    │       单个琴键组件

    ├── data/
    │   ├── piano.ts
    │   │   钢琴音符数据
    │   │
    │   ├── keyboard.ts
    │   │   电脑键盘物理键位数据
    │   │
    │   └── staff.ts
    │       统一 diatonicStep、Staff Assignment、staffStep 和 Ledger Lines 计算

    ├── input/
    │   ├── inputLayer.ts
    │   │   与输入来源无关的 pressNote/releaseNote 边界
    │   │
    │   ├── keyboardMapper.ts
    │   │   电脑键盘到音符的动态映射
    │   │
    │   ├── keyboardController.ts
    │   │   浏览器键盘事件、基准音和活动键释放
    │   ├── midiNoteController.ts
    │   │   统一 MIDI 音符状态和 Input Layer 调用
    │   ├── midiController.ts
    │   │   USB MIDI 消息适配
    │   └── bluetoothMidiController.ts
    │       Bluetooth MIDI 通知到 MIDI 音符控制器的适配

    ├── midi/
    │   ├── webMidi.ts
    │   │   Web MIDI API 适配、设备枚举和连接
    │   │
    │   ├── webBluetooth.ts
    │   │   Web Bluetooth GATT 连接适配
    │   ├── bleMidiParser.ts
    │   │   BLE MIDI 时间戳、Running Status 和消息解析
    │   └── midiMessage.ts
    │       通用 MIDI 音符消息类型

    ├── theme/
    │   └── theme.ts
    │       Theme Mode、Theme Token、Preset 和语义颜色派生逻辑

    ├── music/
    │   ├── noteEvent.ts
    │   │   NoteEvent 数据模型和统一生命周期 Factory
    │   └── noteDisplay.ts
    │       Letter、Solfege 和 Piano Key Label 显示格式化

    ├── practice/
    │   ├── timeline.ts
    │   │   固定音域预设的 Practice Phrase 生成
    │   ├── practiceController.ts
    │   │   NoteEvent 到 Practice Result 和 Cursor 推进
    │   ├── practiceTypes.ts
    │   │   Practice Session、Task 和 Result 基础类型
    │   └── practiceEvaluator.ts
    │       基于 MIDI Number 的 Practice Note 比较

    ├── settings/
    │   ├── settings.ts、defaultSettings.ts
    │   │   AppSettings 模型、版本校验和默认值
    │   ├── settingsStorage.ts
    │   │   localStorage 读取、保存和容错处理
    │   └── SettingsContext.tsx、useSettings.ts
    │       用户偏好运行时状态与持久化策略

    ├── App.tsx
    │   主应用逻辑

    └── App.css
        页面样式

项目文档：

    README.md
        面向首次访问项目的介绍

    PROJECT_CONTEXT_CN.md
        当前项目状态、架构与设计原则

    ROADMAP.md
        下一步计划与开发阶段完成情况

    CHANGELOG.md
        各版本变更记录

------------------------------------------------------------------------

# 4. 开发原则

## 保持简单

当前阶段不追求复杂架构。

优先：

-   清晰的数据结构
-   容易理解的代码
-   方便调试和扩展

## 数据驱动

琴键信息应该来自数据文件，而不是手写 UI。

例如：

``` ts
{
  name: "C4",
  pitchClass: "C",
  octave: 4,
  frequency: 261.63,
  type: "white"
}
```

界面根据数据生成。

未来扩展：

-   MIDI
-   乐谱

都依赖这个数据模型。

## 统一输入边界

所有输入源必须统一经过 Input Layer：

    Keyboard、Mouse、USB MIDI、Bluetooth MIDI、Playback
                            ↓
                        Input Layer
                            ↓
                 Application State、Piano、Grand Staff、Browser Sound

输入源不得直接驱动 Piano、Grand Staff 或 Browser Sound。Input Layer 只提供
`pressNote()` 和 `releaseNote()`，不感知具体输入来源。

------------------------------------------------------------------------

# 5. 当前限制

## 键盘范围

当前：

-   完整 88 键钢琴（A0-C8）
-   音符包含完整音高信息，例如 A0、C4、C#5、C8

当前已通过 USB MIDI 和 Bluetooth MIDI 支持完整键盘输入。

## 音频系统

当前：

-   使用电脑 Web Audio API 发声

计划：

-   支持外部 MIDI 设备自带音源
-   后续优化钢琴音色

## UI界面

当前：

-   基础应用布局
-   Header、Toolbar、Grand Staff、Piano、Status Bar
-   高音谱表实时显示当前按下的音符
-   A0-C8 完整 88 键钢琴
-   键盘音名显示模式：Hidden、White Keys、Letter、Solfege、All
-   Grand Staff 下方独立 Note Info 区域：Off、Letter、Solfege，默认使用 Letter
-   Practice 入口：Free Play、Practice
-   Practice Type：Note、Chord
-   Practice：Grand Staff 内部承载 4 小节、16 个时间位置的静态 Practice Phrase、目标状态和 Cursor 反馈
-   Practice Settings：白键 Lower / Upper Bound、Note Pool、Note Name（Hide、C、C4）
-   88 键钢琴在 Piano 区域内横向滚动，保持现有琴键尺寸
-   电脑键盘基准音控制和当前映射范围状态显示
-   Bluetooth MIDI 独立连接面板和设备状态显示
-   桌面端全宽布局、固定底部 88 键 Piano 和响应式黑键位置
-   System / Dark / Light / Custom 主题模式和自定义视觉颜色
-   Grand Staff 的统一视觉放大和 A0-C8 安全显示区域
-   Settings Popover：Auto Save、Save、Reset，以及 Theme、Key Labels、Web Sound、Note Display、Practice Settings
-   Theme、Key Labels、Web Sound、Note Display 和 Practice Settings 会在刷新后恢复；Keyboard Base 和输入 / 练习运行时状态不持久化

当前主界面结构：

    Application Toolbar
            ↓
    Grand Staff / Main Stage
            ↓
        Status Bar
            ↓
    Input & Piano Dock
            ↓
        88-Key Piano

Input & Piano Dock 当前包含 Keyboard Mapping、Key Labels、Web Sound、
USB MIDI 和 Bluetooth MIDI。设置和设备管理使用 Anchored Popover，不进入
页面正常文档流。

计划：

-   UI 精细美化
-   真正的训练模式
-   更好的视觉反馈

------------------------------------------------------------------------

# 6. 第 3 阶段开发计划

## 钢琴训练工具 v0.2

------------------------------------------------------------------------

## 6.1 双八度键盘

状态：已完成

目标：

扩展当前单八度键盘。

已完成：

-   修改钢琴数据模型，增加 `pitchClass` 与 `octave`
-   支持 C4-B5 共两个八度
-   根据音高自动生成频率
-   扩展电脑键盘映射
-   保持鼠标与电脑键盘输入系统

设计原因：

当前结构已经需要支持：

    C3
    C4
    C5

因此音符数据不能只使用：

    C
    D
    E

而需要包含完整音高信息。

------------------------------------------------------------------------

## 6.2 声音控制

状态：已完成

增加：

-   电脑声音开关
-   默认开启浏览器声音
-   关闭后不播放声音，但保留琴键动画、鼠标输入和电脑键盘输入

原因：

部分 MIDI 键盘拥有自己的音源。

如果：

    MIDI键盘发声
    +
    电脑Web Audio发声

可能产生重复声音。

因此用户应该可以选择：

-   使用电脑声音
-   使用外部设备声音

------------------------------------------------------------------------

## 6.3 界面重构

状态：基础主布局已完成，精细美化仍在计划中

目标：

从 Demo 界面升级为完整应用。

已完成：

-   应用标题
-   基础控制面板
-   Grand Staff 占位区域
-   状态栏

计划：

-   模式选择
-   更好的钢琴布局

------------------------------------------------------------------------

## 6.4 视奏模式

状态：第一版高音谱表实时显示已完成

目标：

逐步增加五线谱训练。

已完成：

-   显示高音谱表
-   将 C4-B5 映射到音头位置
-   同步当前按下的多个音符
-   松开琴键后立即移除音符
-   同一音头位置的自然音和升号音合并显示
-   支持升号（♯）显示

当前限制：

-   暂不显示低音谱表
-   仅支持升号（♯），暂不支持降号（♭）、重升号和重降号
-   暂不显示符干、拍号和小节线
-   不记录音符历史，不滚动，不播放动画

未来考虑：

-   增加低音谱表
-   增加变音记号
-   评估是否使用专业乐谱渲染库，例如 VexFlow

------------------------------------------------------------------------

## 6.5 输入系统重构（P4-002）

状态：已完成

已完成：

-   建立统一 Input Layer，仅负责 `pressNote()` 和 `releaseNote()`
-   将电脑键盘映射计算移动到 Keyboard Mapper
-   由 Keyboard Controller 管理浏览器键盘事件和活动键
-   支持 `A0-G6` 范围内的任意合法自然音基准
-   白键使用 `A` 到 `'`，黑键使用 `WERTYUIOP[` 候选位置
-   左右箭头按 12 个半音移动基准音
-   切换基准音时释放仍按下的电脑键盘音符
-   鼠标输入和电脑键盘输入均经过 Input Layer

输入链路：

    Keyboard Controller
            ↓
    Keyboard Mapper
            ↓
    Input Layer
            ↓
    App 音符状态、音频和 Grand Staff

Input Layer 不感知 Keyboard、基准音或具体输入来源，便于未来接入 MIDI、
Playback 等输入源。

本阶段不包含 MIDI、Playback、Practice Mode、Metronome 或 Toolbar 整体重构。

------------------------------------------------------------------------

## 6.6 Web MIDI 技术验证（P4-003）

状态：已完成

已完成：

-   检测浏览器 Web MIDI API 支持情况
-   通过用户操作请求 MIDI 权限
-   获取 MIDI Input 设备名称、制造商和连接状态
-   支持用户选择并连接一个 MIDI Input
-   连接成功后在 Status Bar 显示设备状态
-   在 Console 输出 Note On、Note Off、Note Number 和 Velocity

架构边界：

-   Web MIDI 逻辑位于 `src/midi/webMidi.ts`
-   MIDI 面板位于 `src/components/MidiMonitor.tsx`
-   当前不接入 Input Layer
-   当前不驱动 Piano、Grand Staff 或 Audio
-   当前只监听一个 MIDI Input

本阶段是技术验证，不包含 MIDI 演奏逻辑、MIDI Output、Bluetooth MIDI、
Sustain Pedal 或完整 Velocity 处理。

------------------------------------------------------------------------

## 6.7 MIDI 输入接入（P4-004）

状态：已完成

已完成：

-   MIDI Input 通过 `MidiInputController` 接入 Input Layer
-   USB MIDI 通过独立的 `MidiNoteController` 处理 MIDI 音符状态
-   使用 `midiNumberToPianoNote()` 将 MIDI Note Number 转换为 Piano Note
-   使用 `pianoNoteToMidiNumber()` 提供反向转换能力
-   Note On 调用 `pressNote()`
-   Note Off 或 Note On + Velocity 0 调用 `releaseNote()`
-   支持 MIDI 多键同时按下
-   忽略 A0-C8 之外的 MIDI 音符
-   防止重复 Note On、重复 Note Off 和设备断开卡键
-   保持 Browser Sound 开关逻辑不变

输入链路：

    MIDI Input
          ↓
    Web MIDI Adapter
          ↓
    MidiInputController
          ↓
    MidiNoteController
          ↓
    Input Layer
          ↓
    Piano、Grand Staff、Browser Sound

明确不包含：

-   MIDI Velocity 响应
-   Bluetooth MIDI、MIDI Output、Sustain Pedal、Aftertouch、Pitch Bend
-   Program Change
-   多个 MIDI Input 同时监听

技术债：

-   当前 Input Layer 按音名管理状态。
-   Keyboard、Mouse、USB MIDI、Bluetooth MIDI 同时按下同一个音符时，释放顺序可能存在冲突。
-   后续可通过 Input Source 或引用计数机制解决。
-   本 Issue 不处理该问题。

------------------------------------------------------------------------

## 6.8 原生 Bluetooth LE MIDI 支持（P4-005）

状态：已完成

已完成：

-   检测 Web Bluetooth API 和安全上下文
-   通过浏览器原生设备选择窗口选择一个 BLE MIDI 设备
-   连接 BLE MIDI Service 和 Data I/O Characteristic
-   解析 BLE MIDI 时间戳、Running Status 和多消息数据包
-   支持 Note On、Note Off 和 Note On + Velocity 0
-   通过 `BluetoothMidiController` 接入 Input Layer
-   使用独立的 `MidiNoteController` 管理 Bluetooth MIDI 活动音符
-   支持多键同时按下
-   断开设备后释放所有 Bluetooth MIDI 活动音符
-   Status Bar 显示 Bluetooth MIDI 设备连接状态
-   已通过 ES120G 实机验证连接、Note On、Note Off 和断开释放

输入链路：

    Bluetooth Device
            ↓
    Web Bluetooth Adapter
            ↓
    BLE MIDI Parser
            ↓
    BluetoothMidiController
            ↓
    MidiNoteController
            ↓
    Input Layer
            ↓
    Piano、Grand Staff、Browser Sound

职责边界：

-   `webBluetooth.ts` 负责浏览器 API、GATT 连接、Characteristic Notification
    和设备断开事件。
-   `bleMidiParser.ts` 只负责 BLE MIDI 协议解析，不负责连接和音符状态。
-   `BluetoothMidiController` 负责 Bluetooth 连接、接收 Notification 并调用 Parser。
-   `MidiNoteController` 统一负责 MIDI Note On、Note Off、Velocity 0、音符转换、
    Active Note 管理和 Input Layer 调用。
-   USB MIDI 与 Bluetooth MIDI 各自持有独立的 `MidiNoteController` 实例。

浏览器限制：

-   第一版目标为支持 Web Bluetooth 的 Chrome / Edge。
-   Web Bluetooth 需要安全上下文，并且设备选择必须由用户操作触发。
-   Firefox、Safari 等不支持浏览器显示明确提示。

明确不包含：

-   Bluetooth MIDI Output
-   Sustain Pedal、Aftertouch、Pitch Bend 和 Velocity 响应
-   自动重连
-   多个 Bluetooth MIDI 设备同时连接
-   其他非 Note On / Note Off MIDI 消息

技术债：

-   当前 Input Layer 按音名管理状态。
-   Keyboard、Mouse、USB MIDI、Bluetooth MIDI 同时按下同一个音符时，释放顺序可能冲突。
-   多输入源同音符引用计数作为后续独立 Issue 处理。

------------------------------------------------------------------------

# 7. 第 5 阶段开发计划

## P5-001 主页面布局重构

状态：已完成

已完成：

-   页面主体扩展为桌面端全宽布局，内容最大宽度约 `1920px`
-   Grand Staff 扩展为主要视觉区域，高度约 `320px`
-   88 键虚拟钢琴固定在 viewport 底部
-   Main Content 使用与 Piano Dock 共用的底部安全空间变量
-   52 个白键根据可用宽度自适应显示
-   黑键位置基于白键索引计算百分比，不依赖旧版像素宽度
-   默认无需横向滚动即可显示完整 A0-C8
-   保持 Hidden、White Keys、C Notes、All 四种 Key Labels 模式
-   保持 Keyboard、Mouse、USB MIDI、Bluetooth MIDI 输入功能

布局结构：

    Header / Toolbar
            ↓
    Main Content
      ├── Grand Staff
      └── Status Bar
            ↓
    Fixed Piano Dock

设计边界：

-   Piano Dock 与主内容使用统一的最大宽度体系。
-   黑键位置完全基于白键索引和百分比，不依赖旧版像素宽度。
-   Grand Staff 仅扩大容器，保留现有 SVG viewBox 和音符坐标逻辑。
-   不使用全局 `overflow-x: hidden` 掩盖布局溢出。

明确不包含：

-   Bass Staff、Ledger Lines、Recording、Playback、Practice Mode 或 Metronome
-   完整视觉主题重设计或移动端专项适配
-   Input Layer、MidiNoteController、Browser Sound 和现有音符业务逻辑重构

------------------------------------------------------------------------

## P5-002 完整 Grand Staff

状态：已完成

已完成：

-   使用一个统一 SVG 绘制 Treble Staff 和 Bass Staff。
-   增加 Treble Clef、Bass Clef 和左侧 Grand Staff 连接结构。
-   支持完整 A0-C8 音域，超出五线范围的音符使用完整 Ledger Lines。
-   `C4` 及以上分配到高音谱表，`B3` 及以下分配到低音谱表。
-   使用 `diatonicStep → Staff Assignment → staffStep` 计算音符位置。
-   Middle C（C4）与相邻 B3、D4 保持连续等距的 Staff Position Model。
-   Sharp 不改变 staffStep，只在音符左侧显示升号。
-   不同实际音高保留独立音符头，即使它们拥有相同 staffStep。
-   当前和弦共享主要横向位置，仅在相邻音符或同 staffStep 发生碰撞时局部错位。
-   Ledger Lines 按 `staff + staffStep` 去重，避免重复绘制。
-   保持 `viewBox`、`preserveAspectRatio` 和响应式页面布局。

数据流：

    App pressedNotes
            ↓
    GrandStaff
            ↓
    staff.ts 音高位置模型
            ↓
    Staff Assignment / staffStep
            ↓
    SVG 音符、升号和 Ledger Lines

设计边界：

-   Grand Staff 只负责当前活动音符的实时显示。
-   不实现音符时值、符干、符尾、节奏、小节线、调号或谱面滚动。
-   不直接连接 Keyboard、Mouse、USB MIDI 或 Bluetooth MIDI Controller。
-   不修改 Input Layer、MidiNoteController、Piano 或 Browser Sound。

------------------------------------------------------------------------

## P5-003 主界面交互布局重构

状态：已完成

页面结构：

    Header
    Toolbar
    Main Stage
      ├── Grand Staff
      └── Status Bar
    Input & Piano Dock
      ├── Keyboard Mapping
      ├── USB MIDI
      ├── Bluetooth MIDI
      ├── Web Sound
      └── 88-Key Piano
    Popover Layer

已完成：

-   Toolbar 仅保留 Practice、Metronome，并统一使用 Button 风格。
-   Web Sound 移动到 Input & Piano Dock 右侧，与 USB MIDI、Bluetooth MIDI 同组，声音逻辑保持不变。
-   Key Labels 移动到 Input & Piano Dock，通过锚定 Popover 选择 Hidden、White Keys、C Notes、All。
-   Browser Sound 通过 Button 的 Active / Inactive 状态表达开关。
-   Keyboard Base 从 Toolbar 移动到 Input & Piano Dock，映射逻辑保持不变。
-   Keyboard Base 与 Keyboard Range 合并为一个带边框的 Keyboard Mapping 复合控件。
-   Keyboard Mapping 中间按钮直接显示完整 Range；点击后通过 Keyboard Base Popover 选择 Base，左右按钮使用三角方向图标按八度移动。
-   USB MIDI、Bluetooth MIDI 入口移动到 Input & Piano Dock。
-   顶部与底部按钮统一高度、内边距、圆角、边框、字号和状态样式。
-   状态型按钮使用“功能名称 + 当前状态”双行结构，状态变化不改变按钮尺寸。
-   Dock 左侧放置 Keyboard Mapping、Key Labels，右侧放置 Web Sound、USB MIDI、Bluetooth。
-   USB MIDI、Bluetooth MIDI 使用紧凑的统一状态按钮，完整设备名称仅在 Popover 内显示。
-   MIDI、Bluetooth 和 Key Labels 管理界面改为锚定触发按钮的 Popover，不进入页面文档流。
-   所有 Popover 支持 Close Button、Escape、外部点击关闭和背景滚动锁定。
-   Popover 按内容分为紧凑和宽面板，并使用统一内容留白与 viewport 安全边距。
-   Input Controls 增加垂直空间，避免按钮边框或圆角被 Dock 容器裁切。
-   Grand Staff 通过统一比例放大 SVG 内容，P5-002 音高几何模型保持不变。

连接状态原则：

-   `midiConnectionState` 和 `bluetoothConnectionState` 仅作为真实连接流程的 UI 映射。
-   连接开始、成功、失败、用户取消、主动断开和设备物理断开均同步更新状态。
-   不形成独立于真实设备连接的第二套 MIDI / Bluetooth 状态机。

设计边界：

-   不修改 Input Layer、MidiNoteController、Keyboard Mapper、Keyboard Controller。
-   不修改 Web MIDI、Web Bluetooth、BLE MIDI Parser 或 Browser Sound 架构。
-   不实现 Theme、Practice Mode、Recording、Playback、Metronome 逻辑或移动端专项设计。

------------------------------------------------------------------------

## P5-004 主题系统与乐谱视觉重设计

状态：已完成

主题数据与显示层分离：

    Theme Mode / Preset
              ↓
        Theme Tokens
              ↓
        CSS Variables

已完成：

-   `src/theme/theme.ts` 统一维护 `system`、`dark`、`light`、`custom` 状态语义、主题预设和颜色 Token。
-   默认主题为 Follow System；系统变化时，`system` 模式自动切换实际颜色。
-   用户修改任一颜色后进入 `custom` 模式；Reset 清除自定义 Token 并恢复 Follow System。
-   Toolbar 通过 `ThemePopover` 提供 Dark、Light、Custom 选择和颜色编辑。
-   Theme Tokens 通过 CSS Variables 应用到页面、Toolbar、Popover、Score、Staff、Note 和 Piano。
-   Page Background、Score Background、Staff Color、Active Note Color、左右手预留颜色均由 Theme Token 管理。
-   Staff Color 统一应用于五线、谱号、Ledger Lines 和 Grand Staff 连接结构。
-   Active Note Color 通过统一派生逻辑生成白键和黑键 Piano Highlight 变体，并联动 Grand Staff 音符颜色。
-   Left / Right Hand Color 数据结构已预留；当前尚未实现 Hand Assignment，不根据音高猜测左右手。
-   当前没有 hand metadata，因此 Single / Left-Right Hand 模式均以 Active Note Color 作为活动音符回退颜色。
-   Grand Staff 仅进行统一比例放大和 SVG 安全区域调整，保留 `staffStep`、音高分谱、Middle C 位置和 Ledger Line 计算。

设计边界：

-   不修改 Input Layer、Keyboard Mapper、Keyboard Controller、MidiNoteController、MIDI、Bluetooth MIDI 或 Browser Sound 逻辑。
-   不修改 Keyboard Mapping、Input & Piano Dock 布局和 Grand Staff 音高模型。
-   不实现 Recording、Playback、Metronome 或左右手音符归属判断。

------------------------------------------------------------------------

## P6-001 Note Event 与基础练习框架

状态：已完成

当前数据流：

    Keyboard、Mouse、USB MIDI、Bluetooth MIDI
                    ↓
                Input Layer
                    ↓
          pressedNotes + Note Event Factory
                    ↓
          Visualization / Practice

其中，Grand Staff 只负责 Clef、Staff Lines、Notes、Ledger Lines 和 Accidentals。
Note Display 通过 Grand Staff 下方独立的 Note Info 区域展示当前音符，不直接绘制在谱面音符附近。

已完成：

-   `src/music/noteEvent.ts` 提供统一 `NoteEvent` 模型和 Factory，集中负责创建、结束和持续时间计算。
-   `NoteEvent` 包含 note、MIDI Number、可选 Velocity、开始时间、结束时间、持续时间和输入来源。
-   Keyboard、Mouse、USB MIDI、Bluetooth MIDI 只提供 Raw Note Message，不分别维护 NoteEvent 生命周期。
-   `pressedNotes` 继续负责 Piano Highlight 和 Grand Staff 实时显示；NoteEvent 不替代当前状态。
-   `Note Display Mode` 统一为 `hidden`、`letter`、`solfege`，通过 Grand Staff 下方 Note Info 区域展示，默认使用 Letter。
-   Key Labels 将旧的 `C Notes` 兼容迁移为 `Letter`，并增加 `Solfege`；默认改为 `White Keys`。
-   `PracticeTask`、`PracticeSession` 和 `PracticeResult` 已建立，`PracticeEvaluator` 使用 MIDI Number 比较音符。

设计边界：

-   不实现完整 Practice UI、Recording、Playback、Chord Recognition、Scale Analysis、Rhythm Detection 或 Music Theory Analysis。
-   不修改 `staff.ts`、Grand Staff Pitch Model、Theme System、Browser Sound、MIDI Parser 或 BLE MIDI Parser。
-   不处理多输入源同时持有同一音符时的 ownership / reference counting。

------------------------------------------------------------------------

## P6-002 Note Practice Timeline 基础练习模式

状态：已完成

当前流程：

    Practice Timeline（位于 Grand Staff 内部）
            ↓
    当前目标位置
            ↓
    NoteEvent
            ↓
    PracticeController
            ↓
    PracticeEvaluator
            ↓
    Cursor / Practice Result

已完成：

-   `PracticeTimelineNote` 包含稳定 `id`、Note、MIDI Number、Beat Position 和可选 Duration。
-   Timeline 固定为 4/4、4 个 Beat、每个 Beat 一个 Note，音域为 C3-C5。
-   `PracticeController` 只接收 `NoteEvent`，不感知 Keyboard、Mouse、USB MIDI 或 Bluetooth MIDI。
-   Grand Staff 通过 `targetNotes` 和 Timeline Note 接收练习目标，四个目标音符按 Beat 横向排列。
-   当前用户输入的 `pressedNotes` 始终对齐当前目标位置，并与目标音符保持独立。
-   正确输入推进 Cursor，错误输入保持当前目标并提供反馈。

设计边界：

-   不实现 Chord Practice、Scale Practice、Recording、Playback、Rhythm Detection、Tempo 或动态滚动。
-   不修改 Input Layer、Piano、Browser Sound、MIDI / Bluetooth 数据流或现有 Note Label 布局。

------------------------------------------------------------------------

## P6-003 Practice Canvas 与 Note Timeline 优化

状态：已完成

当前模型：

    Practice Phrase（4 个 Measure、16 个 Note）
                    ↓
            Grand Staff Practice Canvas
                    ↓
          Future / Current / Completed

已完成：

-   `PracticePhrase` 固定为 4/4、4 个小节、每小节 4 个音符；每个 `PracticeTimelineNote` 包含稳定 `id` 和 `index`。
-   练习目标音符直接在 Grand Staff 内按时间顺序横向排列，不再增加独立 Timeline 面板。
-   当前目标通过 `targetNotes` 数组传递，保留未来和弦目标的扩展接口。
-   Practice 模式下当前 `pressedNotes` 与当前目标的 X 位置对齐；Free Play 继续使用原有实时显示位置。
-   目标音符支持 Future、Current、Completed 三种视觉状态；小节线只用于视觉分隔，不参与 Cursor、X 坐标或练习判断。
-   Practice Settings 支持白键 Lower / Upper Bound、All / White Only / Black Only 音符池，以及 Hide / C / C4 音名显示模式。
-   完成一个 Phrase 后生成下一组 Phrase，Cursor 重置为 0，反馈恢复 Ready，且不修改输入、音频和 Piano 行为。

设计边界：

-   `PracticeController` 只接收 `NoteEvent`，不感知具体输入源。
-   不实现节奏判断、Tempo、音符时值判断、动态滚动、MIDI 文件导入、Chord Practice 或左右手识别。
-   不修改 Input Layer、Keyboard、Mouse、USB MIDI、Bluetooth MIDI、Piano 或 Browser Sound 逻辑。
-   不处理极端音域下的音名避让和既有 Note Label Technical Debt。

------------------------------------------------------------------------

## P6-004 Practice Target Lifecycle 状态模型优化

状态：已完成

当前流程：

    Note On NoteEvent
            ↓
      Target Evaluation
            ↓
      Target Complete
            ↓
       Note Release
            ↓
       Cursor Advance

已完成：

-   Practice Target 增加 Pending、Matching、Completed、Waiting Release 生命周期语义。
-   `completed` 只表示 Required Notes 已满足，不代表 Cursor 已推进。
-   当前 Target 通过 `PracticeTargetOwnership` 记录 `eventId`、MIDI Number 和可选输入来源。
-   Note On 只匹配当前 Target；等待 Release 阶段提前输入下一个 Target 会被忽略。
-   `NoteEventFactory.close()` 产生的关闭 NoteEvent 会进入 PracticeController 的 Release Evaluation。
-   只有当前 Target 所有 Required Notes 对应事件均释放后，才推进 Cursor。
-   Phrase 最后一个 Target 释放完成后，生成下一组 Phrase 并重置 Cursor。

设计边界：

-   PracticeController 只接收 NoteEvent，不感知 Keyboard、Mouse、USB MIDI 或 Bluetooth MIDI 原始消息。
-   当前仍只生成单音 Target；`targetNotes`、`matchedNotes` 和 `ownedEvents` 为未来和弦扩展预留。
-   不修改 Input Layer、Piano、Grand Staff、Browser Sound、MIDI / Bluetooth 数据流或 Parser。
-   多输入源在 Input Layer 层面的 ownership / reference counting 继续作为既有 Technical Debt 保留。

------------------------------------------------------------------------

## P6-005 Chord Model 与基础和弦识别

状态：已完成

当前和弦分析数据流：

    Note Collection
            ↓
       Pitch Class
            ↓
      Chord Analyzer
            ↓
          Chord
            ↓
         Display

已完成：

-   新增 `Chord` 模型，包含 `root`、`quality` 和 `intervals`。
-   当前支持 `major` 和 `minor` 两种三和弦质量。
-   `analyzeChord(notes: PianoNote[]): Chord | null` 为纯音乐逻辑，不依赖 `pressedNotes`、输入源或 PracticeController。
-   使用 MIDI Number 的 `% 12` 归一化 Pitch Class，并对重复八度音去重。
-   仅当存在三个不同 Pitch Class 且完整匹配 Major / Minor Triad 时返回结果。
-   每个 Pitch Class 都可作为 Root，支持和弦转位，不依赖最低音判断。
-   使用 `formatChordName()` 独立生成显示名称，例如 `C`、`Am`。
-   当前 UI 从实时 `pressedNotes` 生成 Note Collection，在 Grand Staff 内部辅助区域显示有效和弦名称。

设计边界：

-   Chord 是 Note Collection 的分析输出，不是新的输入类型。
-   不将 Chord 接入 Practice Target、NoteEvent 或 PracticeController。
-   不实现 Chord Practice、Slash Chord、七和弦、调性 / 罗马数字、左右手分析、缺音推断或模糊匹配。
-   不修改 Input Layer、Keyboard、Mouse、USB MIDI、Bluetooth MIDI、Piano、Browser Sound 或 Grand Staff 几何。

------------------------------------------------------------------------

## P6-006 Chord Practice 基础练习

状态：已完成

Chord Practice 复用现有 Practice Target、Target Lifecycle 和 Grand Staff
Practice Canvas，不新增独立 Practice Engine。

当前时间轴目标模型：

    Note Practice:
    targetNotes = [C4]

    Chord Practice:
    targetNotes = [C4, E4, G4]

已完成：

-   `PracticeTimelineNote` 使用 `targetNotes[]` 作为唯一目标音来源。
-   `PracticeSettings` 增加 `practiceType`，支持 `note` 和 `chord`。
-   Chord Practice 基于当前 Note Bound 生成白键 Root Position Major / Minor Triad。
-   Chord Target 的所有 Required Notes 同时 active / matched 后才进入 `completed`。
-   Chord Target 完成后等待所有 Required Notes Release，再推进 Cursor。
-   Target 状态属于整个时间位置，和弦内的目标音不会分别显示不同的 Practice 状态。
-   Grand Staff 在同一 X 时间位置显示和弦音符，并复用 Chord Analyzer / Formatter 显示 Chord Symbol。

设计边界：

-   Chord Practice 不使用 Note Practice 的 All、White Only、Black Only Note Pool；Chord Pool 后续单独设计。
-   当前不生成黑键和弦、Chord Inversion、Seventh Chord、Slash Chord 或其他和弦质量。
-   Note Bound 对所有 Required Notes 继续生效；越界 Target 不自动转位、换八度或替换音符。
-   不修改 Input Layer、NoteEvent、Keyboard、Mouse、USB MIDI、Bluetooth MIDI、Piano、Browser Sound 或 Grand Staff 音乐几何。

------------------------------------------------------------------------

## P6-007 Application Settings 持久化

状态：已完成

当前数据流：

    Settings UI
            ↓
      Settings Context
            ↓
    Runtime Preferences
            ↓
       localStorage

已完成：

-   新增版本化 `AppSettings`，持久化 Theme、Piano Key Labels、Web Sound、Grand Staff Note Display 和 Practice Settings。
-   默认 Auto Save 开启；关闭时设置仍立即作用于当前 UI，仅等待手动 Save 写入 localStorage。
-   Reset Settings 会立即应用默认值；Auto Save 关闭时不会自动覆盖已有持久化数据。
-   存储加载支持 JSON 异常处理、缺失字段默认值合并、非法枚举回退和后续版本迁移接口。
-   Settings Popover 标题栏提供 Auto Save On/Off 指示灯、Save 和 Reset；现有 Theme、Key Labels、Note Display、Practice 入口统一使用 Settings Context。

设计边界：

-   不持久化 Browser Audio Context / Unlock State、Keyboard Base、pressedNotes、MIDI / Bluetooth Connection、Practice Cursor / Phrase / Result、NoteEvent、Recording 或 History。
-   不修改 Input Layer、Keyboard Controller、Mouse Input、USB MIDI、Bluetooth MIDI、Practice Lifecycle、Chord Analyzer、Piano Model 或底层 Browser Sound 架构。

------------------------------------------------------------------------

# 8. 后续规划

## 练习模式

可能加入：

-   随机音符练习
-   正确率统计
-   分数系统
-   反应时间统计

## MIDI支持

已完成基础 USB MIDI 和 Bluetooth MIDI Input 接入，后续可能加入：

-   MIDI键盘输入
-   MIDI力度（Velocity）
-   外部乐器支持

------------------------------------------------------------------------

# 9. 开发流程

新增功能时：

1.  讨论需求和设计方案
2.  确认架构影响
3.  修改代码
4.  测试功能
5.  Git提交版本
6.  提交开发总结，并明确记录 `Technical Debt`
7.  等待 Product 验收和 Tech Lead Review
8.  验收通过后关闭 Issue

每次提交总结必须包含：

-   Commit 信息
-   修改文件
-   实现内容
-   没有修改的范围
-   验证结果
-   `Technical Debt`：填写“无”或列出明确的技术债

避免：

-   一次性大规模重构
-   为未来需求过度设计

------------------------------------------------------------------------

# 10. 当前Git版本

当前开发版本：

    v0.5.0 Music Notation Studio / Score Editor
    既有 Trainer 功能与 P6-001 至 P6-007 已完成；乐谱编辑第一版已完成
    Release: v0.5.0
    当前开发：在 main 上继续完善 Score Editor

最新稳定版本：

    v0.5.0
    Music Notation Studio / Score Editor

------------------------------------------------------------------------

# 11. 文档职责

| 文件 | 作用 | 更新频率 |
| --- | --- | --- |
| `README.md` | 给第一次访问项目的人看 | 很少改，仅在主要功能或使用方式变化时更新 |
| `PROJECT_CONTEXT_CN.md` | 当前项目状态、架构、设计原则 | 每个大版本更新 |
| `ROADMAP.md` | 下一步计划、任务完成情况 | 每个开发阶段更新 |
| `CHANGELOG.md` | 记录每个版本新增和变更内容 | 每次发布更新 |
| `SCORE_EDITOR.md` | 乐谱编辑使用、数据格式、验证与技术债 | 编辑区功能变化时更新 |
