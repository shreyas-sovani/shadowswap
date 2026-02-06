#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
ETH_ADDR="0x0000000000000000000000000000000000000000"
SHADOW_ADDR="0xf4442339bA89BC5DA1Cf2304Af163D1b82CF0751"
USER_A="0x1111111111111111111111111111111111111111"
USER_B="0x2222222222222222222222222222222222222222"
ID_A="intent-a-$(date +%s)"
ID_B="intent-b-$(date +%s)"

echo "🔹 Submitting Intent A (SHADOW -> ETH)..."
curl -s -X POST "$API_URL/submit-intent" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$ID_A\",
    \"userAddress\": \"$USER_A\",
    \"tokenIn\": \"$SHADOW_ADDR\",
    \"tokenOut\": \"$ETH_ADDR\",
    \"amountIn\": \"1000000000000000000000\", 
    \"minAmountOut\": \"0\"
  }" | jq .

echo -e "\n\n🔹 Checking Status of A (Should be PENDING)..."
curl -s "$API_URL/intent/$ID_A" | jq .

echo -e "\n\n🔹 Submitting Intent B (ETH -> SHADOW) - Should Match!..."
# 1 ETH = 1000 SHADOW. So 1 * 10^18 ETH matches 1000 * 10^18 SHADOW.
curl -s -X POST "$API_URL/submit-intent" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$ID_B\",
    \"userAddress\": \"$USER_B\",
    \"tokenIn\": \"$ETH_ADDR\",
    \"tokenOut\": \"$SHADOW_ADDR\",
    \"amountIn\": \"1000000000000000000\", 
    \"minAmountOut\": \"0\"
  }" | jq .

echo -e "\n\n🔹 Checking Status of A (Should be SETTLED or MATCHED)..."
curl -s "$API_URL/intent/$ID_A" | jq .

echo -e "\n\n🔹 Checking Status of B (Should be SETTLED or MATCHED)..."
curl -s "$API_URL/intent/$ID_B" | jq .
