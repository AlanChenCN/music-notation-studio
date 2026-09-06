# Music Notation Studio 开发路线图

## v0.6.0：Trainer 乐谱跟练（开发中）

- [x] Editor 当前副本交接、Trainer 本地保存乐谱载入。
- [x] 共用 Editor 谱面与控件设计，保留随机练习来源。
- [x] 音高匹配、完整和弦与松键推进、休止符跳过。
- [x] 小节范围、循环、谱面选择起点、成绩与有效用时。
- [x] 区间示范回放、独立播放位置和 BPM。
- [x] 时间轴跟弹、预备一小节、完整事件窗口识别、逐事件谱面结果、实奏即时反馈与左侧固定播放轴。
- [ ] 后续另行确定：精确起音 / 时长评分、错题库、长期练习历史。

## 乐谱工具方向（2026-09-05）

产品新增手动扒谱记录工作区；Trainer 作为独立选项卡继续保留。

### 乐谱编辑第一版：已发布于 v0.5.0

- [x] 独立编辑区与底部共享 Keyboard / MIDI。
- [x] 单声部音符 / 和弦 / 休止符逐步录入，音高、时值、插入、删除和撤销 / 重做。
- [x] 乐谱数据模型与双谱表显示；跨小节时值拆分显示并保持延音。
- [x] 播放、暂停、停止、速度与进度拖动定位。
- [x] 本地手动保存、刷新恢复和 JSON 文件导入导出。
- [x] 自动化测试、浏览器验收和文档同步。
- [x] 第一阶段布局整理：标题栏工作区切换、宽幅居中乐谱、紧凑文档 / 录入 / 播放区域和箭头时值控件。
- [x] 第二阶段谱面整理：复用 Trainer 垂直谱表几何，并增加插入位置的试音音高与时值预览。
- [x] 编辑交互整理：插入 / 当前双行操作区、试音替换当前音高、谱面下方播放器及可输入的 BPM ±10 控件。
- [x] 可编辑的常用拍号、小节线与跨小节延音同步；播放和编辑光标各自使用安全区横向跟随。

### 后续方向（尚未实现，需另行确定优先级）

- [ ] 原曲音频导入、降速和区间循环，辅助听音扒谱。
- [ ] 调性、更多节拍 / 时值及多声部编辑。
- [ ] 同一音乐内容显示为简谱；吉他六线谱需弦位 / 品位选择与人工调整。
- [ ] 音频时钟调度、谱面自动分行与排版完善。

当前限制和技术债详见 [SCORE_EDITOR.md](SCORE_EDITOR.md) 与 [CHANGELOG.md](CHANGELOG.md)。
以下保留既有发布版本和各阶段的历史范围；历史条目中的“不实现”仅指对应阶段。

## 当前版本

v0.5.0 Music Notation Studio / Score Editor（Score Editor 第一版已发布）

- 第 3.1 阶段：双八度键盘，已完成
- 第 3.2 阶段：声音控制，已完成
- P3-003：应用主布局，已完成
- P3-004：高音谱表实时音符显示，已完成
- P4-001：完整 88 键钢琴，已完成
- P4-002：输入系统重构，已完成
- P4-003：Web MIDI 技术验证，已完成
- P4-004：MIDI 输入接入，已完成
- P4-005：原生 Bluetooth LE MIDI 支持，已完成（ES120G 已验证）
- P5-001：主页面布局重构，已完成
- P5-002：完整 Grand Staff，已完成
- P5-003：主界面交互布局重构，已完成（含第二轮 UI 整改）
- P5-004：主题系统与乐谱视觉重设计，已完成
- P6-001：Note Event 与基础练习框架，已完成
- P6-002：Note Practice Timeline 基础练习模式，已完成
- P6-003：Practice Canvas 与 Note Timeline 优化，已完成
- P6-004：Practice Target Lifecycle 状态模型优化，已完成
- P6-005：Chord Model 与基础和弦识别，已完成
- P6-006：Chord Practice 基础练习，已完成
- P6-007：Application Settings 持久化，已完成
- 键盘音名显示模式，已完成
- 当前电脑键盘白键使用 `A` 到 `'`，默认 A=`E3`、H=`C4`
- 完整 88 键键盘已支持基础 USB MIDI 和 Bluetooth LE MIDI Input 接入

## P5 阶段状态

P5 Complete
Release: v0.4.0-alpha

## P6-001：Note Event 与基础练习框架

状态：已完成

已完成：

- [x] 建立统一 Note Event Factory，集中管理 NoteEvent 创建、结束和持续时间。
- [x] 保留 `pressedNotes`，与 NoteEvent 分别承担实时状态和音乐事件职责。
- [x] 增加 Grand Staff 下方独立 Note Info 区域，支持 Off、Letter、Solfege 显示模式，默认使用 Letter。
- [x] 将 Key Labels 的 C Notes 兼容迁移为 Letter，并新增 Solfege；默认改为 White Keys。
- [x] 增加基于 MIDI Number 比较的 Practice Task、Practice Session 和 Practice Evaluator 基础类型。

设计边界：

- 不实现完整 Practice UI、Recording、Playback、Chord Recognition、Scale Analysis 或音乐理论分析。
- 不修改 `staff.ts`、Grand Staff Pitch Model、Theme System、Browser Sound、MIDI Parser 或 Bluetooth MIDI Parser。
- 不处理多输入源同音符的 ownership / reference counting 问题。

## P6-002：Note Practice Timeline 基础练习模式

状态：已完成

已完成：

- [x] 增加 Free Play / Practice 模式切换入口。
- [x] 建立 C3-C5 音域的静态 4/4 Practice Timeline，每个 Beat 一个 Note。
- [x] 增加稳定的 PracticeTimelineNote ID 和 Cursor。
- [x] 让 Grand Staff 直接承载横向静态练习时间轴，并保持目标音符与实际按下音符分离。
- [x] 通过 NoteEvent 和 PracticeController 判断正确输入并推进 Cursor。
- [x] 正确输入推进下一个目标，错误输入保持当前目标并提供反馈。

设计边界：

- 不实现 Chord Practice、Scale Practice、Recording、Playback、节奏判断、Tempo 或动态滚动。
- 不修改 Input Layer、Keyboard、Mouse、USB MIDI、Bluetooth MIDI、Piano 或 Browser Sound 逻辑。
- 不处理 Note Label 与 Grand Staff 空间布局 Technical Debt。

## P6-003：Practice Canvas 与 Note Timeline 优化

状态：已完成

已完成：

- [x] 将 Practice Phrase 扩展为 4 个 Measure、16 个 Note。
- [x] 在 Grand Staff 内横向排列完整 Practice Phrase，不增加独立 Timeline 面板。
- [x] 增加 Future、Current、Completed 三种目标音符视觉状态。
- [x] Practice 模式下让 Pressed Note 对齐当前目标位置，Free Play 保持原有位置逻辑。
- [x] 增加 Grand Staff 上方的 Hide、C、C4 音名显示模式。
- [x] 增加白键上下边界、Note Pool 和 Note Name Practice Settings。
- [x] 增加轻量 Measure 分隔线，且不参与 Cursor 或 Practice Logic。

设计边界：

- 不实现节奏判断、Tempo、音符时值判断、动态滚动、MIDI 文件导入、Chord Practice 或左右手识别。
- 不修改 Input Layer、Keyboard、Mouse、USB MIDI、Bluetooth MIDI、Piano 或 Browser Sound 逻辑。
- 不处理极端音域下的音名避让和 Note Label Technical Debt。

## P6-004：Practice Target Lifecycle 状态模型优化

状态：已完成

已完成：

- [x] 增加 Pending、Matching、Completed、Waiting Release 的 Target 生命周期模型。
- [x] 正确 Note On 只完成当前 Target，不立即推进 Cursor。
- [x] 当前 Target 所有 Required Notes 对应的 NoteEvent Release 后才推进 Cursor。
- [x] 增加当前 Target 的 `eventId`、MIDI Number 和输入来源 Ownership。
- [x] 等待 Release 阶段忽略提前输入的下一个 Target。

设计边界：

- 不实现 Chord Practice UI、Chord Generator、节奏判断、Tempo、Duration Score 或左右手识别。
- 不修改 Input Layer、Keyboard、Mouse、USB MIDI、Bluetooth MIDI、Piano、Grand Staff 或 MIDI Parser。
- 多输入源在 Input Layer 层面的 ownership / reference counting 继续作为既有 Technical Debt 保留。

## P6-005：Chord Model 与基础和弦识别

状态：已完成

已完成：

- [x] 建立独立的 `Chord` 数据模型，支持 Major Triad 和 Minor Triad。
- [x] 建立纯 `analyzeChord(notes)` 分析函数，基于 MIDI Number 归一化 Pitch Class。
- [x] 支持重复八度音去重、和弦转位识别和固定升号命名。
- [x] 将有效和弦结果接入 Grand Staff 内部辅助信息区域，显示 `C`、`Am` 等基础名称。

设计边界：

- Chord 是 Note Collection 的分析输出，不作为新的输入类型，也不接入 Practice Target。
- 仅支持 Major Triad 和 Minor Triad；不实现 Slash Chord、七和弦、调性分析、左右手分析或缺音推断。
- 不修改 Input Layer、NoteEvent、PracticeController、Piano、Audio、MIDI / Bluetooth 数据流或 Grand Staff 几何。

## P6-006：Chord Practice 基础练习

状态：已完成

已完成：

- [x] 将 Practice 时间轴统一为 `targetNotes[]`，Note 和 Chord 共用同一时间位置与 Target Lifecycle。
- [x] 增加 Practice Type：`Note` / `Chord`。
- [x] 基于当前 Note Bound 生成白键 Root Position Major / Minor Triad。
- [x] 要求 Chord Target 的所有 Required Notes 同时 active / matched 后才进入 Completed。
- [x] Chord Target 完成后等待全部 Required Notes Release，再推进 Cursor。
- [x] 在 Grand Staff 同一时间位置显示多个目标音符和现有 Chord Symbol。

设计边界：

- Chord Practice 不使用 Note Practice 的 All、White Only、Black Only Note Pool；Chord Pool 后续单独设计。
- 当前仅生成白键 Root Position Major / Minor Triad，不生成黑键和弦、转位或其他和弦质量。
- 不修改 Input Layer、NoteEvent、MIDI / Bluetooth、Audio、Piano 或 Grand Staff 音乐几何。

## P6-007：Application Settings 持久化

状态：已完成

已完成：

- [x] 新增版本化 `AppSettings` 模型，集中管理 Theme、Key Labels、Web Sound、Note Display 和 Practice Settings 偏好。
- [x] 新增 Settings Context 与 localStorage 存储层；加载时可合并默认值、校验枚举和容错损坏数据。
- [x] 支持默认开启的 Auto Save、手动 Save 和 Reset Settings；设置修改始终立即作用于当前 UI。
- [x] 新增 Settings Anchored Popover，并统一 Theme、Piano、Grand Staff、Practice 与 Web Sound 的设置入口。
- [x] Settings 标题栏提供固定宽度的 Auto Save On/Off 状态按钮、Save 和 Reset 操作。

设计边界：

- 不持久化 Keyboard Base、pressedNotes、MIDI / Bluetooth 连接状态、Practice Cursor / Phrase / Result、NoteEvent、Recording 或 History。
- 不修改 Input Layer、Keyboard / Mouse、USB MIDI、Bluetooth MIDI、Practice Lifecycle、Chord Analyzer 或底层音频架构。

## Technical Debt

### 五线谱 Note Label 显示布局优化

当前 Note Display 已支持音名辅助显示，但 Note Label 与 Grand Staff 的空间关系仍需要进一步优化。

当前问题：

- Note Label 与音符、加线之间的布局规则未完全确定；
- 极端音域（A0-C8）下可能影响谱面空间；
- 多音、和弦、左右手显示场景下需要重新设计。

后续优化方向：

- 保持 Note Label 与对应 Note 的关联关系；
- 避免覆盖五线谱线条、音符头和 Ledger Line；
- 支持多音同时显示；
- 支持和弦、左右手等扩展场景；
- 根据音符位置进行自适应布局。

暂不影响当前 P6-001 功能验收。

## v0.1.0 钢琴核心 ✅

已完成：

- 虚拟钢琴键盘
- 白键和黑键
- 电脑键盘输入
- 鼠标输入
- Web Audio 音频引擎
- 多音同时播放
- 基础界面

---

# v0.4.0-alpha 钢琴训练工具

目标：

从“虚拟钢琴”升级为“钢琴训练工具”。

---

## 第 3.1 阶段：双八度键盘

状态：

- [x] 已完成

目标：

将当前单八度键盘扩展为双八度。

任务：

- [x] 升级钢琴音符数据模型
- [x] 增加八度信息
- [x] 支持 C4-B5 两个八度
- [x] 扩展电脑键盘映射
- [x] 保持现有输入系统

当前电脑键盘白键从 `A` 到 `'`，黑键候选位为 `WERTYUIOP[`。默认基准音为
`E3`，因此 H 键对应中央 C（C4）。不存在钢琴黑键的位置不生成映射，
未映射的琴键保留给后续 MIDI 输入。

设计原因：

当前音符模型只有：

C D E F G A B

无法区分：

C3 / C4 / C5

因此需要升级音符数据结构。

---

## 第 3.2 阶段：声音控制

状态：

- [x] 已完成

目标：

增加电脑声音控制。

任务：

- [x] 增加声音开启/关闭开关
- [x] 保持输入逻辑与音频输出逻辑分离

浏览器声音默认开启。关闭后不播放声音，但琴键动画、鼠标输入和电脑键盘输入保持正常。

设计原因：

部分 MIDI 键盘拥有自己的音源。

用户应当能够选择：

- 使用电脑生成的声音
- 使用外部 MIDI 设备的声音

---

## 第 3.3 阶段：界面改进

状态：

- [ ] 进行中

目标：

将 Demo 界面升级为完整应用。

任务：

- [x] 增加应用标题
- [x] 搭建整体布局
- [x] 增加控制面板
- [ ] 改进视觉反馈
- [ ] 增加模式选择

P3-003 已完成基础布局、Grand Staff 占位区域和 Status Bar。Practice Mode 和
Metronome 当前仍为占位控件，MIDI 已由 P4-003 增加连接入口和独立技术验证面板。

---

## 第 3.4 阶段：视奏模式

状态：

- [ ] 进行中

目标：

增加五线谱训练。

任务：

- [x] 显示高音谱表和当前按下音符
- [x] 将 C4-B5 音符映射到音头位置
- [x] 同步键盘按下状态和五线谱显示

P3-004 第一版只绘制高音谱表和实心音头，仅支持升号（♯）。不包含低音谱表、降号（♭）、重升号、重降号、符干、拍号、小节线、动画、滚动或历史记录。

后续考虑：

- 增加低音谱表
- 增加变音记号
- 评估是否集成 VexFlow 乐谱渲染库

---

# 第 4 阶段：完整钢琴

## P4-001：扩展至完整 88 键

状态：

- [x] 已完成

已完成：

- [x] 支持 A0-C8 共 88 个琴键
- [x] 保持白键、黑键排列
- [x] 支持鼠标点击全部琴键
- [x] 保持 Browser Sound 正常
- [x] 保持当前高音谱表响应
- [x] 保持现有整体布局
- [x] 增加隐藏、白键、C 音和全部四档音名显示模式

当前 88 键键盘在 Piano 区域内横向滚动，保持现有琴键尺寸和整体布局。

电脑键盘基准音可以在底部 Input & Piano Dock 下拉菜单中选择合法的自然音基准，范围为
`A0-G6`。左右箭头以一个八度（12 个半音）为单位移动基准音，键盘白键和
黑键候选位布局保持不变。

---

## P4-002：输入系统重构

状态：

- [x] 已完成

已完成：

- [x] 建立统一 Input Layer，提供 `pressNote()` 和 `releaseNote()`
- [x] 建立 Keyboard Mapper，将固定白键和黑键候选位映射到当前音符范围
- [x] 建立 Keyboard Controller，负责浏览器键盘事件和活动键释放
- [x] 支持通过基准音下拉菜单选择任意合法自然音基准
- [x] 在 Input & Piano Dock 使用左右箭头按八度移动基准音
- [x] 在 Status Bar 显示当前映射范围
- [x] 切换基准音时释放仍按下的电脑键盘音符
- [x] 保持鼠标、Browser Sound、Grand Staff、88 键钢琴和音名显示正常

职责边界：

- Input Layer 不感知输入来源、键盘布局或八度范围。
- Keyboard Controller 负责键盘事件、当前基准音和键盘来源的释放逻辑。
- Keyboard Mapper 只负责白键顺序、黑键候选位置到音符的计算。

本阶段不包含 MIDI、Playback、Practice Mode、Metronome 或 Toolbar 整体重构。

---

## P4-003：Web MIDI 技术验证

状态：

- [x] 已完成

已完成：

- [x] 检测 Web MIDI API 支持情况
- [x] 通过浏览器标准流程请求 MIDI 权限
- [x] 获取并显示 MIDI Input 的设备名称、制造商和连接状态
- [x] 支持用户选择并连接一个 MIDI Input
- [x] 连接成功后在 Status Bar 显示设备连接状态
- [x] 在 Console 输出 Note On、Note Off、Note Number 和 Velocity

明确不包含：

- 不接入 Input Layer
- 不驱动 Piano、Grand Staff 或 Audio
- 不支持多个 MIDI Input 同时监听
- 不支持自动连接、Bluetooth MIDI、MIDI Output、Sustain Pedal 或 Velocity 处理

---

## P4-004：MIDI 输入接入

状态：

- [x] 已完成

已完成：

- [x] 建立 MIDI Input 到 Input Layer 的统一数据流
- [x] 增加 MIDI Note Number 与 Piano Note 的双向转换接口
- [x] 支持 Note On、Note Off 和 Note On + Velocity 0
- [x] 支持 MIDI 多键同时按下
- [x] 防止重复 Note On、重复 Note Off 和设备断开卡键
- [x] MIDI 输入驱动 Piano、Grand Staff 和 Browser Sound
- [x] 保持 Browser Sound 开关行为不变

明确不包含：

- 不支持 MIDI Velocity 响应
- 不支持 Bluetooth MIDI、MIDI Output、Sustain Pedal、Aftertouch、Pitch Bend 或 Program Change
- 不处理 Keyboard、Mouse、MIDI 同时触发同一个音符时的来源归属冲突

技术债：

当前 Input Layer 按音名管理状态。当 Keyboard、Mouse、USB MIDI、Bluetooth MIDI
同时按下同一个音符时，释放顺序可能产生状态冲突。后续可通过 Input Source 或引用计数
机制解决，本阶段不处理该问题。

---

## P4-005：原生 Bluetooth LE MIDI 支持

状态：

- [x] 已完成

已完成：

- [x] 检测 Web Bluetooth 支持和安全上下文
- [x] 通过浏览器原生设备选择窗口扫描并选择 BLE MIDI 设备
- [x] 连接 BLE MIDI Service 和 Data I/O Characteristic
- [x] 解析 BLE MIDI 时间戳、Running Status 和多消息数据包
- [x] 支持 Note On、Note Off 和 Note On + Velocity 0
- [x] Bluetooth MIDI 通过统一 Input Layer 驱动 Piano、Grand Staff 和 Browser Sound
- [x] 支持多键同时按下
- [x] 设备断开后自动释放所有 Bluetooth MIDI 活动音符
- [x] Status Bar 显示 Bluetooth MIDI 设备连接状态
- [x] 通过 ES120G 实机验证连接、Note On、Note Off 和断开释放

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

- `BluetoothMidiController` 负责 Bluetooth 连接、通知接收和调用 Parser。
- `bleMidiParser.ts` 负责 BLE MIDI 时间戳、Running Status 和消息解析。
- `MidiNoteController` 统一负责 MIDI Note 状态、音符转换和 Input Layer 调用。
- USB MIDI 和 Bluetooth MIDI 各自持有独立的 `MidiNoteController` 实例。

明确不包含：

- 不支持 MIDI Output、Sustain Pedal、Aftertouch、Pitch Bend 或 Velocity 响应。
- 不支持自动重连或多个 Bluetooth MIDI 设备同时连接。
- 不处理 MIDI 输入源之间相同音符的归属冲突。
- 不改变现有 Piano、Grand Staff、Browser Sound 和 Input Layer 接口。

技术债：

- 当前 Input Layer 按音名管理状态。
- Keyboard、Mouse、USB MIDI、Bluetooth MIDI 同时按下同一个音符时，释放顺序可能冲突。
- 多输入源同音符引用计数作为后续独立 Issue 处理。

---

## P5-001：重构主页面布局并优化虚拟钢琴显示

状态：

- [x] 已完成

已完成：

- [x] 页面主体扩展为桌面端全宽布局，内容最大宽度约 `1920px`
- [x] Grand Staff 扩展为主要视觉区域，高度约 `320px`
- [x] 88 键虚拟钢琴固定在 viewport 底部
- [x] Main Content 增加与 Piano Dock 共用的底部安全空间
- [x] 52 个白键根据可用宽度自适应显示
- [x] 黑键位置改为基于白键索引的百分比计算
- [x] 默认无需横向滚动即可显示完整 A0-C8
- [x] 保持四种 Key Labels 显示模式
- [x] 保持 Keyboard、Mouse、USB MIDI、Bluetooth MIDI 输入功能

布局结构：

    Header / Toolbar
            ↓
    Main Content
      ├── Grand Staff
      └── Status Bar
            ↓
    Fixed Piano Dock

设计边界：

- Piano Dock 与主内容使用统一的最大宽度体系。
- 黑键位置完全基于白键索引和百分比，不依赖旧版像素宽度。
- Grand Staff 仅扩大容器，保留现有 SVG viewBox 和音符坐标逻辑。
- 不使用全局 `overflow-x: hidden` 掩盖布局溢出。

明确不包含：

- 不实现 Bass Staff、Ledger Lines、Recording、Playback、Practice Mode 或 Metronome。
- 不进行完整视觉主题重设计或移动端专项适配。
- 不修改 Input Layer、MidiNoteController、Browser Sound 或现有音符业务逻辑。

---

## P5-002：完成 Grand Staff

状态：

- [x] 已完成

已完成：

- [x] 绘制统一的 Treble Staff 和 Bass Staff
- [x] 增加 Treble Clef、Bass Clef 和左侧 Grand Staff 连接结构
- [x] 支持完整 A0-C8 音域
- [x] 按 `C4` 分配到高音谱表、`B3` 分配到低音谱表
- [x] 使用统一 `diatonicStep → staffStep` 模型计算音符位置
- [x] 支持高低音谱表上下方完整 Ledger Lines
- [x] 保持升号音符的纵向位置，并在音符左侧显示升号
- [x] 不同实际音高保留独立音符头
- [x] 当前和弦共享主要横向位置，仅在音符碰撞时局部错位
- [x] 保持响应式 SVG、稳定 `viewBox` 和 `preserveAspectRatio`
- [x] 保持 Keyboard、Mouse、USB MIDI、Bluetooth MIDI 和 Browser Sound 数据流

设计边界：

- Grand Staff 只显示当前活动音符，不记录历史音符。
- Ledger Line 按 `staff + staffStep` 去重，但不合并不同实际音高的音符头。
- 不实现音符时值、符干、节奏、调号、录音、播放或练习模式。
- 分谱策略通过独立函数维护，不嵌入 SVG 绘图逻辑。

---

## P5-003：重构主界面交互布局

状态：

- [x] 已完成

已完成：

- [x] Toolbar 仅保留 Practice、Metronome，并统一 Button 风格
- [x] Web Sound 移动到 Input & Piano Dock 右侧，与外部输入设备统一分组
- [x] Key Labels 移动到 Input & Piano Dock，通过锚定 Popover 选择 Hidden、White Keys、C Notes、All 四种模式
- [x] Browser Sound 改为 Active / Inactive Button
- [x] Practice 和 Metronome 保留为 Disabled 占位按钮
- [x] Keyboard Base 移动到 Input & Piano Dock
- [x] USB MIDI、Bluetooth MIDI 移动到 Input & Piano Dock
- [x] 顶部与底部按钮统一高度、内边距、圆角、边框和状态样式
- [x] 状态型按钮统一显示功能名称和当前状态两行文本
- [x] Keyboard Base 与 Keyboard Range 合并为统一的 Keyboard Mapping 控件
- [x] Keyboard Mapping 使用三角方向按钮和完整 Range 按钮，Base 选择放入 Keyboard Base Popover
- [x] Dock 按 Keyboard / Piano 设置与声音、外部输入设备左右分组
- [x] USB MIDI、Bluetooth MIDI 使用统一紧凑状态 Indicator，完整设备名称仅在 Popover 内显示
- [x] MIDI、Bluetooth 管理面板改为锚定触发按钮的 Popover，不进入页面文档流
- [x] Popover 统一支持 Close Button、Escape、外部点击关闭和背景滚动锁定
- [x] Popover 增加尺寸层级、内容留白和 viewport 安全边距
- [x] 增加 Dock Controls 垂直空间，确保按钮边框、圆角与 Piano 区域完整显示
- [x] Grand Staff 通过统一比例放大 SVG 内容，不改变 P5-002 几何模型
- [x] 保持 Keyboard、Mouse、USB MIDI、Bluetooth MIDI、Browser Sound 和 Piano 功能

设计边界：

- 连接状态只映射真实设备连接流程：connecting、connected、disconnected。
- 不修改 Input Layer、MidiNoteController、Keyboard Mapper、Keyboard Controller、
  Web MIDI、Web Bluetooth、BLE MIDI Parser 或 Browser Sound 架构。
- 不实现 Theme、Practice Mode、Recording、Playback、Metronome 或移动端专项设计。

---

## P5-004：主题系统与乐谱视觉重设计

状态：

- [x] 已完成

已完成：

- [x] 增加独立 Theme Token 层，统一管理页面、表面、谱面、谱线、音符和钢琴颜色
- [x] 增加 `system`、`dark`、`light`、`custom` 四种 Theme Mode
- [x] 默认跟随系统明暗偏好，系统模式下自动响应系统主题变化
- [x] 增加 Toolbar Theme 入口和锚定 Popover
- [x] 支持独立调整 Page Background、Score Background、Staff Color、Active Note Color
- [x] 支持 Single / Left-Right Hand Note Color Mode，并为当前无 hand metadata 的场景保留 Active Note Color fallback
- [x] Piano 白键和黑键高亮由统一颜色工具派生，不在琴键组件内维护两套颜色
- [x] Reset 清除 Custom 设置并恢复 Follow System
- [x] 在不改变音高几何模型的前提下整体放大 Grand Staff，并为 A0-C8 保留安全显示空间

设计边界：

- 不修改 Input Layer、Keyboard Mapper、Keyboard Controller、MIDI、Bluetooth MIDI、Browser Sound 或 Keyboard Mapping 业务逻辑。
- 不修改 `staffStep`、音高分谱、Middle C 位置和 Ledger Line 计算。
- 不实现左右手音符归属判断；当前没有 hand metadata 时，左右手颜色配置回退到 Active Note Color。
- 不改变 Input & Piano Dock 的布局，不引入移动端专项主题设计。

---

# 后续版本

## v0.3 MIDI 支持

可能包含：

- MIDI 键盘输入
- MIDI力度（Velocity）
- 外部乐器支持
- 完整钢琴键盘范围

---

## v0.4 练习系统

可能包含：

- 随机音符练习
- 正确率统计
- 分数系统
- 反应时间统计

---

# 开发规则

实现功能前：

1. 讨论需求
2. 确认设计方案
3. 开始实现
4. 测试功能
5. 创建 Git 提交
6. 提交开发总结，并记录 `Technical Debt`
7. 等待 Product 验收和 Tech Lead Review
8. 验收通过后关闭 Issue

每次提交总结必须明确说明：

- 修改了什么
- 没有修改什么
- 如何验证
- `Technical Debt`：填写“无”或列出明确的技术债

避免：

- 大规模、无控制的重构
- 添加不必要的依赖
- 过早解决未来问题
