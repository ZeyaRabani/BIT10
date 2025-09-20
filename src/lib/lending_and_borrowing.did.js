/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
export const idlFactory = ({ IDL }) => {
    const LendResponseData = IDL.Record({
        'status': IDL.Text,
        'return_amount': IDL.Opt(IDL.Text),
        'token_amount': IDL.Text,
        'closed_at': IDL.Opt(IDL.Text),
        'return_timestamp': IDL.Opt(IDL.Text),
        'token_sent_trx_hash': IDL.Text,
        'opened_at': IDL.Text,
        'token_address': IDL.Text,
        'return_trx_hash': IDL.Opt(IDL.Text),
        'lend_id': IDL.Text,
        'token_chain': IDL.Text,
        'interest_rate': IDL.Text,
        'lender_address': IDL.Text,
    });
    const LendResponse = IDL.Variant({
        'Ok': LendResponseData,
        'Err': IDL.Text,
    });
    const LendArgs = IDL.Record({
        'token_amount': IDL.Text,
        'token_address': IDL.Text,
        'token_chain': IDL.Text,
        'lender_address': IDL.Text,
    });
    const TransactionData = IDL.Record({
        'to': IDL.Text,
        'value': IDL.Text,
        'data': IDL.Text,
        'from': IDL.Text,
    });
    const TransactionResponse = IDL.Record({
        'transaction_data': TransactionData,
    });
    const SignatureVerificationRequest = IDL.Record({
        'signature': IDL.Text,
        'lend_id': IDL.Text,
    });
    const BorrowResponseData = IDL.Record({
        'borrow_token_amount': IDL.Text,
        'status': IDL.Text,
        'borrow_token_address': IDL.Text,
        'closed_at': IDL.Opt(IDL.Text),
        'repayment_trx_hash': IDL.Opt(IDL.Text),
        'collateral_trx_hash': IDL.Text,
        'opened_at': IDL.Text,
        'collateral_token_address': IDL.Text,
        'collateral_token_amount': IDL.Text,
        'borrower_address': IDL.Text,
        'interest_rate': IDL.Text,
        'borrow_trx_hash': IDL.Text,
        'repayment_amount': IDL.Opt(IDL.Text),
        'borrow_token_chain': IDL.Text,
        'collateral_token_chain': IDL.Text,
        'repayment_timestamp': IDL.Opt(IDL.Text),
        'borrow_wallet_address': IDL.Text,
        'borrow_id': IDL.Text,
    });
    const BorrowArgs = IDL.Record({
        'borrow_token_amount': IDL.Text,
        'borrow_token_address': IDL.Text,
        'collateral_token_address': IDL.Text,
        'collateral_token_amount': IDL.Text,
        'borrower_address': IDL.Text,
        'borrow_token_chain': IDL.Text,
        'collateral_token_chain': IDL.Text,
        'borrow_wallet_address': IDL.Text,
    });
    const BorrowResponse = IDL.Variant({
        'Ok': BorrowResponseData,
        'Err': IDL.Text,
    });
    const LiquidityData = IDL.Record({
        'token_symbol': IDL.Text,
        'token_address': IDL.Text,
        'total_volume_borrowed': IDL.Text,
        'total_volume_available_for_lending': IDL.Text,
        'token_chain': IDL.Text,
        'total_volume': IDL.Text,
    });
    return IDL.Service({
        'bsc_address': IDL.Func([], [IDL.Text], []),
        'eth_lend': IDL.Func([IDL.Text], [LendResponse], []),
        'eth_lend_create_transaction': IDL.Func(
            [LendArgs],
            [TransactionResponse],
            [],
        ),
        'eth_lend_withdraw': IDL.Func(
            [SignatureVerificationRequest],
            [LendResponse],
            [],
        ),
        'ethereum_address': IDL.Func([], [IDL.Text], []),
        'get_borrow_history': IDL.Func(
            [],
            [IDL.Vec(BorrowResponseData)],
            ['query'],
        ),
        'get_borrow_history_by_address': IDL.Func(
            [IDL.Text],
            [IDL.Vec(BorrowResponseData)],
            ['query'],
        ),
        'get_lend_history': IDL.Func([], [IDL.Vec(LendResponseData)], ['query']),
        'get_lend_history_by_address': IDL.Func(
            [IDL.Text],
            [IDL.Vec(LendResponseData)],
            ['query'],
        ),
        'icp_borrow': IDL.Func([BorrowArgs], [BorrowResponse], []),
        'icp_lend': IDL.Func([LendArgs], [LendResponse], []),
        'icp_lend_withdraw': IDL.Func([IDL.Text], [LendResponse], []),
        'total_liquidity': IDL.Func([], [IDL.Vec(LiquidityData)], ['query']),
    });
};
// @ts-ignore
export const init = ({ IDL }) => { return []; };