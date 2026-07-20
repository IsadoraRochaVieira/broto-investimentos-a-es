# ============================================================
# B3 RADAR — Configura dois relatórios diários automáticos
# Relatório Manhã: 08:30
# Relatório Tarde: 13:00
# Execute este script UMA VEZ como Administrador
# ============================================================

$PythonExe   = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $PythonExe) {
    Write-Host "ERRO: Python não encontrado no PATH." -ForegroundColor Red
    exit 1
}

$Script      = "$PSScriptRoot\gerar_e_publicar.py"
$LogDir      = "$PSScriptRoot\logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Write-Host "Python: $PythonExe" -ForegroundColor Cyan
Write-Host "Script: $Script"    -ForegroundColor Cyan
Write-Host ""

# ── Tarefa 1: Relatório Manhã (08:30) ────────────────────
$acaoManha = New-ScheduledTaskAction `
    -Execute    $PythonExe `
    -Argument   "`"$Script`" manha" `
    -WorkingDirectory (Split-Path $Script)

$gatilhoManha = New-ScheduledTaskTrigger `
    -Daily -At "08:30"

$configuracoes = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15) `
    -RestartCount 1 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName   "B3Radar_Manha" `
    -TaskPath   "\B3Radar\" `
    -Action     $acaoManha `
    -Trigger    $gatilhoManha `
    -Settings   $configuracoes `
    -Description "B3 Radar — Relatório Manhã (08:30)" `
    -RunLevel   Highest `
    -Force | Out-Null

Write-Host "[OK] Tarefa 'B3Radar_Manha' criada — roda às 08:30 todo dia útil." -ForegroundColor Green

# ── Tarefa 2: Relatório Tarde (13:00) ────────────────────
$acaoTarde = New-ScheduledTaskAction `
    -Execute    $PythonExe `
    -Argument   "`"$Script`" tarde" `
    -WorkingDirectory (Split-Path $Script)

$gatilhoTarde = New-ScheduledTaskTrigger `
    -Daily -At "13:00"

Register-ScheduledTask `
    -TaskName   "B3Radar_Tarde" `
    -TaskPath   "\B3Radar\" `
    -Action     $acaoTarde `
    -Trigger    $gatilhoTarde `
    -Settings   $configuracoes `
    -Description "B3 Radar — Relatório Tarde (13:00)" `
    -RunLevel   Highest `
    -Force | Out-Null

Write-Host "[OK] Tarefa 'B3Radar_Tarde' criada — roda às 13:00 todo dia útil." -ForegroundColor Green

# ── Resumo ───────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Yellow
Write-Host "  Agendamento configurado com sucesso!" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Yellow
Write-Host "  Manhã: 08:30 → $Script manha"
Write-Host "  Tarde: 13:00 → $Script tarde"
Write-Host ""
Write-Host "Para testar manualmente agora:"
Write-Host "  python `"$Script`" manha"
Write-Host "  python `"$Script`" tarde"
Write-Host ""
Write-Host "Para ver as tarefas no agendador:"
Write-Host "  taskschd.msc"
Write-Host "=====================================================" -ForegroundColor Yellow
