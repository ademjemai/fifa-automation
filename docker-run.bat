@echo off
echo ========================================
echo    FIFA.com - Lancement Docker
echo ========================================
echo.

echo Demarrage de l'application FIFA...
docker-compose up -d

echo.
echo Application demarree !
echo.
echo URL : http://localhost:3000
echo.
echo Pour voir les logs :
echo   docker-compose logs -f
echo.
echo Pour arreter :
echo   docker-compose down
echo.

pause 