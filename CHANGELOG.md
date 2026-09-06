# 变更日志

本文件记录 Piano Trainer 各版本的重要功能与变更。

## [v0.5.0-alpha] - 2026-09-06

### Score Editor 乐谱定位与横向节奏布局

- Keyboard Dock 控件改为紧凑单行布局：移除 Keyboard Mapping 可见标题，缩短 Labels 文案，并用右侧状态灯表示 Sound 与统一 MIDI 状态；USB / Bluetooth MIDI 在同一 MIDI 面板中分别管理。
- 固定 Labels、Sound 与 MIDI 按钮宽度，避免模式或状态文字改变时产生布局抖动；Keyboard Mapping 选择弹窗改用更紧凑的七列选项并统一标题。
- 将 Labels、Sound 与 MIDI 的固定宽度调整为可完整容纳文案；Keyboard Mapping 改为每行七个接近正方形的音域按钮，对齐一个八度的七个白键。
- Keyboard Dock 最右侧新增与播放控件同规格的折叠按钮；收起时隐藏钢琴键、同步缩短底部 Dock 与页面预留空间，并保留所有输入功能，状态会在刷新后恢复。
- Dock 折叠与展开增加高度、透明度和页面预留空间的同步过渡动画，并遵循系统的减少动画偏好。
- Editor 工作区标题统一为 `Score Editor`。
- 乐谱横向布局改为按拍格分配空间：长时值占据更多宽度，短时值维持紧凑且可读的最小间距。
- 分离编辑与播放光标的视觉标记；编辑位置切换时自动居中，播放时仅在播放光标越出中央安全区后横向跟随。
- 修复播放光标在安全区边缘反复触发平滑滚动而导致乐谱横向抽搐的问题。
- 编辑光标改为使用同一中央安全区，点击安全区内的内容不再强制居中；删除当前事件后自动定位到其后的事件，便于连续编辑。
- 短时值正式音符与待写入预览改为在各自时值格内居中；乐谱底部用竖排分数加 `b` 表示拍数。
- 编辑栏时值改为 `1/8 音符 | 1/2 拍` 的线性分数格式，并压缩两行控件的纵向间距、强化输入／当前标签的可读性。
- 右侧辅助操作扩展为“回到开头 / 回到末尾 / 删除全部 / 删除当前”固定 2×2 网格；删除全部采用再次点击确认，任何其他操作都会取消确认状态。
- 修复紧凑编辑栏将“输入时值 / 当前时值”压缩为逐字换行的问题；时值标签和最长分数文案均保持单行。
- 收紧时值数值区的冗余宽度，并让右侧辅助按钮复用写入／替换按钮的两列尺寸、间距和高度。
- Edit Dock 移除输入音／当前音下方的辅助小文本，将“第几项／第几拍”和末尾插入状态迁移到拍号旁的独立编辑位置列；两行音高内容保持单行，并同步压缩 Dock 纵向高度。
- 新建、保存、导出、打开文件统一固定规格；未保存时“保存”使用主题高亮色，保存后恢复，移除会改变按钮宽度的星号文本。
- 正式音符统一在完整时值格内居中；待写入预览保持当前编辑槽位的宽度，末尾新增默认使用四分音符槽位。
- 统一事件悬停、选中与键盘焦点的边框几何；补充分数拍数标签的 SVG 横线描边，并恢复两组操作按钮一致的行间距。
- 编辑区八个操作合并为单一等宽 4×2 网格，文字统一水平／垂直居中；乐谱时值格、小节／插入边界、正式音符、预览和事件框改用同一坐标基准。
- 播放区新增“回到开头”按钮，并将“定位到当前音符”从准星替换为播放光标与音符图标。
- 回到开头图标改为完整的竖条加左向三角形；统一操作矩阵恢复写入／替换与定位／删除之间的竖向功能分隔线。
- Play Dock 重组为进度、播放操作和 BPM 三个固定功能组：进度条与拍位保持同一行，播放与 BPM 控件统一为 34px 规格，并在两页共用相同的分隔和间距。
- 末尾待写入 `+` 区改为完整四分音符宽度，并扩展谱面末端空间以容纳该时值格。
- Editor 谱号与拍号记号改为基于共享高低音谱几何定位；新增编辑栏左侧拍号预设控件，支持 2/4、3/4、4/4、5/4、6/8、9/8、12/8，并同步小节线、跨小节显示和导入校验。
- 调整 Editor 谱号至与当前 SVG 比例匹配的尺寸；拍号控件置于录入编辑栏最左侧，应用首次打开默认进入 Score Editor。
- 事件的悬停、选中与焦点边框改为按完整高低音双谱表计算，覆盖两组五线与安全余量，同时不覆盖上方小节编号或下方拍数标尺。

### 顶部控制与乐谱边界调整

- Theme 与 Settings 移至标题栏，紧贴 Trainer / Editor 选项卡左侧并在两个工作区可用。
- 统一 Trainer 与 Editor 的应用标题字号与行高。
- 重新平衡 Editor 乐谱纵向边界，为最高音 C8 及其符干保留顶部可见空间，并缩减最低音与时值标签之间的留白。
- 页面主滚动条改为隐藏但保持可滚动；打开设置浮层不再锁定背景滚动或改变页面宽度。
- Settings 移除重复的 Theme、Note Display 和 Practice Settings；Theme 面板补充 Follow System 选项。
- Trainer 调整为与 Editor 对应的上方练习控制区、中部大谱表和下方状态区，练习控件移入谱表卡片顶部。
- Trainer 在 Practice 模式新增练习短句回放，可播放当前 4 小节目标并拖动播放进度；自由弹奏模式下控件禁用。
- Trainer 回放区改为复用 Editor 的完整播放控件，并在谱面显示连续播放光标；状态栏移回谱表卡片外。
- Trainer 与 Editor 的工作区画布统一为 1760px 最大宽度，使谱表、控制区、播放器和状态区的左右边界对齐。
- Editor 白键默认不再显示还原号；当前仅为黑键显示升号，后续再结合小节内临时记号规则补充必要的还原号。

### 乐谱编辑布局调整

- 将 Trainer / Editor 工作区切换合并到应用标题栏，并随工作区显示 `Piano Trainer` 或 `Piano Editor`。
- 合并乐谱名称、文档摘要、文件操作和撤销 / 重做为紧凑文档栏。
- 扩大并居中乐谱工作区，录入控制和选中音符工具在可用宽度内居中排列。
- 写入时值和选中音符时值改为左右箭头步进，移除对应的下拉框。
- 压缩 Editor 页眉、录入栏、属性栏、播放区和状态信息的纵向占用。
- Trainer 与 Editor 复用同一大谱表垂直几何关系，高低音谱内侧线相隔 4 个谱位，中央 C 位于正中。
- 最近试音会按当前待写入时值在实际插入锚点显示高亮音符；预览不参与谱面宽度计算，试音或切换时值不会推移已有内容。
- 末尾 `+` 写入框改为依据大谱表上下边界计算纵向中心，修复谱表高度调整后位置偏低。
- 界面明确区分“待写入时值”和已有事件的“选中音符时值”。
- 已有事件的选择态由整列背景改为音符着色与短标记，避免和待写入高亮叠加后影响谱面阅读。
- 编辑操作整理为上下对齐的“插入 / 当前”两行：输入音与输入时值负责新增，当前音与当前时值负责修改；移除逐音音高下拉框，改为使用最近试音替换。
- 删除与回到末尾保留在当前事件辅助区；未选择事件时保持布局并禁用相关操作。
- 两行编辑操作改为共用固定四列网格，音高、时值、音符和休止符操作严格上下对齐；辅助操作位于网格右侧并跨两行居中，不新增纵向空间。
- 插入位置与当前事件位置收进音高单元格；窄屏保持固定矩阵并横向滚动，不再因内容或宽度改变控件位置。
- 输入音及插入预览固定使用主题强调色，当前音及谱面选中事件改用主题蓝色，避免默认主题中音符色与强调色相同而无法分辨。
- 播放控制移至乐谱正下方，进度条右侧使用单个播放 / 暂停按钮；BPM 支持直接输入，并增加每次 ±10 的按钮。
- “定位播放”从当前事件辅助操作移入播放器，改为播放按钮旁的准星图标；仍定位到谱面当前选中事件，没有选择时禁用。
- 播放与定位按钮统一为 34px 方形按钮和同规格 SVG 图标；右侧辅助列改为等宽的“回到末尾 / 删除当前”上下排列，分别对应输入行与当前行。

验证：`npm run build`、`npm run lint`、`npm test`（13 项）通过；浏览器验证标题切换、布局、时值步进、中央 C、非挤压式谱面预览与末尾写入框居中。

Technical Debt：沿用乐谱编辑第一版记录的谱面几何、排版与播放调度事项，无新增技术债。

### 乐谱编辑第一版（2026-09-05）

- 新增 Trainer / 乐谱编辑选项卡；共用固定底部 Keyboard、USB MIDI 和 Bluetooth MIDI。
- 新增独立 ScoreDocument，以 MIDI 音高、起始拍位、时值和稳定事件 ID 保存音乐内容。
- 支持试音后写入单音或和弦、五种时值、休止符、插入、音高与时值修改、删除、撤销和重做。
- 新增可选择的双谱表编辑视图，支持加线、升号 / 还原号、符干 / 符尾和跨小节延音。
- 新增播放、暂停、停止、速度调整、播放进度条拖动和从选中音符定位。
- 回放经 Input Layer 的 playback 来源进入独立声音命名空间，显示底部琴键高亮，不触发练习或改变最近试音。
- 新增本地手动保存、刷新恢复、JSON 导入导出、文件校验、未保存离页提醒及可撤销的新建 / 导入。
- 编辑区和 Trainer 保留各自状态；按住实奏琴键时需先松键才能切换，切换离开编辑区或隐藏网页时暂停回放。
- 修复在文本框 / 下拉框打字、使用快捷键或键盘重复事件时误触琴键；音频忽略同一声音重复启动，避免孤立振荡器。
- 新增 12 项 Node 自动化测试和使用文档；同步检查更新 README、项目上下文、路线图和本变更记录。

验证：npm test（12 项）、npm run build、npm run lint；浏览器验证写入、和弦、谱面修改、保存恢复、文件导入、暂停定位与选项卡切换。

范围：保留 Trainer 的 PracticeController、目标生命周期、练习生成器、GrandStaff 音乐几何和 MIDI / BLE Parser。
简谱 / 吉他谱转换、原曲音频导入、多声部、MusicXML / MIDI 文件及印刷级排版尚未实现。

Technical Debt：

- 回放使用前台定时器与单调时钟，没有音频时钟的提前调度；高负载时可能有发声抖动，隐藏网页会暂停。
- 乐谱采用基础横向 SVG 排版，密集和弦、自动分行、连梁和精细避让仍需后续完善。
- 暂存一份本地乐谱；多份乐谱使用 JSON 文件管理。v1 支持预设拍号、单声部和升号拼写，扩展调性 / 声部需版本迁移。
- 既有多种实奏输入源同时持有同音的 ownership / reference counting 技术债仍保留；本次仅隔离回放与实奏声音。


### P6-007：Application Settings 持久化

- 新增版本化 AppSettings、默认值、校验与 localStorage 容错存储。
- Theme、Key Labels、Web Sound、Note Display 和 Practice Settings 可在刷新后恢复。
- 增加 Auto Save、手动 Save 和 Reset Settings；设置修改始终立即作用于当前 UI。
- 新增 Settings Anchored Popover，并将 Auto Save、Save、Reset 放入标题栏操作区。
- 不持久化输入状态、设备连接、Keyboard Base 或 Practice 运行时进度。

### P6-006：Chord Practice 基础练习

- 将 Practice 时间轴目标统一为 `targetNotes[]`，Note / Chord 共用同一 Target Lifecycle。
- 增加 Note / Chord Practice Type 选择。
- 基于 Note Bound 生成白键 Root Position Major / Minor Triad。
- 要求和弦目标的所有 Required Notes 同时满足，并在全部释放后推进 Cursor。
- Grand Staff 在同一时间位置显示和弦音符与 Chord Symbol。
- Chord Practice 暂不使用单音 Note Pool，Chord Pool 留待后续设计。

### P6-005：Chord Model 与基础和弦识别

- 增加独立的 `Chord` 数据模型和 `formatChordName()` 显示格式化函数。
- 增加纯 `analyzeChord(notes)`，支持 Major Triad 与 Minor Triad。
- 基于 MIDI Number 归一化 Pitch Class，支持重复八度音去重和转位识别。
- 在 Grand Staff 内部辅助信息区域显示当前有效和弦名称，无有效和弦时立即隐藏。
- Chord 保持为 Note Collection 的分析结果，不接入 Practice Target 或输入架构。

### P6-004：Practice Target Lifecycle 状态模型优化

- 增加 Pending、Matching、Completed、Waiting Release 的 Practice Target 生命周期模型。
- 正确 Note On 只完成当前 Target，不立即推进 Cursor。
- 只有当前 Target 所有 Required Notes 对应的 NoteEvent Release 后才推进 Cursor。
- 增加当前 Target 的 Event Ownership，预留 eventId、MIDI Number 和输入来源信息。
- 提前输入下一个 Target 时保持无效，不影响当前练习目标。

### P6-003：Practice Canvas 与 Note Timeline 优化

- Practice Phrase 扩展为 4 个 Measure、16 个 Note，并直接绘制在 Grand Staff 内。
- 增加 Future、Current、Completed 三种练习目标状态。
- Practice 模式下 Pressed Note 与当前目标位置对齐，Free Play 保持原有显示逻辑。
- 增加 Grand Staff 上方 Hide、C、C4 音名显示模式。
- 增加白键上下边界、Note Pool 和 Note Name Practice Settings。
- 增加仅用于视觉表达的 Measure 分隔线。

### P6-002：Note Practice Timeline 基础练习模式

- 增加 Free Play / Practice 模式切换。
- 增加 C3-C5 音域、固定 4/4、每拍一个音符的静态 Practice Timeline。
- 增加稳定的 Timeline Note ID、Cursor 和基础目标音符反馈。
- 通过 NoteEvent 和 PracticeController 判断正确输入并推进练习目标。
- Grand Staff 直接承载横向静态目标音符序列，当前实际按下音符与当前目标位置对齐并保持数据独立。
- 不包含和弦、节奏判断、动态滚动、Recording 或 Playback。

### P6-001：Note Event 与基础练习框架

- 增加统一 Note Event Factory，记录音符、MIDI Number、Velocity、时间和输入来源。
- 保留 `pressedNotes` 作为 Piano / Grand Staff 的实时状态，不用 NoteEvent 替代。
- 增加 Grand Staff 下方独立 Note Info 区域，支持 Off、Letter、Solfege 显示模式，默认使用 Letter。
- Key Labels 将旧的 C Notes 迁移为 Letter，并新增 Solfege；默认改为 White Keys。
- 增加 Note Practice Task、Practice Session 和基于 MIDI Number 的 Practice Evaluator 基础类型。

Technical Debt：

- 多输入源同时持有同一音符时，Input Layer 尚未实现 ownership / reference counting。

### 五线谱 Note Label 显示布局优化

当前 Note Display 已支持音名辅助显示，但 Note Label 与 Grand Staff 的空间关系仍需要进一步优化。

- Note Label 与音符、加线之间的布局规则未完全确定；
- 极端音域（A0-C8）下可能影响谱面空间；
- 多音、和弦、左右手显示场景下需要重新设计。
- 后续将保持 Note Label 与对应 Note 的关联，避免覆盖五线谱线条、音符头和 Ledger Line，
  并支持多音、和弦、左右手及根据音符位置的自适应布局。
- 暂不影响当前 P6-001 功能验收。

## [v0.4.0-alpha] - P5 阶段发布

### 阶段汇总

- 完成 Desktop Layout 重构，建立 Header、Toolbar、Main Stage、Status Bar 和固定底部 Input & Piano Dock。
- 完成 Complete Grand Staff，支持 Treble / Bass Staff、A0-C8、Ledger Lines、Sharp 和多音实时显示。
- 完成 Main UI Interaction 重构，包括 Keyboard Mapping、Key Labels、Web Sound 和设备入口。
- USB MIDI 与 Bluetooth MIDI 使用统一的 Anchored Popover 管理连接和设备状态。
- 完成 Theme / Appearance System，支持 Dark、Light、Custom、Follow System 和 Reset。
- 使用 Theme Tokens 与 CSS Variables 统一 Page、Score、Staff、Note Semantic Colors。
- Note Color 统一驱动 Grand Staff 音符，并派生 Piano 白键和黑键 Highlight 颜色。
- Grand Staff 在保持 P5-002 Staff Position Model 的基础上完成视觉放大和 A0-C8 安全显示调整。

### Technical Debt

- 多输入源同时持有同一音符时，Input Layer 尚未实现 ownership / reference counting。

## [开发历史汇总]

### 新增

- 扩展虚拟钢琴为 C4-B5 双八度。
- 音符数据增加 `pitchClass` 与 `octave` 信息。
- 根据 MIDI 音高自动计算音符频率。
- 增加从 C4 到 E5 的电脑键盘映射。
- 增加默认开启的浏览器声音开关。
- 增加 Header、Toolbar、Grand Staff 占位、Piano 和 Status Bar 基础布局。
- 增加 C4-B5 高音谱表音头位置映射。
- 增加按下琴键时的高音谱表实时实心音符显示。
- 增加 A0-C8 标准 88 键钢琴数据和界面。
- 增加隐藏、白键、C 音和全部四档琴键音名显示模式。
- 增加 Input Layer、Keyboard Mapper 和 Keyboard Controller。
- 增加电脑键盘白键 `A` 到 `'` 的映射和 `WERTYUIOP[` 黑键候选位。
- 增加基准自然音下拉菜单，可在 `A0-G6` 范围内选择基准音。
- 增加 Toolbar 左右箭头按八度移动基准音的控制。
- 增加 Web MIDI API 支持检测和浏览器权限申请。
- 增加独立 MIDI 面板，支持选择并连接一个 MIDI Input。
- 增加 Device Name、Manufacturer、Connection State 显示。
- 增加连接成功后的 Status Bar 设备状态显示。
- 增加 Note On / Note Off、Note Number、Velocity 的 Console Monitor。
- 增加 `midiNumberToPianoNote()` 与 `pianoNoteToMidiNumber()` 双向转换接口。
- 增加 `MidiInputController`，将 MIDI Note On / Note Off 接入 Input Layer。
- 增加 MIDI 多键状态管理和设备断开时的活动音符释放。
- 增加 Web Bluetooth 支持检测和 BLE MIDI 设备连接。
- 增加独立 Bluetooth MIDI 面板，使用浏览器原生设备选择窗口选择一个设备。
- 增加 BLE MIDI Service 和 Data I/O Characteristic 连接处理。
- 增加 BLE MIDI 时间戳、Running Status 和多消息数据包解析。
- 增加 `BluetoothMidiController` 和统一的 `MidiNoteController`。
- 增加 Bluetooth MIDI 设备连接状态和断开后的活动音符释放。
- 完成 ES120G Bluetooth MIDI 实机连接、演奏和断开释放验证。
- 增加桌面端全宽主布局和固定底部 88 键虚拟钢琴区域。
- 增加 Grand Staff 大尺寸主区域和页面底部安全空间。
- 增加 88 键白键自适应宽度及黑键比例定位。
- 增加完整 Grand Staff，包括高音谱表、低音谱表、谱号和统一连接结构。
- 增加 A0-C8 全音域自动分谱和高低音谱表 Ledger Lines。
- 增加基于 diatonicStep 和 staffStep 的统一音高位置模型。
- 增加统一 Toolbar Button、Key Labels Popover 和输入设备管理 Popover。
- 增加底部 Input & Piano Dock，集中显示 Keyboard Mapping、Key Labels、Web Sound、USB MIDI、Bluetooth MIDI 和 88 键 Piano。
- 增加 USB MIDI、Bluetooth MIDI 的紧凑连接状态 Indicator。
- 增加 Theme Token 层、Dark / Light / Custom 主题预设和 Toolbar Theme Popover。
- 增加跟随系统明暗偏好的 `system` 模式，以及清除自定义颜色并恢复系统主题的 Reset。
- 增加页面背景、谱面背景、谱线颜色、活动音符颜色和左右手颜色配置。
- 增加统一钢琴高亮颜色派生逻辑，分别生成白键和黑键高亮变体。

### 变更

- 电脑键盘白键使用 `A` 到 `'`，黑键按相邻白键位置进行偏移，不存在钢琴黑键的位置不生成映射。
- 双八度黑键位置根据数据自动布局。
- 关闭浏览器声音时停止活动音符，但保留输入和琴键动画。
- Grand Staff 第一版仅显示当前按下的音符，不记录历史音符。
- 第一版高音谱表按同一音头位置显示自然音和升号音；P5-002 改为保留不同实际音高的独立音符头，并继续绘制升号（♯）。
- 88 键键盘在 Piano 区域内横向滚动，保留现有琴键尺寸。
- 电脑键盘默认基准音为 `E3`，使 H 键对应中央 C（C4）；基准音可通过 Keyboard Base Popover 切换，三角按钮每次移动 12 个半音。
- 切换电脑键盘基准音时释放当前仍按下的电脑键盘音符。
- 鼠标输入和电脑键盘输入统一经过 Input Layer；Input Layer 不感知具体输入来源。
- Keyboard、Mouse、USB MIDI 和 Bluetooth MIDI 均通过同一个 Input Layer 驱动
  Piano、Grand Staff 和 Browser Sound。
- Layout 重构仅调整页面空间关系，不改变输入、音频和 Grand Staff 业务逻辑。
- Grand Staff 保留不同实际音高的独立音符头；相同 staffStep 的 Ledger Line 可以去重，
  和弦音符共享主要横向位置，仅在视觉碰撞时局部错位。
- MIDI / Bluetooth 连接状态仅映射真实连接流程，不改变 Web MIDI、Web Bluetooth 或 Input Layer 数据流。
- Grand Staff 仅通过统一比例放大显示，不改变 P5-002 的音高和谱面几何模型。
- 顶部 Toolbar 简化为 Practice、Metronome；Key Labels 移到底部 Input & Piano Dock。
- 顶部与底部按钮统一尺寸和双行状态样式，Dock 按应用设置与外部输入设备左右分组。
- Key Labels、USB MIDI、Bluetooth MIDI 面板改为靠近触发按钮的锚定 Popover，支持外部点击和 Escape 关闭。
- Web Sound 从顶部 Toolbar 移到 Input & Piano Dock 右侧，并保持原有声音开关逻辑。
- Keyboard Base 与 Keyboard Range 合并为统一的 Keyboard Mapping 控件。
- Keyboard Mapping 中间按钮直接显示完整 Range，点击后通过 Keyboard Base Popover 选择 Base。
- Keyboard Mapping 左右移动按钮改为统一样式的三角方向图标，并移除原生下拉框外观。
- Popover 增加紧凑 / 宽面板尺寸、内容留白和 viewport 安全边距；Dock Controls 增加垂直空间。
- Grand Staff 在保持 P5-002 音乐坐标模型不变的前提下整体放大，并扩大 A0-C8 极端音符的 SVG 安全区域。

### 未修改

- 未加入 Playback、Practice Mode 或 Metronome 功能。
- 未支持多个 MIDI Input 同时监听、MIDI Output、Sustain Pedal 或 Velocity 响应。
- Bluetooth MIDI 暂不支持自动重连、多个 BLE 设备和其他 MIDI 消息类型。
- 未处理 Keyboard、Mouse、USB MIDI、Bluetooth MIDI 同时触发同一个音符时的来源归属冲突；
  多输入源同音符引用计数作为后续独立 Issue。
- 未实现 Recording、Playback、Practice Mode、Metronome 逻辑或移动端专项适配。
- 未修改钢琴、Grand Staff、Browser Sound 的既有音频和显示架构。
- 未修改 Input Layer、Keyboard Mapper、Keyboard Controller、MIDI / Bluetooth MIDI 数据流或 Browser Sound 业务逻辑。

## [0.1.0] - 钢琴核心

### 新增

- 虚拟钢琴键盘。
- 白键与黑键显示。
- 电脑键盘输入。
- 鼠标输入。
- Web Audio 实时声音反馈。
- 多音同时播放。
