/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
export const idlFactory = ({ IDL }) => {
    const SwapArgs = IDL.Record({
        'token_in_amount': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'user_wallet_address': IDL.Text,
        'token_out_amount': IDL.Text,
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
    const SwapResponseData = IDL.Record({
        'token_in_amount': IDL.Text,
        'transaction_type': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'token_in_tx_hash': IDL.Text,
        'network': IDL.Text,
        'token_out_tx_hash': IDL.Text,
        'user_wallet_address': IDL.Text,
        'transaction_timestamp': IDL.Text,
        'token_in_usd_amount': IDL.Text,
        'token_out_amount': IDL.Text,
    });
    const SwapResponse = IDL.Variant({
        'Ok': SwapResponseData,
        'Err': IDL.Text,
    });
    const ICPSwapArgs = IDL.Record({
        'tick_out_name': IDL.Text,
        'tick_in_name': IDL.Text,
        'tick_out_amount': IDL.Nat,
    });
    const ICPSwapResponseData = IDL.Record({
        'token_in_amount': IDL.Text,
        'transaction_type': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'token_in_tx_hash': IDL.Text,
        'network': IDL.Text,
        'token_out_tx_hash': IDL.Text,
        'user_wallet_address': IDL.Text,
        'transaction_timestamp': IDL.Text,
        'token_in_usd_amount': IDL.Text,
        'token_out_amount': IDL.Text,
    });
    const ICPSwapResponse = IDL.Variant({
        'Ok': ICPSwapResponseData,
        'Err': IDL.Text,
    });
    return IDL.Service({
        'bsc_address': IDL.Func([], [IDL.Text], []),
        'eth_create_transaction': IDL.Func([SwapArgs], [TransactionResponse], []),
        'eth_swap': IDL.Func([IDL.Text], [SwapResponse], []),
        'ethereum_address': IDL.Func([], [IDL.Text], []),
        'get_swap_history': IDL.Func([], [IDL.Vec(SwapResponse)], ['query']),
        'get_swap_history_by_address': IDL.Func(
            [IDL.Text],
            [IDL.Vec(SwapResponse)],
            ['query'],
        ),
        'icp_swap': IDL.Func([ICPSwapArgs], [ICPSwapResponse], []),
    });
};
// @ts-ignore
export const init = ({ IDL }) => { return []; };