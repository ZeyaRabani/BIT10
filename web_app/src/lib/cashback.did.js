/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export const idlFactory = ({ IDL }) => {
    const CashbackResponseData = IDL.Record({
        'user_transaction_activity': IDL.Text,
        'token_out_address': IDL.Text,
        'network': IDL.Text,
        'token_out_tx_hash': IDL.Text,
        'user_wallet_address': IDL.Text,
        'transaction_timestamp': IDL.Text,
        'cashback_id': IDL.Text,
        'token_out_amount': IDL.Text,
        'token_out_usd_amount': IDL.Text,
    });
    const CashbackResponse = IDL.Variant({
        'Ok': CashbackResponseData,
        'Err': IDL.Text,
    });
    const BuyHistoryRecord = IDL.Record({
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
    return IDL.Service({
        'associated_token_account': IDL.Func(
            [IDL.Text],
            [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })],
            [],
        ),
        'base_address': IDL.Func([], [IDL.Text], []),
        'bsc_address': IDL.Func([], [IDL.Text], []),
        'claim_base_reward': IDL.Func([IDL.Text], [CashbackResponse], []),
        'claim_bsc_reward': IDL.Func([IDL.Text], [CashbackResponse], []),
        'claim_icp_reward': IDL.Func([IDL.Text], [CashbackResponse], []),
        'claim_solana_reward': IDL.Func([IDL.Text], [CashbackResponse], []),
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
        'get_cashback_available_time': IDL.Func([], [IDL.Text], ['query']),
        'get_cashback_history': IDL.Func(
            [],
            [IDL.Vec(CashbackResponseData)],
            ['query'],
        ),
        'get_cashback_history_by_address': IDL.Func(
            [IDL.Text],
            [IDL.Vec(CashbackResponseData)],
            ['query'],
        ),
        'get_cashback_start_time': IDL.Func([], [IDL.Text], ['query']),
        'get_eligible_raffle_entry': IDL.Func(
            [],
            [IDL.Variant({ 'Ok': IDL.Vec(BuyHistoryRecord), 'Err': IDL.Text })],
            [],
        ),
        'get_last_cashback_available_time': IDL.Func([], [IDL.Text], ['query']),
        'nonce_account': IDL.Func([], [IDL.Text], []),
        'solana_address': IDL.Func([], [IDL.Text], []),
    });
};
export const init = ({ IDL }) => { return []; };