/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export const idlFactory = ({ IDL }) => {
  const ReverseSwapArgs = IDL.Record({
    'tick_out_name': IDL.Text,
    'tick_in_name': IDL.Text,
    'tick_in_amount': IDL.Nat,
  });
  const MbSwapResponseData = IDL.Record({
    'tick_in_tx_block': IDL.Nat,
    'transaction_type': IDL.Text,
    'tick_out_name': IDL.Text,
    'network': IDL.Text,
    'tick_in_name': IDL.Text,
    'user_principal_id': IDL.Principal,
    'tick_in_usd_amount': IDL.Text,
    'transaction_timestamp': IDL.Text,
    'tick_out_amount': IDL.Nat,
    'tick_out_tx_block': IDL.Nat,
    'tick_in_amount': IDL.Nat,
  });
  const MbSwapResponse = IDL.Variant({
    'Ok': MbSwapResponseData,
    'Err': IDL.Text,
  });
  const SwapArgs = IDL.Record({
    'tick_out_name': IDL.Text,
    'tick_in_name': IDL.Text,
    'tick_out_amount': IDL.Nat,
  });
  return IDL.Service({
    'bit10_circulating_supply': IDL.Func(
      [],
      [IDL.Vec(IDL.Record({ 'token': IDL.Text, 'supply': IDL.Nat }))],
      ['query'],
    ),
    'bit10_defi_total_supply': IDL.Func(
      [],
      [IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text })],
      [],
    ),
    'bit10_reverse_swap_supply': IDL.Func(
      [],
      [IDL.Vec(IDL.Record({ 'token': IDL.Text, 'supply': IDL.Nat }))],
      ['query'],
    ),
    'mb_reverse_swap': IDL.Func([ReverseSwapArgs], [MbSwapResponse], []),
    'mb_swap': IDL.Func([SwapArgs], [MbSwapResponse], []),
    'te_swap': IDL.Func([SwapArgs], [MbSwapResponse], []),
  });
};
export const init = ({ IDL }) => { return []; };