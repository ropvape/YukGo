#!/bin/bash
cd /home/dhanu/Documents/yukgo-live/website
npm run dev &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to be ready
for i in $(seq 1 30); do
  sleep 2
  if curl -sI http://localhost:3000 --connect-timeout 3 --max-time 5 2>/dev/null | grep -q "200\|301\|302"; then
    echo "Server ready after ${i} attempts"
    curl -sI http://localhost:3000 2>&1 | head -3
    break
  fi
  echo "Waiting... ($i)"
done

# Keep server running
echo "Server running on PID $SERVER_PID"
echo "Access at http://localhost:3000"
wait $SERVER_PID
