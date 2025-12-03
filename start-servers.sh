#!/bin/bash

# Start Servers Script for Nagi's Ceylon Catering

echo "🚀 Starting Nagi's Ceylon Catering servers..."

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to kill processes on a port
kill_port() {
    if check_port $1; then
        echo "⚠️  Port $1 is in use. Killing existing process..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Kill any existing processes on our ports
kill_port 3001
kill_port 3000

# Start backend server
echo "🔧 Starting backend server on port 3001..."
nohup npm run server > server.log 2>&1 &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend server to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server is running on http://localhost:3001"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "🌐 Starting frontend server on port 3000..."
nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

# Wait for frontend to start
echo "⏳ Waiting for frontend server to start..."
sleep 15

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server is running on http://localhost:3000"
else
    echo "⚠️  Frontend server may still be starting up..."
    echo "Check the logs with: tail -f frontend.log"
fi

echo ""
echo "🎉 Servers are starting up!"
echo ""
echo "📊 Server Status:"
echo "   Backend:  http://localhost:3001/health"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f server.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🔍 To check if servers are running:"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3000"
echo ""
echo "🚀 Alternative: Use 'npm run dev' to start both servers together" 