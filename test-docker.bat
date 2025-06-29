@echo off
echo ========================================
echo    Test Installation Docker
echo ========================================
echo.

echo Test de Docker...
docker --version

echo.
echo Test de Docker Compose...
docker-compose --version

echo.
echo Test de WSL...
wsl --status

echo.
echo Si tu vois des versions, Docker est installe correctement !
echo Si tu vois des erreurs, Docker n'est pas encore installe.
echo.

pause 