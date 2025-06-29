@echo off
echo ========================================
echo    FIFA.com - Nettoyage Docker
echo ========================================
echo.

echo Arret des conteneurs...
docker-compose down

echo.
echo Suppression des conteneurs arretes...
docker container prune -f

echo.
echo Suppression des images non utilisees...
docker image prune -f

echo.
echo Suppression des volumes non utilises...
docker volume prune -f

echo.
echo Nettoyage termine !
echo.
echo Pour reconstruire et relancer :
echo   .\docker-build.bat
echo   .\docker-run.bat
echo.

pause 