@echo off
echo ========================================
echo    FIFA.com - Docker Simple
echo ========================================
echo.

echo Construction de l'image...
docker build -t fifa-app:latest .

echo.
echo Lancement du conteneur...
docker run -d --name fifa-web-app -p 3000:3000 -v fifa_data:/app/data fifa-app:latest

echo.
echo Application demarree !
echo URL : http://localhost:3000
echo.
echo Pour voir les logs :
echo   docker logs fifa-web-app
echo.
echo Pour arreter :
echo   docker stop fifa-web-app
echo   docker rm fifa-web-app
echo.

pause 