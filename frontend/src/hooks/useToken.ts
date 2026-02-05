/**
 * useToken Hook
 * 
 * Provides token operations: balance, allowance, mint, approve
 * Uses wagmi for contract interactions with SHADOW (MockERC20) token.
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { MOCK_TOKEN, ROUTER_ADDRESS } from '../config';

// Minimal ERC20 ABI for our operations
const TOKEN_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export function useToken() {
  const { address } = useAccount();
  
  // Read balance
  const { 
    data: balanceRaw, 
    refetch: refetchBalance,
    isLoading: isLoadingBalance,
  } = useReadContract({
    address: MOCK_TOKEN,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read allowance for ShadowRouter (the contract that pulls user funds)
  const { 
    data: allowanceRaw, 
    refetch: refetchAllowance,
    isLoading: isLoadingAllowance,
  } = useReadContract({
    address: MOCK_TOKEN,
    abi: TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, ROUTER_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Write: mint
  const { 
    writeContract: writeMint, 
    data: mintHash,
    isPending: isMintPending,
    reset: resetMint,
  } = useWriteContract();

  // Write: approve
  const { 
    writeContract: writeApprove, 
    data: approveHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  // Wait for mint tx
  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Wait for approve tx
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Mint function
  const mint = async (amount: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    const amountWei = parseEther(amount);
    
    writeMint({
      address: MOCK_TOKEN,
      abi: TOKEN_ABI,
      functionName: 'mint',
      args: [address, amountWei],
    });
  };

  // Approve function - approves ShadowRouter to spend user's tokens
  // Pass 'max' for unlimited approval
  const approve = async (amount: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    // Use max uint256 for unlimited approval, otherwise parse the amount
    const amountWei = amount === 'max' 
      ? BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      : parseEther(amount);
    
    writeApprove({
      address: MOCK_TOKEN,
      abi: TOKEN_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, amountWei],
    });
  };

  // Refetch both after successful transactions
  const refetch = () => {
    refetchBalance();
    refetchAllowance();
  };

  // Format values for display
  const balance = balanceRaw ? formatEther(balanceRaw) : '0';
  const allowance = allowanceRaw ? formatEther(allowanceRaw) : '0';

  return {
    // Values
    balance,
    balanceRaw: balanceRaw ?? 0n,
    allowance,
    allowanceRaw: allowanceRaw ?? 0n,
    
    // Actions
    mint,
    approve,
    refetch,
    resetMint,
    resetApprove,
    
    // Loading states
    isLoadingBalance,
    isLoadingAllowance,
    isMinting: isMintPending || isMintConfirming,
    isApproving: isApprovePending || isApproveConfirming,
    
    // Success states
    isMintSuccess,
    isApproveSuccess,
    
    // Transaction hashes
    mintHash,
    approveHash,
  };
}
