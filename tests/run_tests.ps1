# LayerRenamer Core 模块单元测试运行脚本
# 用法: powershell -ExecutionPolicy Bypass -File tests/run_tests.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

Write-Host "=== LayerRenamer Core 单元测试 ===" -ForegroundColor Cyan
Write-Host ""

$CoreJsx = Join-Path $ProjectDir "LayerRenamerCore.jsx"
$TestFile = Join-Path $ScriptDir "test_core.js"

if (-not (Test-Path $CoreJsx)) {
    Write-Host "[ERROR] 找不到 LayerRenamerCore.jsx" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $TestFile)) {
    Write-Host "[ERROR] 找不到 tests/test_core.js" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Gray

$exitCode = 0
try {
    node --test $TestFile
    $exitCode = $LASTEXITCODE
} catch {
    Write-Host "[ERROR] 测试执行异常: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "=== 全部测试通过 ===" -ForegroundColor Green
} else {
    Write-Host "=== 测试失败 (退出码: $exitCode) ===" -ForegroundColor Red
}

exit $exitCode