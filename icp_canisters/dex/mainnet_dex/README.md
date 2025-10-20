# DEX

A robust cross-chain Decentralized Exchange (DEX) canister built on the Internet Computer Protocol (ICP). This canister enables users to seamlessly swap tokens across multiple blockchain networks.
## 🌟 Overview

The Interchain DEX Canister facilitates token swaps on and between several prominent blockchain networks:

-   **Internet Computer Protocol (ICP)**: Native swaps within the ICP ecosystem.
-   **Base**: Swaps with assets on the Base network.
-   **Solana**: Swaps with assets on the Solana network.
-   **Binance Smart Chain (BSC)**: Swaps with assets on the Binance Smart Chain.

## 📐 Architecture Overview

```mermaid
flowchart TD
    A[User Interface/DApp] --> B(Interchain DEX Canister)

    subgraph ICP Canister
        B --> C{ICP Services}
        B --> D[State Management]
        B --> E[Wallet Management]
        C --> F[ICP Swap Logic]
    end

    E --> G[ECDSA Wallet]
    E --> H[Ed25519 Wallet]

    C --> I[Base Transaction Service]
    C --> J[Solana Transaction Service]
    C --> K[BSC Transaction Service]

    I --> L(Base RPC/Network)
    J --> M(Solana RPC/Network)
    K --> N(BSC RPC/Network)

    style A stroke:#333,stroke-width:2px
    style B stroke:#333,stroke-width:2px
    style C stroke:#333,stroke-width:1px
    style D stroke:#333,stroke-width:1px
    style E stroke:#333,stroke-width:1px
    style F stroke:#333,stroke-width:1px
    style G stroke:#333,stroke-width:1px
    style H stroke:#333,stroke-width:1px
    style I stroke:#333,stroke-width:1px
    style J stroke:#333,stroke-width:1px
    style K stroke:#333,stroke-width:1px
    style L stroke:#333,stroke-width:1px
    style M stroke:#333,stroke-width:1px
    style N stroke:#333,stroke-width:1px

    linkStyle 0 stroke:#333,stroke-width:1.5px,fill:none,stroke-dasharray: 5 5;
```

## 🔗 ICP Canisters

- BIT10 DEX Canister: [bwwo2-dqaaa-aaaap-qqfzq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bwwo2-dqaaa-aaaap-qqfzq-cai)

## 🔧 Configuration

The system uses several configuration parameters:

- Liquidity Provider Fee: 1% on swaps

## 🏁 Getting Started

To start using BIT10 Testnet DEX BSC Asset Storage canister, follow these steps:

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/ZeyaRabani/BIT10.git
    ```

2. **Go to dex folder**:
    ```bash
    cd icp_canister/dex/mainnet_dex
    ```

3. **Start the dfx locally and run the canister**:
    ```bash
    dfx start --background

    dfx deploy mainnet_dex_backend --argument '(opt record {base_network = opt variant {Sepolia}; bsc_network = opt variant {Testnet}; solana_network = opt variant {Devnet}; ecdsa_key_name = opt variant {TestKeyLocalDevelopment}; ed25519_key_name = opt variant {LocalDevelopment}})'
    ```
