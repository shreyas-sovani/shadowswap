export interface Intent {
    id: string;          // UUID
    userAddress: string;
    tokenIn: string;     // Token Address
    tokenOut: string;    // Token Address
    amountIn: string;    // BigInt string
    minAmountOut: string; // BigInt string
    status: 'PENDING' | 'MATCHED' | 'SETTLED';
}
