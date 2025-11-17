import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BIT10 API Documentation',
            version: '1.0.0',
            description: `
API documentation for BIT10 trading and balance endpoints

## WebSocket Real-time Price Feed

For real-time price updates, connect to our WebSocket endpoint:

**Endpoint:** \`wss://eagleai-api.bit10.app/ws/price-feed\`

**Features:**
- Real-time price updates every 1 second
- Same data format as \`/api/v1/balancer/bit10top/price\` REST endpoint  
- No authentication required
- Automatic connection health monitoring with ping/pong

**Usage Example (JavaScript):**
\`\`\`javascript
const ws = new WebSocket('wss://eagleai-api.bit10.app/ws/price-feed');

ws.onopen = function() {
    console.log('Connected to BIT10.TOP price feed');
};

ws.onmessage = function(event) {
    const priceData = JSON.parse(event.data);
    console.log('Price update:', priceData);
    // Handle real-time price data
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};

ws.onclose = function() {
    console.log('WebSocket connection closed');
};
\`\`\`
            `,
            contact: {
                name: 'API Support',
                email: 'harshalraikwar@bit10.app'
            }
        },
        servers: [
            // {
            //     url: 'http://localhost:8080',
            //     description: 'Development server'
            // },
            {
                url: 'https://eagleai-api.bit10.app',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'API Key',
                    description: 'Enter your API key'
                }
            },
            schemas: {
                CoinData: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Unique coin identifier',
                            example: 1
                        },
                        name: {
                            type: 'string',
                            description: 'Coin name',
                            example: 'Bitcoin'
                        },
                        symbol: {
                            type: 'string',
                            description: 'Coin symbol',
                            example: 'BTC'
                        },
                        circulatingSupply: {
                            type: 'number',
                            description: 'Circulating supply of the coin',
                            example: 19500000
                        },
                        pythFeedId: {
                            type: 'string',
                            description: 'Pyth network feed ID',
                            nullable: true,
                            example: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
                        },
                        currentPrice: {
                            type: 'number',
                            description: 'Current price in USD',
                            nullable: true,
                            example: 43250.50
                        },
                        currentMarketCap: {
                            type: 'number',
                            description: 'Current market capitalization',
                            nullable: true,
                            example: 843484750000
                        },
                        weightPercent: {
                            type: 'number',
                            description: 'Weight percentage in the index',
                            nullable: true,
                            example: 45.5
                        }
                    }
                },
                BIT10TOPPrice: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            example: 'BIT10.TOP',
                            description: 'Token identifier'
                        },
                        tokenPrice: {
                            type: 'number',
                            description: 'Current token price',
                            example: 0.00000042
                        },
                        timestmpz: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp of the price data',
                            example: '2025-11-14T10:30:00.000Z'
                        },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/CoinData'
                            }
                        }
                    }
                },
                CompositionData: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Unique coin identifier',
                            example: 1
                        },
                        name: {
                            type: 'string',
                            description: 'Coin name',
                            example: 'Bitcoin'
                        },
                        symbol: {
                            type: 'string',
                            description: 'Coin symbol',
                            example: 'BTC'
                        },
                        weightPercent: {
                            type: 'number',
                            description: 'Weight percentage in the index',
                            nullable: true,
                            example: 45.5
                        }
                    }
                },
                BIT10TOPBalance: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            example: 'BIT10.TOP',
                            description: 'Token identifier'
                        },
                        composition: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/CompositionData'
                            }
                        }
                    }
                },
                BuyRequest: {
                    type: 'object',
                    required: [
                        'user_wallet_address',
                        'token_in_address',
                        'token_out_address',
                        'token_out_amount'
                    ],
                    properties: {
                        user_wallet_address: {
                            type: 'string',
                            description: 'User wallet address',
                            example: '0xuser1234567890abcdefuser1234567890abcdef'
                        },
                        token_in_address: {
                            type: 'string',
                            description: 'Input token contract address',
                            example: '0x1234567890abcdef1234567890abcdef12345678'
                        },
                        token_out_address: {
                            type: 'string',
                            description: 'Output token contract address',
                            example: '0xfedcba0987654321fedcba0987654321fedcba09'
                        },
                        token_out_amount: {
                            type: 'string',
                            description: 'Amount of output token',
                            example: '1'
                        }
                    }
                },
                BuyTrxRequest: {
                    type: 'object',
                    required: ['trx_hash'],
                    properties: {
                        trx_hash: {
                            type: 'string',
                            description: 'Transaction hash to process',
                            example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
                        }
                    }
                },
                SellRequest: {
                    type: 'object',
                    required: [
                        'user_wallet_address',
                        'token_in_address',
                        'token_out_address',
                        'token_out_amount'
                    ],
                    properties: {
                        user_wallet_address: {
                            type: 'string',
                            description: 'User wallet address',
                            example: '0xuser1234567890abcdefuser1234567890abcdef'
                        },
                        token_in_address: {
                            type: 'string',
                            description: 'Input token contract address',
                            example: '0x1234567890abcdef1234567890abcdef12345678'
                        },
                        token_out_address: {
                            type: 'string',
                            description: 'Output token contract address',
                            example: '0xfedcba0987654321fedcba0987654321fedcba09'
                        },
                        token_out_amount: {
                            type: 'string',
                            description: 'Amount of output token',
                            example: '1'
                        }
                    }
                },
                SellTrxRequest: {
                    type: 'object',
                    required: ['trx_hash'],
                    properties: {
                        trx_hash: {
                            type: 'string',
                            description: 'Transaction hash to process',
                            example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error type',
                            example: 'Invalid API key'
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                            example: 'The provided API key is not valid'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Balancer',
                description: 'Balance and price information endpoints. For real-time updates, use WebSocket at `wss://eagleai-api.bit10.app/ws/price-feed`'
            },
            {
                name: 'Trades',
                description: 'Trading operations endpoints'
            }
        ]
    },
    apis: ['./src/institutions/api/v1/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
