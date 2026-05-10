# LayerRenamer

Batch rename layers for **Photoshop** and **After Effects** ExtendScript environments.

## 适用版本
- Photoshop: 2023+（ExtendScript）
- After Effects: 2023+（ExtendScript）

> 低版本可能可运行，但请参考下方兼容性矩阵与“已知限制”。

## 功能概览
- 批量重命名选中图层
- 颜色标签批量设置
- **Dry-run 预览模式**（仅预览改名计划，不写入）
- 命名冲突策略：
  - **跳过**：目标名已存在时跳过该图层
  - **覆盖**：允许使用目标名（宿主可能自动处理同名）
  - **自动追加后缀**：自动生成唯一名称（如 `_1`, `_2`）

## 使用说明

### 安装与加载

#### Photoshop

1. 将 `LayerRenamerCore.jsx` 和 `LayerRenamer_PS-2023.jsx` 放置于同一目录下
2. 在 Photoshop 中打开任意文档，通过菜单 **文件 → 脚本 → 浏览…** 选择 `LayerRenamer_PS-2023.jsx` 运行
3. 也可将脚本复制到 Photoshop 脚本目录（`/Presets/Scripts/`）以便直接在菜单中调用

#### After Effects

1. 将 `LayerRenamer_AE-2023.jsx` 放置于任意位置
2. 打开一个合成（CompItem），通过菜单 **文件 → 脚本 → 运行脚本文件…** 选择脚本运行
3. 也可将脚本复制到 AE 脚本目录（`/Scripts/ScriptUI Panels/`）作为面板使用

### Photoshop 操作流程

1. **选择图层**：在图层面板中选中需要重命名的一个或多个图层（支持图层组递归展开）
2. **运行脚本**：加载 `LayerRenamer_PS-2023.jsx`，弹出配置对话框
3. **填写参数**：

| 字段 | 说明 | 示例 |
|------|------|------|
| 基础图层名称 | 新名称的主体部分，会自动去除前后空白和控制字符 | `Layer` |
| 编号起始值 | 编号从哪个数字开始（整数，0 ~ 999999） | `1` |
| 编号格式 | 编号的零填充格式，仅允许连续 `0` | `001` → `001`, `002`, `003`… |
| 选择颜色标签 | 可选的颜色标签，选"无颜色标签"则不设置 | `红色` |
| 命名冲突策略 | 目标名已存在时的处理方式（见下方详解） | `跳过` |
| Dry-run 预览 | 勾选则仅预览不写入，取消勾选则直接执行 | 建议首次使用先预览 |

4. **预览或执行**：点击"确认"——若勾选了 Dry-run，弹出预览窗口展示改名计划；若取消勾选，直接写入图层名称
5. **查看结果**：执行完成后弹出汇总窗口，显示重命名数量与跳过数量

#### 命名冲突策略详解

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| **跳过** | 目标名称已存在时跳过该图层，保留原名 | 保守操作，避免意外覆盖 |
| **覆盖** | 允许使用目标名称写入（宿主可能自动处理同名） | 确定可以覆盖时使用 |
| **自动追加后缀** | 自动生成唯一名称，如 `Layer_1`、`Layer_2` | 批量操作时确保名称不重复 |

### After Effects 操作流程

1. **激活合成**：在项目面板中打开一个合成作为当前活动项
2. **选择图层**：在时间轴面板中选中需要重命名的图层
3. **运行脚本**：加载 `LayerRenamer_AE-2023.jsx`，打开浮动面板
4. **填写参数**：

| 字段 | 说明 | 示例 |
|------|------|------|
| 新名称前缀 | 图层新名称的前缀部分，会自动去除前后空白和控制字符 | `Shape` |
| 选择颜色 | 可选的标签颜色，选"无"则不设置 | `红色` |
| 命名冲突策略 | 同上 PS 三种策略 | `跳过` |
| Dry-run 预览 | 勾选则仅预览，不实际写入 | 建议先预览 |

5. **预览或执行**：点击"应用"——Dry-run 模式弹出预览；非 Dry-run 模式执行写入（支持 Undo）
6. **撤销操作**：AE 支持 `beginUndoGroup`，可在执行后使用 Ctrl+Z 撤销

### 典型工作流

#### 推荐流程（先预览后执行）

1. 保持 **Dry-run 预览** 勾选状态
2. 填写参数，点击"确认"
3. 检查预览结果是否符合预期
4. 若结果正确，再次运行脚本，**取消** Dry-run 勾选，执行写入

#### 带颜色标签的批量整理

1. 选中需要归类的图层（如所有文字层）
2. 基础名称设为 `Text`，编号格式 `001`
3. 颜色标签选 `绿色`
4. 冲突策略选 `自动追加后缀`
5. 先 Dry-run 预览，确认后执行

#### 图层组内批量重命名

1. 选中图层组（整个文件夹），脚本会自动递归展开组内所有子图层
2. 所有展开后的图层将按顺序统一编号
3. 注意：组本身不会被重命名，仅组内 ArtLayer 被处理

### 注意事项

- 重命名前建议**保存项目文件**或使用版本历史，以便回退
- 极端复杂的图层结构（超多层嵌套、锁定图层等）建议先用 Dry-run 预览
- "覆盖"策略在不同 Photoshop 版本中遇到同名图层时的最终表现可能依赖宿主内部机制
- 图层名称最大长度为 255 字符（Photoshop），超长会自动截断
- After Effects 脚本**必须**在激活的合成（CompItem）内执行，否则会提示错误

## 架构说明

项目采用两层架构，将纯逻辑与宿主 API 解耦：

| 层 | 文件 | 职责 |
|------|------|------|
| **Core 模块** | `LayerRenamerCore.jsx` | 输入校验、计划构建、冲突处理、结构化日志 — 无宿主依赖，可在 Node.js 中独立测试 |
| **宿主适配层** | `LayerRenamer_PS-2023.jsx` | Photoshop ScriptUI 对话框、Action Manager 图层操作、颜色标签设置 |
| **宿主适配层** | `LayerRenamer_AE-2023.jsx` | After Effects 面板 UI、合成上下文操作、标签颜色设置（独立实现） |

Core 模块通过 ExtendScript `#include` 指令被 PS 脚本引用，同时兼容 Node.js `require()` 用于单元测试。

## 输入约束
### Photoshop (`LayerRenamer_PS-2023.jsx`)
- 基础名称：必填，会自动去除前后空白和控制字符
- 起始编号：整数，范围 `0 ~ 999999`
- 编号格式：仅允许连续 `0`（如 `0` / `00` / `001`），长度 ≤ 10
- 最终图层名：最大长度 255（超长会截断）

### After Effects (`LayerRenamer_AE-2023.jsx`)
- 名称前缀：必填，会自动去除前后空白和控制字符
- 前缀长度限制：≤ 200
- 必须在激活的合成（`CompItem`）内执行

## 文件说明
- `LayerRenamer_PS-2023.jsx`: Photoshop 批量重命名 + 颜色标签
- `LayerRenamer_AE-2023.jsx`: AE 批量重命名 + 标签颜色
- `SECURITY_QUALITY_REVIEW.md`: 安全与代码质量审计报告

## 测试

Core 模块的纯逻辑函数通过 Node.js 原生测试运行器进行单元测试，目标覆盖率 ≥ 80%。

```bash
# Windows
powershell -ExecutionPolicy Bypass -File tests/run_tests.ps1

# 或手动
copy LayerRenamerCore.jsx LayerRenamerCore_temp.js
node --test tests/test_core.js
del LayerRenamerCore_temp.js
```

> 注意：Photoshop 宿主 API 相关代码（如 Action Manager 调用）无法在 Node.js 中测试，需在 Photoshop 环境中手动回归验证。

## 已知限制
1. 脚本运行在 Adobe Host 内，无法在普通 Node.js 环境完整验证运行时行为。
2. “覆盖”策略在不同宿主版本中遇到同名目标时，最终表现可能依赖宿主内部处理机制。
3. Photoshop 图层集合较复杂（图层组、锁定状态、特殊图层等），极端工程中建议先使用 dry-run 预览。
4. 本项目不涉及数据库/网络接口，因此 SQL 注入、TLS 传输安全等典型后端议题仅适用性说明，不作为主要风险面。

## 兼容性矩阵（API 差异 & 测试结果）

| 宿主 | 版本 | 关键 API | 差异/注意点 | 当前验证结果 |
|---|---|---|---|---|
| Photoshop | 2023 | `ActionReference`, `executeActionGet`, `executeAction`, `DialogModes` | 图层索引与图层组递归处理需要特殊逻辑；颜色标签通过 ActionDescriptor 设置 | 已做静态语法检查；运行时待宿主验证 |
| Photoshop | 2024+ | 同上 | 大体兼容；建议重点回归 `targetLayers` 读取与颜色设置动作 | 未在本仓库自动化验证 |
| After Effects | 2023 | `CompItem`, `selectedLayers`, `layer.label`, `beginUndoGroup/endUndoGroup` | 仅合成上下文可用；无活动合成需提前拦截 | 已做静态语法检查；运行时待宿主验证 |
| After Effects | 2024+ | 同上 | 多数 API 兼容；建议回归标签值映射与大批量图层命名行为 | 未在本仓库自动化验证 |

## 本地检查（仓库内可执行）

### 语法检查
- 使用 `node --check` 对脚本做 JavaScript 子集语法检查（需将 `.jsx` 复制为 `.js`，PS 脚本需去掉 `#target` 行）。

### 单元测试
- 运行 `powershell -ExecutionPolicy Bypass -File tests/run_tests.ps1` 执行 Core 模块单元测试。

