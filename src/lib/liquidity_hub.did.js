/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export const idlFactory = ({ IDL }) => {
    const IlpResponseData = IDL.Record({
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
    const ILPArgs = IDL.Record({
        'tick_in_tx_block': IDL.Text,
        'tick_out_name': IDL.Text,
        'tick_in_name': IDL.Text,
        'tick_in_network': IDL.Text,
    });
    const IlpResponse = IDL.Variant({ 'Ok': IlpResponseData, 'Err': IDL.Text });
    return IDL.Service({
        'btc_pool_size': IDL.Func([], [IDL.Nat], ['query']),
        'btc_required_pool_size': IDL.Func([], [IDL.Nat], ['query']),
        'get_response': IDL.Func(
            [IDL.Nat64],
            [IDL.Opt(IlpResponseData)],
            ['query'],
        ),
        'get_responses': IDL.Func([], [IDL.Vec(IlpResponseData)], ['query']),
        'te_ilp': IDL.Func([ILPArgs], [IlpResponse], []),
    });
};
export const init = ({ IDL }) => { return []; };