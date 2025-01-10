/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
export const idlFactory = ({ IDL }) => {
    return IDL.Service({
        'bit10_defi_total_supply_of_token_available': IDL.Func(
            [],
            [IDL.Nat64],
            ['query'],
        ),
        'bit10_defi_total_token_available_for_buying': IDL.Func(
            [],
            [IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text })],
            [],
        ),
        'bit10_defi_total_token_bought': IDL.Func(
            [],
            [IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text })],
            [],
        ),
        'bit10_oracle': IDL.Func([], [IDL.Text], []),
    });
};
// @ts-ignore
export const init = ({ IDL }) => { return []; };