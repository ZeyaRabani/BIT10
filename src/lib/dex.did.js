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
        'max_priority_fee_per_gas': IDL.Text,
        'data': IDL.Text,
        'from': IDL.Text,
        'max_fee_per_gas': IDL.Text,
        'chain_id': IDL.Nat64,
        'blockchain': IDL.Text,
        'nonce': IDL.Text,
        'gas_limit': IDL.Text,
        'tx_type': IDL.Text,
    });
    const TransactionResponse = IDL.Record({
        'transaction_data': TransactionData,
    });
    const BlockTag = IDL.Variant({
        'Earliest': IDL.Null,
        'Safe': IDL.Null,
        'Finalized': IDL.Null,
        'Latest': IDL.Null,
        'Number': IDL.Nat,
        'Pending': IDL.Null,
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
    return IDL.Service({
        'create_transaction': IDL.Func(
            [CreateTransactionArgs],
            [TransactionResponse],
            [],
        ),
        'ethereum_address': IDL.Func([], [IDL.Text], []),
        'get_balance': IDL.Func([IDL.Opt(IDL.Text)], [IDL.Nat], []),
        'get_transaction_count_for_address': IDL.Func([IDL.Text], [IDL.Nat], []),
        'send_eth': IDL.Func([IDL.Text, IDL.Nat], [IDL.Text], []),
        'transaction_count': IDL.Func([IDL.Opt(BlockTag)], [IDL.Nat], []),
        'verify_and_swap': IDL.Func([IDL.Text], [SwapResult], []),
    });
};
export const init = ({ IDL }) => { return []; };