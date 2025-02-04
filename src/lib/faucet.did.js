export const idlFactory = ({ IDL }) => {
    const Account = IDL.Record({
        'owner': IDL.Principal,
        'subaccount': IDL.Opt(IDL.Vec(IDL.Nat8)),
    });
    const TransferArgs = IDL.Record({ 'to_account': Account });
    const Result = IDL.Variant({ 'Ok': IDL.Nat, 'Err': IDL.Text });
    return IDL.Service({
        'check_and_transfer': IDL.Func([TransferArgs], [Result], []),
    });
};
export const init = ({ IDL }) => { return []; };