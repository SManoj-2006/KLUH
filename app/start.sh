#!/bin/bash

# Start the backend server
node dist-server/index.js &

# Wait a moment for the server to start
sleep 2

echo "Server started on port 3001"
echo "Visit http://localhost:3001 to access the application"

# Keep the script running
wait
