# LESSONS — LayerRenamer

> Photoshop + After Effects 图层批量重命名脚本（ExtendScript JSX，Core 模块与宿主适配层解耦，Node.js 可测）。
> 本仓库从真实失误沉淀的「教训→规则」清单。**会话开始先全文阅读并遵循其中所有规则**；出现新失误按 §维护 追加。
> 权威依据：Anthropic Claude Code memory/best practices（<200 行、具体可验证、第二次犯同样错即写入）；社区 lessons.md 惯例（Boris Cherny，Anthropic）。
> 来源：本仓库 AGENTS.md 的 CONVENTIONS / NOTES + README 已知限制 + 已验证提交；预填为种子，后续由 Agent 在真实工作中增长。

## 维护
- **触发**：用户纠正 / Agent 自查到的失误 / 非显而易见的 gotcha。
- **格式**：`### <主题>` 下，每条 = 失误（具体场景）→ 规则（最小可执行指令），一行可验证。
- **只记项目特有、不可从代码推断的**；通用最佳实践不写；含糊措辞（"小心""注意"）删掉。
- **重复出现** → 升级进 `AGENTS.md` 硬规则；**月度审阅**裁剪过期项；目标 < 200 行。

## 语法与测试

### #target 行需先移除
- 失误：直接 `node --check LayerRenamer_PS-2023.jsx`，`#target` 行使语法检查失败 → 规则：PS 脚本需先移除 `#target` 行再检查（见 AGENTS.md「COMMANDS」）

### Core 模块可测试
- 失误：把宿主 API 逻辑写进 Core 模块，Node.js 无法测试 → 规则：纯逻辑在 `LayerRenamerCore.jsx`（无宿主依赖），宿主 API 在适配层，Core 兼容 `#include` + `require()`（见 AGENTS.md「CONVENTIONS」）

### Action Manager 无法 Node 测试
- 失误：以为 Node 测试覆盖了 Action Manager 调用 → 规则：Action Manager 调用无法在 Node.js 中测试，需在 Adobe 宿主手动回归（见 AGENTS.md「NOTES」）

## 宿主约束

### AE 必须激活合成
- 失误：AE 脚本在未激活的合成外运行报错 → 规则：AE 必须打开并激活合成（CompItem）内执行，无活动合成需提前拦截（见 README「注意事项」）

### PS 图层名 255 字符
- 失误：超长图层名不截断 → 规则：PS 图层名最大 255 字符，超长自动截断（见 AGENTS.md「NOTES」）

### AE 前缀 ≤200
- 失误：AE 名称前缀超过 200 → 规则：前缀长度限制 ≤200（见 README「输入约束」）

## 输入校验

### 编号格式仅连续 0
- 失误：编号格式 `0` 与 `1` 混写（如 `012`） → 规则：编号格式仅允许连续 `0`（`0`/`00`/`001`），长度 ≤10，起始编号整数 0~999999（见 README「输入约束」）

### 基础名称清理
- 失误：名称带前后空白和控制字符 → 规则：自动去除前后空白和控制字符（见 README「输入约束」）

## 工作流

### 先 Dry-run 后执行
- 失误：直接执行未预览，重命名结果不符合预期 → 规则：首次使用保持 Dry-run 预览勾选，确认后再执行（见 README「推荐流程」）

### 执行前保存项目
- 失误：未保存项目文件即批量重命名，出错无法回退 → 规则：重命名前保存项目文件或使用版本历史（AE 支持 `beginUndoGroup` Ctrl+Z 撤销）（见 README「注意事项」）

### 覆盖策略依赖宿主
- 失误：假设"覆盖"策略在所有版本行为一致 → 规则："覆盖"策略在不同 PS 版本中遇到同名图层表现依赖宿主内部机制（见 README「已知限制」）
