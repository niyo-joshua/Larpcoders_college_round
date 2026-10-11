@echo off
echo Starting Incognito Escrow Platform...

REM Start Backend Server
start "Incognito Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

REM Wait 2 seconds
timeout /t 2 /nobreak >nul

REM Start Frontend Server
start "Incognito Frontend" cmd /k "cd /d %~dp0frontend && set PATH=C:\Users\rayya\AppData\Local\Programs\nodejs;%%PATH%% && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo ========================================================
echo  Website is running!
echo  Open in your browser: http://localhost:5173
echo ========================================================
echo.
pause
