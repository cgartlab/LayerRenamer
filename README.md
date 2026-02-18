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
- 使用 `node --check` 对脚本做 JavaScript 子集语法检查（需将 `.jsx` 复制为 `.js`，PS 脚本需去掉 `#target` 行）。

