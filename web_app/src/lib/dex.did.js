/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
export const idlFactory = ({ IDL }) => {
    const PoolInfo = IDL.Record({
        'token_a_balance': IDL.Text,
        'token_a': IDL.Text,
        'token_b': IDL.Text,
        'token_b_address': IDL.Text,
        'token_a_address': IDL.Text,
        'token_a_chain': IDL.Text,
        'pool_id': IDL.Text,
        'token_b_balance': IDL.Text,
        'token_b_chain': IDL.Text,
    });
    const PoolsResponse = IDL.Record({ 'pools': IDL.Vec(PoolInfo) });
    const SwapArgs = IDL.Record({
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
    const SwapResponse = IDL.Record({
        'source_chain': IDL.Text,
        'status': IDL.Text,
        'destination_chain': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'tx_hash_in': IDL.Text,
        'swap_id': IDL.Text,
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
    const SwapResult = IDL.Variant({ 'Ok': SwapResponse, 'Err': IDL.Text });
    const Result = IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text });
    return IDL.Service({
        'associated_token_account': IDL.Func(
            [IDL.Text],
            [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })],
            [],
        ),
        'base_address': IDL.Func([], [IDL.Text], []),
        'bsc_address': IDL.Func([], [IDL.Text], []),
        'create_associated_token_account': IDL.Func(
            [IDL.Text],
            [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })],
            [],
        ),
        'create_nonce_account': IDL.Func(
            [],
            [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })],
            [],
        ),
        'get_pool_info': IDL.Func([], [PoolsResponse], ['query']),
        'icp_address': IDL.Func([], [IDL.Text], []),
        'icp_swap': IDL.Func([SwapArgs], [SwapResult], []),
        'initialize_pool_data': IDL.Func([], [Result], []),
        'nonce_account': IDL.Func([], [IDL.Text], []),
        'solana_address': IDL.Func([], [IDL.Text], []),
        'update_pool_balances': IDL.Func(
            [IDL.Text, IDL.Text, IDL.Text],
            [Result],
            [],
        ),
    });
};
// @ts-ignore
export const init = ({ IDL }) => { return []; };