/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export const idlFactory = ({ IDL }) => {
    const ToolFunction = IDL.Record({
        'name': IDL.Text,
        'arguments': IDL.Vec(
            IDL.Record({ 'value': IDL.Text, 'name': IDL.Text })
        ),
    });
    const ToolCall = IDL.Record({ 'id': IDL.Text, 'function': ToolFunction });
    const ChatMessage = IDL.Variant({
        'tool': IDL.Record({ 'content': IDL.Text, 'tool_call_id': IDL.Text }),
        'user': IDL.Record({ 'content': IDL.Text }),
        'assistant': IDL.Record({
            'content': IDL.Opt(IDL.Text),
            'tool_calls': IDL.Vec(ToolCall),
        }),
        'system': IDL.Record({ 'content': IDL.Text }),
    });
    return IDL.Service({
        'chat': IDL.Func([IDL.Vec(ChatMessage)], [IDL.Text], []),
    });
};
export const init = ({ IDL }) => { return []; };