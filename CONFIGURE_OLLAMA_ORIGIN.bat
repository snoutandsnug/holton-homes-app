@echo off
setlocal

echo.
echo =============================================
echo   HOLTON HOMES - OLLAMA BROWSER ORIGIN
echo =============================================
echo.
echo This allows your Holton Homes Vercel page to call Ollama on THIS PC.
echo Use the exact HTTPS origin only. Do not enter * and do not expose port 11434.
echo.

set "ORIGIN=%~1"
if "%ORIGIN%"=="" set /p "ORIGIN=Paste your Vercel preview or production origin (example https://holton-homes-os.vercel.app): "
if "%ORIGIN%"=="" (
  echo No origin entered.
  pause
  exit /b 1
)

set "HH_OLLAMA_ORIGIN=%ORIGIN%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$u=[Uri]$env:HH_OLLAMA_ORIGIN; if($u.Scheme -ne 'https' -or $u.Host -eq '' -or $u.AbsolutePath -ne '/' -or $u.Query -ne '' -or $u.Fragment -ne ''){throw 'Enter only an HTTPS origin such as https://example.vercel.app (no path/query/fragment).'}; [Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS',$u.GetLeftPart([UriPartial]::Authority),'User')"
if errorlevel 1 (
  echo.
  echo Could not set OLLAMA_ORIGINS. Check that you pasted only the HTTPS origin.
  pause
  exit /b 1
)

echo.
echo Saved OLLAMA_ORIGINS for your Windows user.
echo IMPORTANT: Quit Ollama from the tray/taskbar, then start Ollama again.
echo After restart, open Holton Studio ^> Settings ^> Test Ollama.
echo.
pause
