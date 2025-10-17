# Mainnet Buy BIT10

Users can swap tokens from ICP, ckBTC, etc. to buy BIT10 tokens on different chains.

## 🌟 Overview

Buy BIT10 is a decentralized exchange protocol built on the Internet Computer Protocol (ICP) that enables users to swap various tokens for BIT10 tokens. The system is designed to be secure, efficient, and user-friendly.

Learn more about Swap in our [GitBook](https://gitbook.bit10.app/part_3/testnet/icp).

## 📐 Architecture Overview

```mermaid
graph LR
    A[Exchange Canister] --> B[Price Service]
    A --> C["Swap Service (ICP)"]
    A --> D["Swap Service (Base)"]
    A --> E[Storage Service]
    B --> F[Price Feed Canister]
    B --> G["External Price APIs (e.g., Tatum)"]
    C --> H[ICP Token Ledgers]
    D --> I["Base RPC (Tatum Gateway)"]
    D --> J["BaseWallet (EVM Signer)"]
    E --> K[Stable Storage]
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

### ICP Buy Flow

```mermaid
sequenceDiagram
    participant User
    participant Exchange
    participant PriceFeed
    participant ICPLedger (TokenIn)
    participant BIT10Ledger (TokenOut)
    participant SupplyStorage

    User->>Exchange: Initiate ICP Buy Swap (TokenIn=ICP, TokenOut=BIT10.TOP, AmountOut)
    Exchange->>PriceFeed: Get ICP & BIT10.TOP Prices
    PriceFeed-->>Exchange: Return Prices
    Exchange->>Exchange: Validate Available Supply & Calculate Required ICP Amount (+1% fee)
    Exchange->>ICPLedger (TokenIn): ICRC-2 transferFrom (User to Platform Wallet)
    ICPLedger (TokenIn)-->>Exchange: Confirm Transfer (Tx Hash)
    Exchange->>BIT10Ledger (TokenOut): ICRC-1 transfer (Platform to User)
    BIT10Ledger (TokenOut)-->>Exchange: Confirm Transfer (Tx Hash)
    Exchange->>SupplyStorage: Update BIT10.TOP Bought
    Exchange-->>User: Return Swap Result (Tx Hashes, Amounts)
```

### ICP Sell Flow

```mermaid
sequenceDiagram
    participant User
    participant Exchange
    participant PriceFeed
    participant BIT10Ledger (TokenIn)
    participant ICPLedger (TokenOut)
    participant SupplyStorage

    User->>Exchange: Initiate ICP Sell Swap (TokenIn=BIT10.TOP, TokenOut=ICP, AmountIn)
    Exchange->>PriceFeed: Get BIT10.TOP & ICP Prices
    PriceFeed-->>Exchange: Return Prices
    Exchange->>Exchange: Calculate ICP Amount to Receive (-1% fee)
    Exchange->>BIT10Ledger (TokenIn): ICRC-2 transferFrom (User to Platform Wallet)
    BIT10Ledger (TokenIn)-->>Exchange: Confirm Transfer (Tx Hash)
    Exchange->>ICPLedger (TokenOut): ICRC-1 transfer (Platform to User)
    ICPLedger (TokenOut)-->>Exchange: Confirm Transfer (Tx Hash)
    Exchange->>SupplyStorage: Update BIT10.TOP Sold
    Exchange-->>User: Return Swap Result (Tx Hashes, Amounts)
```

### Base Buy Flow

```mermaid
sequenceDiagram
    participant User
    participant Exchange
    participant PriceFeed
    participant BaseRPC (Tatum)
    participant BaseWallet (Canister Signer)
    participant SupplyStorage

    User->>Exchange: Request Base Transaction (TokenIn=ETH, TokenOut=BIT10.TOP, AmountOut)
    Exchange-->>User: Return unsigned Transaction Data (from, to, value, data)

    User->>User: Sign & Send Transaction to Base Chain (to Platform's Base Wallet)
    User->>Exchange: Notify Exchange with Transaction Hash (trx_hash)

    Exchange->>BaseRPC (Tatum): Get Transaction Data & Receipt by Hash
    BaseRPC (Tatum)-->>Exchange: Return Transaction Details
    Exchange->>Exchange: Validate Transaction (status, to address, input data, amounts)
    Exchange->>PriceFeed: Get ETH & BIT10.TOP Prices
    PriceFeed-->>Exchange: Return Prices
    Exchange->>Exchange: Compare Expected vs. Actual Value (+1% fee tolerance)

    alt If Value Matches or Tolerated
        Exchange->>BaseWallet (Canister Signer): Sign & Send BIT10.TOP (ERC20) to User
        BaseWallet (Canister Signer)-->>Exchange: Return Base Tx Hash
        Exchange->>SupplyStorage: Update BIT10.TOP Bought
        Exchange-->>User: Return Swap Result (Tx Hashes, Amounts, Type: "Buy")
    else If Value Mismatch too High
        Exchange->>BaseWallet (Canister Signer): Sign & Send Refund (ETH/ERC20) to User
        BaseWallet (Canister Signer)-->>Exchange: Return Base Tx Hash
        Exchange-->>User: Return Swap Result (Tx Hashes, Amounts, Type: "Revert")
    end
```

## 🔗 ICP Canisters

- BIT10 Exchange Canister: [6phs7-6yaaa-aaaap-qpvoq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=6phs7-6yaaa-aaaap-qpvoq-cai)

## 💡 Features

- **Token Swapping**: Swap between various tokens and BIT10 tokens
- **Price Feeds**: Real-time price updates from multiple sources
- **Supply Management**: Automated supply tracking and updates
- **Fee Management**: Transparent fee structure with management and minting fees

## 🔧 Configuration

The system uses several configuration parameters:

- Management Fee: 1% on swaps
- Minting Fee: 1% on reverse swaps

## 🏁 Getting Started

To start using BIT10 Liquidity Hub canister, follow these steps:

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/ZeyaRabani/BIT10.git
    ```

2. **Go to ICP swap folder**:
    ```bash
    cd icp_canister/buy_bit10/mainnet_buy_bit10
    ```

3. **Start the dfx locally and run the canister**:
    ```bash
    dfx start --background
    
    dfx deploy mainnet_buy_bit10_backend
    ```
