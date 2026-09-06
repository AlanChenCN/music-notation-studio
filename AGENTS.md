# Music Notation Studio Agent Guide

这份文件是新 Agent 接管项目时的入口。当前产品名为 Music Notation Studio，仓库名为 `music-notation-studio`；它只记录当前有效的开发上下文，历史细节以各文档的历史章节为准。

## 当前状态

- 当前版本：`v0.6.0`（开发中）。
- 当前分支：`main`。
- 应用默认打开 `Score Editor`，`Trainer` 作为独立工作区保留。
- Score Editor 已支持单声部音符、和弦、休止符、五种时值、常用拍号、编辑光标、播放光标、播放定位、BPM 调整、本地保存和 JSON 导入导出。
- Editor、Trainer 共用大谱表几何、输入层、键盘 Dock 和 MIDI 面板。

- Trainer 新增乐谱跟练：接收 Editor 当前副本或载入已保存乐谱，支持小节范围、循环与音高计分；随机练习继续保留。详见 `TRAINER.md`。

## 推荐阅读顺序

1. `README.md`：产品范围、运行方式和当前版本概览。
2. `PROJECT_CONTEXT_CN.md` 的“当前版本”“项目结构”“开发原则”“当前限制”。
3. `SCORE_EDITOR.md`：Editor 工作流、数据格式、代码边界、验证方式和 Technical Debt。
4. `ROADMAP.md` 顶部的乐谱工具路线；文档后部是历史阶段，不代表当前限制。
5. `CHANGELOG.md` 最新版本章节：最近的 UI 和交互变更。

## 代码入口

| 区域 | 主要文件 | 边界 |
| --- | --- | --- |
| 应用工作区和输入路由 | `src/App.tsx` | Trainer / Editor 切换、共享输入、播放音频路由 |
| 乐谱数据 | `src/score/scoreModel.ts` | ScoreDocument、事件时值、连续拍位、导入校验 |
| 乐谱绘制 | `src/score/ScoreStaff.tsx`、`src/score/notation.ts` | SVG 双谱表、时值排版、选择和预览 |
| 谱表几何 | `src/data/staffGeometry.ts` | Trainer / Editor 共享的高低音谱布局和中央 C 位置 |
| 乐谱回放 | `src/score/scoreTransport.ts` | 进度、暂停、定位、播放声音生命周期 |
| Editor UI | `src/score/ScoreEditor.tsx`、`src/score/score.css` | File Dock、Edit Dock、Play Dock、保存和历史 |
| Trainer 回放 | `src/practice/PracticeTransport.tsx` | Practice 目标短句回放，复用 Play Dock 样式 |
| 输入与键盘 | `src/components/InputPianoDock.tsx`、`src/input/` | Keyboard、Mouse、USB MIDI、Bluetooth MIDI 和 Dock 状态 |
| 设置和主题 | `src/settings/`、`src/theme/` | 持久化设置、Theme、Follow System 和自动保存 |

## 不应破坏的设计约束

- 输入音和当前音是两条独立的编辑状态；最近试音不能直接改写已存在事件。
- 编辑光标和播放光标必须独立；两者都使用安全区跟随，不能恢复为强制居中或互相驱动。
- Editor 和 Trainer 使用同一套大谱表纵向几何，中央 C 位于两谱表内侧之间。
- File Dock 左侧保留名称输入和摘要，文件操作与撤销 / 重做整体右对齐。
- Edit Dock 的输入 / 当前两行、拍号、编辑位置、时值和辅助按钮必须保持固定位置；数字状态使用固定宽度，避免内容变化推动其他控件。
- Play Dock 的进度、播放操作和 BPM 分组必须保持单行优先，并在 Editor / Trainer 间共用设计语言。
- Keyboard Dock 的收缩状态必须保留功能按钮和输入能力，折叠动画需尊重 `prefers-reduced-motion`。
- `ScoreDocument` 保存音乐数据，不保存 SVG 坐标、键盘状态、设备连接或 Trainer 状态。

## 验证命令

```bash
npm run build
npm run lint
npm test
```

浏览器验收使用 `npm run dev` 后打开本地 Vite 页面，重点检查 Editor 默认入口、乐谱输入 / 删除 / 替换、播放定位、Dock 对齐、刷新恢复和 JSON 导入导出。

## 协作和提交流程

1. 先讨论需求和设计，不在需求未确认时直接修改。
2. 获得明确的实施确认后再编辑代码。
3. 修改相关 Markdown；功能、布局或交互变化至少同步 `CHANGELOG.md`，必要时同步 `SCORE_EDITOR.md`、`PROJECT_CONTEXT_CN.md` 或 `README.md`。
4. 运行构建、Lint 和测试，说明任何未覆盖的浏览器或硬件验证。
5. 在本地创建清晰的 Git commit，并汇报修改文件、验证结果和 Technical Debt。
6. 只有用户明确要求时才执行 `git push`；不要把 push 或发布标签当作默认步骤。

## 文档职责

- `README.md`：首次接触项目的人、运行方式和主要能力。
- `PROJECT_CONTEXT_CN.md`：当前状态、架构、设计原则和历史上下文。
- `SCORE_EDITOR.md`：Score Editor 的行为、数据格式、边界和验证。
- `ROADMAP.md`：当前路线和历史阶段；优先阅读顶部当前路线。
- `CHANGELOG.md`：按版本记录已完成变更。
- `AGENTS.md`：新 Agent 的接管规则和当前设计不变量。

如果历史章节与当前章节冲突，以 `AGENTS.md`、`PROJECT_CONTEXT_CN.md` 当前版本段、`SCORE_EDITOR.md` 当前行为和实际代码为准；不要把历史阶段的“不实现”直接当作当前限制。
