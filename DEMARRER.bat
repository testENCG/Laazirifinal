@echo off
echo ========================================
echo    LAAZIRI TRAVEL - Démarrage
echo ========================================
echo.

echo [1/2] Démarrage du Backend Flask...
start "Backend Flask" cmd /k "cd /d %~dp0backend && python app.py"

timeout /t 3 /nobreak > nul

echo [2/2] Démarrage du Frontend React...
start "Frontend React" cmd /k "cd /d %~dp0frontend-react && npm run dev"

timeout /t 4 /nobreak > nul

echo.
echo ✅ Application lancée !
echo.
echo 🌐 Ouvrir dans le navigateur :
echo    → http://localhost:5173
echo.
echo ⚠️  NE PAS utiliser localhost:5000 pour naviguer
echo    (5000 = API seulement, 5173 = interface web)
echo.
pause
