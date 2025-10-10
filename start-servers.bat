@echo off
echo Starting Eventrra Development Servers...

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause