# BIT10 Swap

Users can swap tokens from ICP, ckBTC, etc. to buy BIT10 tokens.

## 🌟 Overview

BIT10 Swap is a decentralized exchange protocol built on the Internet Computer Protocol (ICP) that enables users to swap various tokens for BIT10 tokens. The system is designed to be secure, efficient, and user-friendly.

Learn more about Swap in our [GitBook](https://gitbook.bit10.app/part_3/testnet/icp).

## 📐 Architecture Overview

```mermaid
graph TD
    A[User] -->|Swap Request| B[Exchange Canister]
    B -->|Price Query| C[Price Feed Canister]
    B -->|Token Transfer| D[Token Ledger Canisters]
    B -->|Supply Update| E[Supply Storage]
    D -->|Transfer Confirmation| B
    B -->|Swap Response| A
```

### System Components

```mermaid
graph LR
    A[Exchange Canister] --> B[Price Service]
    A --> C[Swap Service]
    A --> D[Storage Service]
    B --> E[Price Feed Canister]
    B --> F[External Price APIs]
    C --> G[Token Ledgers]
    D --> H[Stable Storage]
```

### Swap Flow

```mermaid
sequenceDiagram
    participant User
    participant Exchange
    participant PriceFeed
    participant TokenLedger
    participant SupplyStorage

    User->>Exchange: Initiate Swap
    Exchange->>PriceFeed: Get Token Prices
    PriceFeed-->>Exchange: Return Prices
    Exchange->>Exchange: Calculate Swap Amount
    Exchange->>TokenLedger: Transfer Input Token
    TokenLedger-->>Exchange: Confirm Transfer
    Exchange->>TokenLedger: Transfer Output Token
    TokenLedger-->>Exchange: Confirm Transfer
    Exchange->>SupplyStorage: Update Supply
    Exchange-->>User: Return Swap Result
```

### Reverse Swap Flow

```mermaid
sequenceDiagram
    participant User
    participant Exchange
    participant PriceFeed
    participant TokenLedger
    participant SupplyStorage

    User->>Exchange: Initiate Reverse Swap
    Exchange->>PriceFeed: Get Token Prices
    PriceFeed-->>Exchange: Return Prices
    Exchange->>Exchange: Calculate Reverse Amount
    Exchange->>TokenLedger: Transfer BIT10 Token
    TokenLedger-->>Exchange: Confirm Transfer
    Exchange->>TokenLedger: Transfer Output Token
    TokenLedger-->>Exchange: Confirm Transfer
    Exchange->>SupplyStorage: Update Reverse Supply
    Exchange-->>User: Return Reverse Swap Result
```

## 🔗 ICP Canisters

- BIT10 Exchange Canister: [6phs7-6yaaa-aaaap-qpvoq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=6phs7-6yaaa-aaaap-qpvoq-cai)

## 💡 Features

- **Token Swapping**: Swap between various tokens and BIT10 tokens
- **Price Feeds**: Real-time price updates from multiple sources
- **Supply Management**: Automated supply tracking and updates
- **Fee Management**: Transparent fee structure with platform and minting fees

## 🔧 Configuration

The system uses several configuration parameters:

- Platform Fee: 3% on swaps
- Minting Fee: 1% on reverse swaps
- Maximum Retries: 5 for HTTP requests
- HTTP Request Cycles: 25,000,000,000

## 🏁 Getting Started

To start using BIT10 Liquidity Hub canister, follow these steps:

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/ZeyaRabani/BIT10.git
    ```

2. **Go to ICP swap folder**:
    ```bash
    cd swap/icp
    ```

3. **Start the dfx locally and run the canister**:
    ```bash
    dfx start --background
    
    dfx deploy exchange_canister_backend
    ```
