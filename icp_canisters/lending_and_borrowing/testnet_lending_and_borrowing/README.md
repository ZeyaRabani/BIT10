# Testnet Lending and Borrowing Canister

A decentralized lending and borrowing platform built on the Internet Computer, enabling users to leverage their BIT10 tokens as collateral to borrow various assets across different blockchain networks. This canister handles the core logic for managing lending offers and borrowing requests, ensuring secure and transparent financial operations.

## 🌟 Overview

This project provides the backend infrastructure for a cross-chain lending and borrowing protocol, specifically designed to integrate with BIT10 tokens as collateral. The primary goal is to allow users to deposit BIT10 tokens as collateral and borrow other specified tokens, bridging liquidity between the Internet Computer and other supported chains. The canister leverages ICRC-1/ICRC-2 and other token standards for on-chain asset transfers and can interact with external services via secure HTTP outcalls to fetch real-time data like interest rates.

## 🌐 Core Features

- Cross-Chain Collateral & Borrowing: Facilitates lending and borrowing operations where BIT10 tokens (Test BIT10.TOP, Test BIT10.MEME) on the ICP serve as collateral for borrowing other designated assets.
- Dynamic Interest Rates: Integrates with external HTTP APIs via `ic_cdk::api::management_canister::http_request` to fetch real-time interest rates, allowing for flexible and market-driven lending/borrowing terms.
- Robust Input Validation: Ensures all provided Principal IDs (lender, borrower, token ledgers) are valid, preventing common errors and potential vulnerabilities.
- Modular Architecture: Codebase is split into logical modules (`types`, `storage`, `controllers`, `lend_borrow`, `http_client`, `canister_config`) for enhanced maintainability, readability, and scalability.
- Stable Memory Management: Employs `ic-stable-structures` for persistent storage of canister configurations (like controllers), allowing state to survive canister upgrades.

## 📐 Architecture Overview

```mermaid
graph TD
    subgraph "Frontend (DApp)"
        User[User Interface]
    end

    User -- "1. Request Lend/Borrow" --> LBC_Canister[BIT10 Lending & Borrowing Canister]

    subgraph "BIT10 Lending & Borrowing Canister"
        direction LR

        subgraph "Core Logic"
            LB_Functions[lend / borrow functions]
            HTTP_Client[HTTP Client for External Data]
            Controller_Manager[Canister Controller Management]
        end

        LB_Functions -- "2a. Validate Inputs" --> LBC_Canister
        LB_Functions -- "2b. Check Controller Auth" --> Controller_Manager

        LB_Functions -- "3a. Fetch Interest Rate" --> HTTP_Client
        HTTP_Client -- "External API Call (e.g., DeFi Oracle)" --> External_Interest_Rate_API[External Interest Rate API]
        External_Interest_Rate_API -- "Interest Rate (e.g., 4.5%)" --> HTTP_Client

        LB_Functions -- "4a. ICRC-2 transfer_from (Collateral)" --> Collateral_Ledger[Collateral Token Ledger - BIT10.TOP, BIT10.MEME]
        LB_Functions -- "4b. ICRC-1 transfer (Borrowed Tokens)" --> Borrow_Token_Ledger[Borrowed Token Ledger - USDC, wBTC]

        Collateral_Ledger -- "Block Index / Error" --> LB_Functions
        Borrow_Token_Ledger -- "Block Index / Error" --> LB_Functions

        LB_Functions -- "5. Respond with Transaction Details" --> LBC_Canister
    end

    LBC_Canister -- "6. Response (Tx Hashes, Status, Rates)" --> User

    style External_Interest_Rate_API fill:#f9f,stroke:#333,stroke-width:2px
    style Collateral_Ledger fill:#ccf,stroke:#333,stroke-width:2px
    style Borrow_Token_Ledger fill:#cfc,stroke:#333,stroke-width:2px
```

## 🔗 ICP Canisters

- BIT10 Testnet Cross-Chain Lending and Borrowing: [dp57e-fyaaa-aaaap-qqclq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=dp57e-fyaaa-aaaap-qqclq-cai)

## 🏁 Getting Started

To start using BIT10 Testnet Cross-Chain Lending and Borrowing canister, follow these steps:

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/ZeyaRabani/BIT10.git
    ```

2. **Go to dex folder**:
    ```bash
    cd icp_canister/lending_and_borrowing/testnet_lending_and_borrowing
    ```

3. **Start the dfx locally and run the canister**:
    ```bash
    dfx start --background

    dfx deploy
    ```
