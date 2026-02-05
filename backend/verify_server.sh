#!/bin/bash

# Kill any running server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Compile TS (or run via ts-node directly)
echo "Starting Server..."
npx tsx src/server.ts > server.log 2>&1 &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 5

# Intent A: User 1 wants to sell 100 USDC for 100 USDT (TokenA -> TokenB)
# ID: uuid-1
echo "Submitting Intent A (Sell 100 USDC)..."
curl -s -X POST http://localhost:3000/submit-intent \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-1",
    "userAddress": "0xUser1",
    "tokenIn": "0xUSDC",
    "tokenOut": "0xUSDT",
    "amountIn": "100000000",
    "minAmountOut": "100000000",
    "status": "PENDING"
  }' | json_pp

echo -e "\n"

# Intent B: User 2 wants to sell 100 USDT for 100 USDC (TokenB -> TokenA)
# This is the INVERSE of Intent A, and amounts match exactly.
# ID: uuid-2
echo "Submitting Intent B (Sell 100 USDT)... MATCH EXPECTED"
curl -s -X POST http://localhost:3000/submit-intent \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-2",
    "userAddress": "0xUser2",
    "tokenIn": "0xUSDT",
    "tokenOut": "0xUSDC",
    "amountIn": "100000000",
    "minAmountOut": "100000000",
    "status": "PENDING"
  }' | json_pp

echo -e "\n"

echo "Checking Server Logs for Execution details..."
sleep 2
cat server.log

# Cleanup
kill $SERVER_PID
