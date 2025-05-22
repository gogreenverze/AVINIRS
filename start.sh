#!/bin/bash

# Start script for RSAVINI

# Initialize mock data for the backend
echo "Initializing mock data for the backend..."
cd backend
python3 init_data.py

# Start the backend server
echo "Starting the backend server..."
python3 app.py &
BACKEND_PID=$!

# Wait for the backend to start
echo "Waiting for the backend to start..."
sleep 3

# Start the frontend server
echo "Starting the frontend server..."
cd ..
npm start &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Register the cleanup function for script termination
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "Both servers are running. Press Ctrl+C to stop."
wait
