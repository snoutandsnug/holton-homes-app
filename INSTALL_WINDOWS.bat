@echo off
setlocal
cd /d "%~dp0"
echo.
echo HOLTON HOMES - WORTH-IT UPDATE v2
echo ---------------------------------
echo This does NOT modify app.js.
echo Run it from the package folder; it will ask for your repo path if needed.
echo.
where py >nul 2>nul
if %errorlevel%==0 (
  py apply_holton_worth_it_update.py
) else (
  python apply_holton_worth_it_update.py
)
if errorlevel 1 (
  echo.
  echo Install failed. Nothing should be merged to main.
) else (
  echo.
  echo Install passed. Commit/upload to a FRESH BRANCH and use the Vercel preview.
)
pause
