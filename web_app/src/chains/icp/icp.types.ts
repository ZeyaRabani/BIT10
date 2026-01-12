import { type Principal } from '@dfinity/principal';

export type StepUpdateCallback = (stepIndex: number, updates: { 
    status?: 'pending' | 'processing' | 'success' | 'error', 
    description?: string, 
    error?: string 
}) => void;

export type ICRC2ActorType = {
    icrc2_approve: (args: {
        spender: { owner: Principal; subaccount: [] };
        fee: [];
        memo: [];
        from_subaccount: [];
        created_at_time: [];
        amount: bigint;
        expected_allowance: [];
        expires_at: [bigint];

    }) => Promise<{ Ok?: number; Err?: { InsufficientFunds?: null } }>;
};

export type SwapResponse = { 'Ok': SwapResponseData } | { 'Err': string };

export interface SwapResponseData {
    'token_in_amount': string;
    'transaction_type': string;
    'token_in_address': string;
    'token_out_address': string;
    'token_in_tx_hash': string;
    'network': string;
    'swap_id': string;
    'token_out_tx_hash': string;
    'user_wallet_address': string;
    'transaction_timestamp': string;
    'token_in_usd_amount': string;
    'token_out_amount': string;
}

export type CashbackResponse = { 'Ok': CashbackResponseData } | { 'Err': string };

export interface CashbackResponseData {
    'user_transaction_activity': string;
    'token_out_address': string;
    'network': string;
    'token_out_tx_hash': string;
    'user_wallet_address': string;
    'transaction_timestamp': string;
    'cashback_id': string;
    'token_out_amount': string;
    'token_out_usd_amount': string;
}
