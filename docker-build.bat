@echo off
echo ========================================
echo    FIFA.com - Construction Docker
echo ========================================
echo.

echo Construction de l'image principale...
docker build -t fifa-app:latest .

echo.
echo Construction de l'image Playwright...
docker build -f Dockerfile.playwright -t fifa-playwright:latest .

echo.
echo Images construites avec succes !
echo.
echo Pour demarrer l'application :
echo   docker-compose up -d
echo.
echo Pour demarrer avec Playwright :
echo   docker-compose --profile automation up -d
echo.
echo Pour acceder a l'application :
echo   http://localhost:3000
echo.

pause 