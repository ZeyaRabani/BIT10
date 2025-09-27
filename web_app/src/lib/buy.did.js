/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
    'base_address': IDL.Func([], [IDL.Text], []),
    'base_buy': IDL.Func([IDL.Text], [SwapResponse], []),
    'base_create_transaction': IDL.Func([SwapArgs], [TransactionResponse], []),
    'bit10_token': IDL.Func([], [BIT10TokenResponse], ['query']),
    'get_buy_history': IDL.Func([], [IDL.Vec(SwapResponseData)], ['query']),
    'get_sell_history': IDL.Func([], [IDL.Vec(SwapResponseData)], ['query']),
    'icp_buy': IDL.Func([ICPBuyArgs], [SwapResponse], []),
    'icp_sell': IDL.Func([ICPSellArgs], [SwapResponse], []),
  });
};
export const init = ({ IDL }) => { return []; };