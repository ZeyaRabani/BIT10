// @ts-expect-error
export const idlFactory = ({ IDL }) => {
    const SwapResponseData = IDL.Record({
        'token_in_amount': IDL.Text,
        'transaction_type': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'token_in_tx_hash': IDL.Text,
        'network': IDL.Text,
        'swap_id': IDL.Text,
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
    const SwapArgs = IDL.Record({
        'token_in_amount': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'user_wallet_address': IDL.Text,
        'token_out_amount': IDL.Text,
    });
    const TransactionResponse = IDL.Record({
        'to': IDL.Text,
        'value': IDL.Text,
        'data': IDL.Text,
        'from': IDL.Text,
    });
    const TokenAllocation = IDL.Record({
        'total_tokens_sold': IDL.Text,
        'total_tokens_bought': IDL.Text,
        'chain': IDL.Text,
        'token_address': IDL.Text,
        'total_chain_supply': IDL.Text,
    });
    const TokenDetails = IDL.Record({
        'name': IDL.Text,
        'allocations': IDL.Vec(TokenAllocation),
        'total_supply': IDL.Text,
        'symbol': IDL.Text,
    });
    const BIT10TokenResponse = IDL.Record({
        'tokens': IDL.Vec(IDL.Tuple(IDL.Text, TokenDetails)),
    });
    const TokenAvailability = IDL.Record({
        'token_available_supply': IDL.Text,
        'total_tokens_sold': IDL.Text,
        'total_tokens_bought': IDL.Text,
        'chain': IDL.Text,
        'token_address': IDL.Text,
        'total_chain_supply': IDL.Text,
    });
    const Result_TokenAvailability = IDL.Variant({
        'Ok': TokenAvailability,
        'Err': IDL.Text,
    });
    const ICPBuyArgs = IDL.Record({
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
        'token_out_amount': IDL.Text,
    });
    const ICPSellArgs = IDL.Record({
        'token_in_amount': IDL.Text,
        'token_in_address': IDL.Text,
        'token_out_address': IDL.Text,
    });
    return IDL.Service({
        'add_data_to_buy_history': IDL.Func(
            [SwapResponseData],
            [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })],
            [],
        ),
        'add_data_to_sell_history': IDL.Func(
            [SwapResponseData],
            [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })],
            [],
        ),
        'associated_token_account': IDL.Func(
            [IDL.Text],
            [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })],
            [],
        ),
        'base_address': IDL.Func([], [IDL.Text], []),
        'base_buy': IDL.Func([IDL.Text], [SwapResponse], []),
        'base_create_sell_transaction': IDL.Func(
            [SwapArgs],
            [TransactionResponse],
            [],
        ),
        'base_create_transaction': IDL.Func([SwapArgs], [TransactionResponse], []),
        'base_sell': IDL.Func([IDL.Text], [SwapResponse], []),
        'bit10_token': IDL.Func([], [BIT10TokenResponse], ['query']),
        'bit10_token_available_supply': IDL.Func(
            [IDL.Text],
            [Result_TokenAvailability],
            ['query'],
        ),
        'bsc_address': IDL.Func([], [IDL.Text], []),
        'bsc_buy': IDL.Func([IDL.Text], [SwapResponse], []),
        'bsc_create_sell_transaction': IDL.Func(
            [SwapArgs],
            [TransactionResponse],
            [],
        ),
        'bsc_create_transaction': IDL.Func([SwapArgs], [TransactionResponse], []),
        'bsc_sell': IDL.Func([IDL.Text], [SwapResponse], []),
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
        'get_buy_and_sell_history_by_address_and_chain': IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Vec(SwapResponseData)],
            ['query'],
        ),
        'get_buy_history': IDL.Func([], [IDL.Vec(SwapResponseData)], ['query']),
        'get_buy_history_by_address_and_chain': IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Vec(SwapResponseData)],
            ['query'],
        ),
        'get_sell_history': IDL.Func([], [IDL.Vec(SwapResponseData)], ['query']),
        'get_sell_history_by_address_and_chain': IDL.Func(
            [IDL.Text, IDL.Text],
            [IDL.Vec(SwapResponseData)],
            ['query'],
        ),
        'get_swap_history_by_swap_id': IDL.Func(
            [IDL.Text],
            [IDL.Vec(SwapResponseData)],
            ['query'],
        ),
        'icp_buy': IDL.Func([ICPBuyArgs], [SwapResponse], []),
        'icp_sell': IDL.Func([ICPSellArgs], [SwapResponse], []),
        'nonce_account': IDL.Func([], [IDL.Text], []),
        'solana_address': IDL.Func([], [IDL.Text], []),
        'solana_buy': IDL.Func([IDL.Text], [SwapResponse], []),
        'solana_create_sell_transaction': IDL.Func(
            [SwapArgs],
            [TransactionResponse],
            [],
        ),
        'solana_create_transaction': IDL.Func(
            [SwapArgs],
            [TransactionResponse],
            [],
        ),
        'solana_sell': IDL.Func([IDL.Text], [SwapResponse], []),
    });
};
// @ts-expect-error
export const init = ({ IDL }) => { return []; };