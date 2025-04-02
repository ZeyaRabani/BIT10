export type TeSwap = {
    'version': '0.1.0',
    'name': 'te_swap',
    'instructions': [
        {
            'name': 'swap',
            'accounts': [
                {
                    'name': 'swapResult',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'user',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'systemProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'payer',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'recipient',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'smartContractPda',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'smartContractTokenAccount',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'userTokenAccount',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'tokenProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'mint',
                    'isMut': false,
                    'isSigner': false
                }
            ],
            'args': [
                {
                    'name': 'args',
                    'type': {
                        'defined': 'SwapArgs'
                    }
                }
            ]
        }
    ],
    'accounts': [
        {
            'name': 'swapResult',
            'type': {
                'kind': 'struct',
                'fields': [
                    {
                        'name': 'userAddress',
                        'type': 'string'
                    },
                    {
                        'name': 'tickInName',
                        'type': 'string'
                    },
                    {
                        'name': 'tickInAmount',
                        'type': 'f64'
                    },
                    {
                        'name': 'tickInUsdAmount',
                        'type': 'f64'
                    },
                    {
                        'name': 'tickOutName',
                        'type': 'string'
                    },
                    {
                        'name': 'tickOutAmount',
                        'type': 'u64'
                    },
                    {
                        'name': 'transactionType',
                        'type': 'string'
                    },
                    {
                        'name': 'transactionTimestamp',
                        'type': 'string'
                    },
                    {
                        'name': 'network',
                        'type': 'string'
                    }
                ]
            }
        }
    ],
    'types': [
        {
            'name': 'SwapArgs',
            'type': {
                'kind': 'struct',
                'fields': [
                    {
                        'name': 'tickInName',
                        'type': 'string'
                    },
                    {
                        'name': 'tickOutName',
                        'type': 'string'
                    },
                    {
                        'name': 'tickOutAmount',
                        'type': 'u64'
                    }
                ]
            }
        }
    ],
    'errors': [
        {
            'code': 6000,
            'name': 'InvalidInput',
            'msg': 'Invalid input parameters'
        },
        {
            'code': 6001,
            'name': 'InvalidAmount',
            'msg': 'Output amount must be greater than 0'
        },
        {
            'code': 6002,
            'name': 'InvalidInputToken',
            'msg': 'Incorrect input token'
        },
        {
            'code': 6003,
            'name': 'InvalidOutputToken',
            'msg': 'Incorrect output token'
        },
        {
            'code': 6004,
            'name': 'InvalidSeeds',
            'msg': 'Invalid PDA seeds'
        }
    ]
};

export const IDL: TeSwap = {
    'version': '0.1.0',
    'name': 'te_swap',
    'instructions': [
        {
            'name': 'swap',
            'accounts': [
                {
                    'name': 'swapResult',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'user',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'systemProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'payer',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'recipient',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'smartContractPda',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'smartContractTokenAccount',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'userTokenAccount',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'tokenProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'mint',
                    'isMut': false,
                    'isSigner': false
                }
            ],
            'args': [
                {
                    'name': 'args',
                    'type': {
                        'defined': 'SwapArgs'
                    }
                }
            ]
        }
    ],
    'accounts': [
        {
            'name': 'swapResult',
            'type': {
                'kind': 'struct',
                'fields': [
                    {
                        'name': 'userAddress',
                        'type': 'string'
                    },
                    {
                        'name': 'tickInName',
                        'type': 'string'
                    },
                    {
                        'name': 'tickInAmount',
                        'type': 'f64'
                    },
                    {
                        'name': 'tickInUsdAmount',
                        'type': 'f64'
                    },
                    {
                        'name': 'tickOutName',
                        'type': 'string'
                    },
                    {
                        'name': 'tickOutAmount',
                        'type': 'u64'
                    },
                    {
                        'name': 'transactionType',
                        'type': 'string'
                    },
                    {
                        'name': 'transactionTimestamp',
                        'type': 'string'
                    },
                    {
                        'name': 'network',
                        'type': 'string'
                    }
                ]
            }
        }
    ],
    'types': [
        {
            'name': 'SwapArgs',
            'type': {
                'kind': 'struct',
                'fields': [
                    {
                        'name': 'tickInName',
                        'type': 'string'
                    },
                    {
                        'name': 'tickOutName',
                        'type': 'string'
                    },
                    {
                        'name': 'tickOutAmount',
                        'type': 'u64'
                    }
                ]
            }
        }
    ],
    'errors': [
        {
            'code': 6000,
            'name': 'InvalidInput',
            'msg': 'Invalid input parameters'
        },
        {
            'code': 6001,
            'name': 'InvalidAmount',
            'msg': 'Output amount must be greater than 0'
        },
        {
            'code': 6002,
            'name': 'InvalidInputToken',
            'msg': 'Incorrect input token'
        },
        {
            'code': 6003,
            'name': 'InvalidOutputToken',
            'msg': 'Incorrect output token'
        },
        {
            'code': 6004,
            'name': 'InvalidSeeds',
            'msg': 'Invalid PDA seeds'
        }
    ]
};