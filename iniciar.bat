@echo off
title Sistema de Estacionamento
echo ==============================================
echo    INICIANDO SISTEMA DE ESTACIONAMENTO
echo ==============================================
echo.
echo [1/2] Iniciando API (.NET 8)...
start "Estacionamento - API" cmd /k "cd EstacionamentoApi && dotnet run"
echo.
echo [2/2] Iniciando Frontend (React + Vite)...
start "Estacionamento - Frontend" cmd /k "cd estacionamento-frontend && npm run dev"
echo.
echo ==============================================
echo   Sistema pronto!
echo   - Swagger API: http://localhost:5209/swagger
echo   - Frontend:    http://localhost:5173
echo ==============================================
