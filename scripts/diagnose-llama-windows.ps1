# Windows LLama-Server Diagnostics Script
# ========================================
# Run this script to diagnose llama-server issues on Windows.
#
# Usage: .\scripts\diagnose-llama-windows.ps1

param(
    [string]$LlamaPath = "c:\tibyan\AI Agent\llama.cpp\build\bin",
    [string]$ModelPath = "c:\tibyan\AI Agent\qwen2.5-3b-instruct-q4_k_m.gguf"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " LLama-Server Diagnostics for Windows" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# ============================================
# 1. Check file paths
# ============================================
Write-Host "[1/6] Checking file paths..." -ForegroundColor Yellow

$serverExe = Join-Path $LlamaPath "llama-server.exe"
$cliExe = Join-Path $LlamaPath "llama-cli.exe"

if (Test-Path $serverExe) {
    Write-Host "  [OK] llama-server.exe found: $serverExe" -ForegroundColor Green
} else {
    Write-Host "  [X] llama-server.exe NOT FOUND: $serverExe" -ForegroundColor Red
    $errors += "llama-server.exe not found at $serverExe"
}

if (Test-Path $cliExe) {
    Write-Host "  [OK] llama-cli.exe found: $cliExe" -ForegroundColor Green
} else {
    Write-Host "  [X] llama-cli.exe NOT FOUND: $cliExe" -ForegroundColor Red
    $errors += "llama-cli.exe not found at $cliExe"
}

if (Test-Path $ModelPath) {
    $modelSize = [math]::Round((Get-Item $ModelPath).Length / 1GB, 2)
    Write-Host "  [OK] Model found: $ModelPath ($modelSize GB)" -ForegroundColor Green
} else {
    Write-Host "  [X] Model NOT FOUND: $ModelPath" -ForegroundColor Red
    $errors += "Model file not found at $ModelPath"
}

Write-Host ""

# ============================================
# 2. Test llama-cli --version
# ============================================
Write-Host "[2/6] Testing llama-cli..." -ForegroundColor Yellow

if (Test-Path $cliExe) {
    try {
        $tempOut = [System.IO.Path]::GetTempFileName()
        $tempErr = [System.IO.Path]::GetTempFileName()
        $process = Start-Process -FilePath $cliExe -ArgumentList "--version" -Wait -PassThru -NoNewWindow -RedirectStandardOutput $tempOut -RedirectStandardError $tempErr
        Remove-Item $tempOut, $tempErr -ErrorAction SilentlyContinue
        if ($process.ExitCode -eq 0) {
            Write-Host "  [OK] llama-cli runs successfully" -ForegroundColor Green
        } else {
            Write-Host "  [X] llama-cli exited with code $($process.ExitCode)" -ForegroundColor Red
            $errors += "llama-cli exits with code $($process.ExitCode) - likely missing dependencies"
        }
    } catch {
        Write-Host "  [X] Failed to run llama-cli: $_" -ForegroundColor Red
        $errors += "Failed to run llama-cli: $_"
    }
} else {
    Write-Host "  - Skipped (file not found)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# 3. Test llama-server --help
# ============================================
Write-Host "[3/6] Testing llama-server..." -ForegroundColor Yellow

if (Test-Path $serverExe) {
    try {
        $tempOut = [System.IO.Path]::GetTempFileName()
        $tempErr = [System.IO.Path]::GetTempFileName()
        $process = Start-Process -FilePath $serverExe -ArgumentList "--help" -Wait -PassThru -NoNewWindow -RedirectStandardOutput $tempOut -RedirectStandardError $tempErr
        Remove-Item $tempOut, $tempErr -ErrorAction SilentlyContinue
        if ($process.ExitCode -eq 0) {
            Write-Host "  [OK] llama-server runs successfully" -ForegroundColor Green
        } else {
            Write-Host "  [X] llama-server exited with code $($process.ExitCode)" -ForegroundColor Red
            $errors += "llama-server exits with code $($process.ExitCode) - likely missing dependencies"
        }
    } catch {
        Write-Host "  [X] Failed to run llama-server: $_" -ForegroundColor Red
        $errors += "Failed to run llama-server: $_"
    }
} else {
    Write-Host "  - Skipped (file not found)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# 4. Check Visual C++ Redistributable
# ============================================
Write-Host "[4/6] Checking Visual C++ Redistributable..." -ForegroundColor Yellow

$vcRedistKeys = @(
    "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\x64"
)

$vcFound = $false
foreach ($key in $vcRedistKeys) {
    if (Test-Path $key) {
        $vcFound = $true
        $version = (Get-ItemProperty $key -ErrorAction SilentlyContinue).Version
        Write-Host "  [OK] VC++ Redistributable found: $version" -ForegroundColor Green
        break
    }
}

if (-not $vcFound) {
    Write-Host "  [X] Visual C++ Redistributable 2015-2022 (x64) NOT FOUND" -ForegroundColor Red
    $errors += "Missing Visual C++ Redistributable"
    Write-Host ""
    Write-Host "  -> Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe" -ForegroundColor Cyan
}

Write-Host ""

# ============================================
# 5. Check port 8080
# ============================================
Write-Host "[5/6] Checking port 8080..." -ForegroundColor Yellow

$portCheck = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "  [!] Port 8080 is in use:" -ForegroundColor Yellow
    $portCheck | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    $warnings += "Port 8080 is already in use"
} else {
    Write-Host "  [OK] Port 8080 is available" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 6. Check DLL dependencies
# ============================================
Write-Host "[6/6] Checking DLL dependencies..." -ForegroundColor Yellow

$dllsInBin = Get-ChildItem -Path $LlamaPath -Filter "*.dll" -ErrorAction SilentlyContinue
if ($dllsInBin) {
    Write-Host "  DLLs in bin folder:" -ForegroundColor Gray
    $dllsInBin | ForEach-Object { Write-Host "    - $($_.Name)" -ForegroundColor Gray }
} else {
    Write-Host "  - No DLLs found in bin folder (static build)" -ForegroundColor Gray
}

# Check for CUDA
$cudaPath = $env:CUDA_PATH
if ($cudaPath -and (Test-Path $cudaPath)) {
    Write-Host "  [OK] CUDA found: $cudaPath" -ForegroundColor Green
} else {
    Write-Host "  - CUDA not found (CPU mode will be used)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "[OK] All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try starting the server with:" -ForegroundColor Cyan
    Write-Host "  cd `"$LlamaPath`"" -ForegroundColor White
    Write-Host "  .\llama-server.exe -m `"$ModelPath`" --host 127.0.0.1 --port 8080 -c 2048" -ForegroundColor White
} else {
    if ($errors.Count -gt 0) {
        Write-Host ""
        Write-Host "ERRORS ($($errors.Count)):" -ForegroundColor Red
        $errors | ForEach-Object { Write-Host "  [X] $_" -ForegroundColor Red }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
        $warnings | ForEach-Object { Write-Host "  [!] $_" -ForegroundColor Yellow }
    }
    
    Write-Host ""
    Write-Host "RECOMMENDED ACTIONS:" -ForegroundColor Cyan
    
    if ($errors -contains "llama-server exits with code 1 - likely missing dependencies" -or 
        $errors -contains "llama-cli exits with code 1 - likely missing dependencies") {
        Write-Host "  1. Install Visual C++ Redistributable 2015-2022 (x64):" -ForegroundColor White
        Write-Host "     https://aka.ms/vs/17/release/vc_redist.x64.exe" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Rebuild llama.cpp with CPU-only support:" -ForegroundColor White
        Write-Host "     cd `"c:\tibyan\AI Agent\llama.cpp`"" -ForegroundColor Gray
        Write-Host "     Remove-Item -Recurse -Force build" -ForegroundColor Gray
        Write-Host "     mkdir build; cd build" -ForegroundColor Gray
        Write-Host "     cmake .. -DGGML_CUDA=OFF -DBUILD_SHARED_LIBS=OFF" -ForegroundColor Gray
        Write-Host "     cmake --build . --config Release" -ForegroundColor Gray
    }
    
    if ($warnings -contains "Port 8080 is already in use") {
        Write-Host ""
        Write-Host "  - Stop the process using port 8080, or use a different port:" -ForegroundColor White
        Write-Host "    .\llama-server.exe -m model.gguf --port 8081" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
