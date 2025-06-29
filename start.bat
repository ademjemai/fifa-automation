@echo off
echo ========================================
echo    FIFA.com - Serveur d'Authentification
echo ========================================
echo.

echo Installation des dependances...
npm install

echo.
echo Demarrage du serveur...
echo Le serveur sera accessible sur: http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

node server.js

pause 