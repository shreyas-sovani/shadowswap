import { useQuery } from '@tanstack/react-query';
import { BACKEND_URL } from '../config';

export type IntentStatus = 'PENDING' | 'MATCHED' | 'SETTLING' | 'SETTLED' | 'FAILED' | 'UNKNOWN';

export interface IntentResponse {
    id: string;
    status: IntentStatus;
    userAddress: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    direction: string;
    // Settlement data
    matchId: string | null;
    counterparty: string | null;
    txnHash: string | null;
    settledAt: number | null;
    settlementError: string | null;
}

const fetchIntentStatus = async (intentId: string): Promise<IntentResponse> => {
    const response = await fetch(`${BACKEND_URL}/intent/${intentId}`, {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch intent status');
    }
    return response.json();
};

export const useIntentStatus = (intentId: string | null, initialData?: Partial<IntentResponse>) => {
    return useQuery({
        queryKey: ['intent', intentId],
        queryFn: () => fetchIntentStatus(intentId!),
        enabled: !!intentId,
        initialData: initialData as IntentResponse | undefined,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            // Stop polling if SETTLED or FAILED, otherwise poll every 1s for faster updates
            return (status === 'SETTLED' || status === 'FAILED') ? false : 1000;
        },
        retry: 3,
    });
};
