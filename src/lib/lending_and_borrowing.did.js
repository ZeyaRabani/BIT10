/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
export const idlFactory = ({ IDL }) => {
    const BorrowArgs = IDL.Record({
        'borrow_token_amount': IDL.Nat64,
        'collateral_amount': IDL.Nat64,
        'borrow_token_address': IDL.Text,
        'collateral_address': IDL.Text,
        'borrower_address': IDL.Text,
        'borrow_token_chain': IDL.Text,
        'collateral_chain': IDL.Text,
        'borrow_wallet_address': IDL.Text,
    });
    const BorrowResponseData = IDL.Record({
        'borrow_token_amount': IDL.Text,
        'collateral_amount': IDL.Text,
        'status': IDL.Text,
        'borrow_token_address': IDL.Text,
        'collateral_address': IDL.Text,
        'collateral_trx_hash': IDL.Text,
        'opened_at': IDL.Text,
        'borrower_address': IDL.Text,
        'interest_rate': IDL.Text,
        'borrow_trx_hash': IDL.Text,
        'borrow_token_chain': IDL.Text,
        'collateral_chain': IDL.Text,
        'borrow_wallet_address': IDL.Text,
    });
    const BorrowResponse = IDL.Variant({
        'Ok': BorrowResponseData,
        'Err': IDL.Text,
    });
    const LendArgs = IDL.Record({
        'token_amount': IDL.Nat64,
        'token_address': IDL.Text,
        'token_chain': IDL.Text,
        'lender_address': IDL.Text,
    });
    const LendResponseData = IDL.Record({
        'status': IDL.Text,
        'token_amount': IDL.Nat64,
        'token_sent_trx_hash': IDL.Text,
        'opened_at': IDL.Text,
        'token_address': IDL.Text,
        'token_chain': IDL.Text,
        'interest_rate': IDL.Text,
        'lender_address': IDL.Text,
    });
    const LendResponse = IDL.Variant({
        'Ok': LendResponseData,
        'Err': IDL.Text,
    });
    return IDL.Service({
        'borrow': IDL.Func([BorrowArgs], [BorrowResponse], []),
        'lend': IDL.Func([LendArgs], [LendResponse], []),
    });
};
// @ts-ignore
export const init = ({ IDL }) => { return []; };