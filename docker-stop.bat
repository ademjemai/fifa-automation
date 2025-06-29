@echo off
echo ========================================
echo    FIFA.com - Arret Docker
echo ========================================
echo.

echo Arret du conteneur...
docker stop fifa-web-app

echo.
echo Suppression du conteneur...
docker rm fifa-web-app

echo.
echo Conteneur arrete et supprime !
echo.

pause 