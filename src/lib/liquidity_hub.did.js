/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export const idlFactory = ({ IDL }) => {
    const ILPResponseData = IDL.Record({
        'tick_in_tx_block': IDL.Text,
        'tick_out_network': IDL.Text,
        'tick_out_usd_amount': IDL.Float64,
        'liquidation_type': IDL.Text,
        'tick_out_name': IDL.Text,
        'tick_out_address': IDL.Principal,
        'tick_in_name': IDL.Text,
        'tick_in_usd_amount': IDL.Float64,
        'transaction_timestamp': IDL.Text,
        'tick_out_amount': IDL.Nat,
        'tick_in_network': IDL.Text,
        'tick_out_tx_block': IDL.Text,
        'tick_in_amount': IDL.Nat,
        'tick_in_address': IDL.Text,
    });
    const SLPResponseData = IDL.Record({
        'tick_in_block': IDL.Nat,
        'duration': IDL.Nat,
        'tick_in_timestamp': IDL.Text,
        'tick_in_name': IDL.Text,
        'tick_in_amount': IDL.Nat,
        'tick_in_address': IDL.Principal,
    });
    const SLPWithdrawResponseData = IDL.Record({
        'tick_out_name': IDL.Text,
        'tick_out_time': IDL.Text,
        'tick_out_address': IDL.Principal,
        'tick_out_amount': IDL.Nat,
        'tick_out_block': IDL.Nat,
    });
    const ILPArgs = IDL.Record({
        'tick_in_tx_block': IDL.Text,
        'tick_out_name': IDL.Text,
        'tick_in_name': IDL.Text,
        'tick_in_network': IDL.Text,
    });
    const ILPResponse = IDL.Variant({ 'Ok': ILPResponseData, 'Err': IDL.Text });
    const SLPArgs = IDL.Record({
        'duration': IDL.Nat,
        'tick_in_name': IDL.Text,
        'tick_in_amount': IDL.Nat,
    });
    const SLPResponse = IDL.Variant({ 'Ok': SLPResponseData, 'Err': IDL.Text });
    const SLPWithdrawArgs = IDL.Record({
        'tick_out_name': IDL.Text,
        'tick_out_amount': IDL.Nat,
    });
    const SLPWithdrawResponse = IDL.Variant({
        'Ok': SLPWithdrawResponseData,
        'Err': IDL.Text,
    });
    const TransferFromCanisterArgs = IDL.Record({
        'tick_out_name': IDL.Text,
        'tick_out_address': IDL.Principal,
        'tick_out_amount': IDL.Nat,
        'tick_out_duration': IDL.Nat,
    });
    const TransferFromCanisterResponseData = IDL.Record({
        'tick_out_name': IDL.Text,
        'tick_out_time': IDL.Text,
        'tick_out_address': IDL.Principal,
        'tick_out_caller': IDL.Principal,
        'tick_out_amount': IDL.Nat,
        'tick_out_block': IDL.Nat,
    });
    const TransferFromCanisterResponse = IDL.Variant({
        'Ok': TransferFromCanisterResponseData,
        'Err': IDL.Text,
    });
    return IDL.Service({
        'btc_pool_size': IDL.Func([], [IDL.Nat], ['query']),
        'btc_required_pool_size': IDL.Func([], [IDL.Nat], ['query']),
        'get_response': IDL.Func(
            [IDL.Text],
            [IDL.Opt(ILPResponseData)],
            ['query'],
        ),
        'get_responses': IDL.Func([], [IDL.Vec(ILPResponseData)], ['query']),
        'get_slp_responses': IDL.Func([], [IDL.Vec(SLPResponseData)], ['query']),
        'get_slp_responses_by_principal': IDL.Func(
            [IDL.Principal],
            [IDL.Vec(SLPResponseData)],
            ['query'],
        ),
        'get_slp_withdraw_responses': IDL.Func(
            [],
            [IDL.Vec(SLPWithdrawResponseData)],
            ['query'],
        ),
        'get_slp_withdraw_responses_by_principal': IDL.Func(
            [IDL.Principal],
            [IDL.Vec(SLPWithdrawResponseData)],
            ['query'],
        ),
        'te_ilp': IDL.Func([ILPArgs], [ILPResponse], []),
        'te_slp': IDL.Func([SLPArgs], [SLPResponse], []),
        'te_slp_withdraw': IDL.Func([SLPWithdrawArgs], [SLPWithdrawResponse], []),
        'te_transfer_from_canister': IDL.Func(
            [TransferFromCanisterArgs],
            [TransferFromCanisterResponse],
            [],
        ),
    });
};
export const init = ({ IDL }) => { return []; };