# AGENTS.md — LayerRenamer

**分层**: 产品 (Products) — 个人产品线
**Updated:** 2026-05-29

Photoshop + After Effects 图层批量重命名脚本。ExtendScript (JSX)。

## STRUCTURE

```
LayerRenamerCore.jsx        # 纯逻辑模块（无宿主依赖，可 Node.js 测试）
LayerRenamer_PS-2023.jsx    # Photoshop 适配层（Action Manager + ScriptUI）
LayerRenamer_AE-2023.jsx    # After Effects 适配层（CompItem + 面板 UI）
tests/
├── test_core.js            # Core 模块单元测试 (491 行)
└── run_tests.ps1           # Windows PowerShell 测试运行器
SECURITY_QUALITY_REVIEW.md  # 安全与代码审计报告
```

## WHERE TO LOOK

| 文件 | 说明 |
|------|------|
| `LayerRenamer_PS-2023.jsx` | PS 批量重命名 + 颜色标签，重构后约 600 行 |
| `LayerRenamer_AE-2023.jsx` | AE 批量重命名 + 标签颜色，重构后约 400 行 |
| `LayerRenamerCore.jsx` | 输入校验、计划构建、冲突处理、结构化日志 (+210 行新增) |
| `tests/test_core.js` | Core 模块单元测试（Node.js，491 行） |
| `SECURITY_QUALITY_REVIEW.md` | 安全与代码审计报告 (158 行) |

## KEY FEATURES

- **Dry-run 预览模式** — 仅预览改名计划，不写入
- **冲突策略** — 跳过 / 覆盖 / 自动追加后缀
- **颜色标签** — PS 支持 8 种颜色标签，AE 支持标签颜色
- **图层组递归展开** — 选中组自动展开所有子图层
- **核心逻辑分离** — `LayerRenamerCore.jsx` 作为独立模块，可通过 `#include` 或 `require()` 引用

## CONVENTIONS

- **ExtendScript (ES3)** — Adobe 专用 JavaScript 方言，`#target` 声明宿主环境
- **#include** — `LayerRenamerCore.jsx` 通过 `#include` 被 PS/AE 脚本引用
- **Core 模块可测试** — 兼容 Node.js `require()` + `--test` 运行器

## COMMANDS

```bash
# 语法检查（PS 脚本需先移除 #target 行）
node --check LayerRenamer_PS-2023.jsx

# 运行单元测试
node --test tests/test_core.js
# 或 Windows
powershell -ExecutionPolicy Bypass -File tests/run_tests.ps1
```

## NOTES

- **宿主限制** — Action Manager 调用无法在 Node.js 中测试，需在 Adobe 宿主手动回归
- **字符限制** — PS 图层名最大 255 字符，超长自动截断
- **AE 要求** — 必须在激活的合成 (CompItem) 内执行
- **版本兼容** — 2023+ 已验证，2024+ 预计兼容但未自动化验证
- 最新 commit: `60504cb` — 添加核心模块单元测试并重构 Photoshop 脚本
