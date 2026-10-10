#!/bin/bash

echo "Starting Quantara Data Platform..."

# 1. Start Backend (in background)
echo "Starting FastAPI Backend..."
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 2. Start Yjs WebSocket Server (in background)
echo "Starting Yjs Sync Server..."
cd yjs-backend
./start.sh &
YJS_PID=$!
cd ..

# 3. Start Frontend
echo "Starting React Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=================================================="
echo "Quantara is now running!"
echo "UI: http://localhost:5173"
echo "API: http://localhost:8000"
echo "Default Credentials: admin / admin"
echo "=================================================="
echo "Press Ctrl+C to shut down all services."

# Trap Ctrl+C and kill background processes
trap "echo 'Shutting down services...'; kill $BACKEND_PID; kill $YJS_PID; kill $FRONTEND_PID; exit" SIGINT SIGTERM

# Wait indefinitely to keep the script running
wait
