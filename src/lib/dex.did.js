/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export const idlFactory = ({ IDL }) => {
    const CreateTransactionArgs = IDL.Record({
        'source_chain': IDL.Text,
        'destination_chain': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'tick_out_wallet_address': IDL.Text,
        'amount_in': IDL.Text,
        'tick_in_wallet_address': IDL.Text,
        'pool_id': IDL.Text,
        'expected_amount_out': IDL.Text,
        'swap_type': IDL.Text,
        'slippage': IDL.Text,
    });
    const TransactionData = IDL.Record({
        'to': IDL.Text,
        'value': IDL.Text,
        'max_priority_fee_per_gas': IDL.Opt(IDL.Text),
        'data': IDL.Text,
        'from': IDL.Text,
        'max_fee_per_gas': IDL.Opt(IDL.Text),
        'chain_id': IDL.Opt(IDL.Nat64),
        'blockchain': IDL.Opt(IDL.Text),
        'nonce': IDL.Opt(IDL.Text),
        'gas_limit': IDL.Opt(IDL.Text),
        'tx_type': IDL.Opt(IDL.Text),
    });
    const TransactionResponse = IDL.Record({
        'transaction_data': TransactionData,
    });
    const CrossChainVerifyAndSwapArgs = IDL.Record({
        'source_chain': IDL.Text,
        'transaction_hash': IDL.Text,
        'pool_id': IDL.Text,
    });
    const SwapResponse = IDL.Record({
        'source_chain': IDL.Text,
        'status': IDL.Text,
        'destination_chain': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'tx_hash_in': IDL.Text,
        'amount_out': IDL.Text,
        'timestamp': IDL.Nat64,
        'tick_out_wallet_address': IDL.Text,
        'amount_in': IDL.Text,
        'tick_in_wallet_address': IDL.Text,
        'pool_id': IDL.Text,
        'swap_type': IDL.Text,
        'tx_hash_out': IDL.Text,
        'slippage': IDL.Text,
    });
    const SwapResult = IDL.Variant({
        'Error': IDL.Text,
        'Success': SwapResponse,
    });
    const GetSwapHistoryByAddressArgs = IDL.Record({
        'chain': IDL.Text,
        'tick_in_wallet_address': IDL.Text,
    });
    const VerifyAndSwapArgs = IDL.Record({
        'transaction_hash': IDL.Text,
        'pool_id': IDL.Text,
    });
    return IDL.Service({
        'create_transaction': IDL.Func(
            [CreateTransactionArgs],
            [IDL.Variant({ 'Ok': TransactionResponse, 'Err': IDL.Text })],
            [],
        ),
        'cross_chain_verify_and_swap': IDL.Func(
            [CrossChainVerifyAndSwapArgs],
            [IDL.Variant({ 'Ok': SwapResult, 'Err': IDL.Text })],
            [],
        ),
        'get_swap_history_by_address': IDL.Func(
            [GetSwapHistoryByAddressArgs],
            [IDL.Variant({ 'Ok': IDL.Vec(SwapResponse), 'Err': IDL.Text })],
            [],
        ),
        'verify_and_swap': IDL.Func(
            [VerifyAndSwapArgs],
            [IDL.Variant({ 'Ok': SwapResult, 'Err': IDL.Text })],
            [],
        ),
    });
};
export const init = ({ IDL }) => { return []; };