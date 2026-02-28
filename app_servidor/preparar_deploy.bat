@echo off
echo 📦 Iniciando preparacao para Deploy...

:: 1. Build do Frontend
echo 🎨 Compilando Frontend...
cd frontend
call npm run build
cd ..

:: 2. Build do Backend (se houver passo de build)
echo ⚙️ Compilando Backend...
cd backend
:: Se voce usa TS, descomente a linha abaixo:
:: call npm run build
cd ..

:: 3. Criando pasta de pacotes prontos
if exist DEPLOY_PRONTO rd /s /q DEPLOY_PRONTO
mkdir DEPLOY_PRONTO
mkdir DEPLOY_PRONTO\frontend
mkdir DEPLOY_PRONTO\backend

:: 4. Copiando arquivos necessarios
echo 🚚 Organizando arquivos...
xcopy /E /I frontend\dist DEPLOY_PRONTO\frontend
xcopy /E /I backend\dist DEPLOY_PRONTO\backend
copy backend\.env DEPLOY_PRONTO\backend\
copy backend\package.json DEPLOY_PRONTO\backend\

echo.
echo ✅ TUDO PRONTO! 
echo 📂 Agora va na pasta 'DEPLOY_PRONTO' e suba o conteudo para o cPanel.
pause