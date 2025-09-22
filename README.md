# BIT10

BIT10 pioneers the concept of an "S&P 500 for crypto assets." It provides users with a streamlined way to diversify their exposure to DeFi assets by tracking major crypto tokens, including BRC-20s and ERC-20s, across the ecosystem.

## 🖥️ Presentation

For the World Computer Hacker League (WCHL) 2025, we have created the following demo videos to help you better understand BIT10. Please start by watching the Loom video presentation - it provides a smooth walkthrough of the platform.

<!-- - Pitch Video: [youtu.be/Mceef9ahg_A](https://youtu.be/Mceef9ahg_A)
- Pitch Deck: [BIT10 WCHL Deck.pdf](https://github.com/user-attachments/files/21993258/BIT10.WCHL.Deck.pdf)
- WCHL National Round BIT10 Demo: [youtube.com/watch?v=YQdF3uXAY4A](https://www.youtube.com/watch?v=YQdF3uXAY4A)
- WCHL National Round Cross Chain Lending and Borrowing: [youtube.com/watch?v=DCkX21094Ng](https://www.youtube.com/watch?v=DCkX21094Ng)
- WCHL National Round Cross Chain DEX: [youtube.com/watch?v=sEe__ZwVW8U](https://www.youtube.com/watch?v=sEe__ZwVW8U)
- WCHL National Round Market Cap Rebalance: [youtube.com/watch?v=UQW2NAXfGts](https://www.youtube.com/watch?v=UQW2NAXfGts)
- WCHL National Round AI Portfolio Manager: [youtube.com/watch?v=tVY_6PrMrU4](https://www.youtube.com/watch?v=tVY_6PrMrU4) -->

- Pitch Video: [youtube.com/watch?v=SXsD1xcYf2A](https://www.youtube.com/watch?v=SXsD1xcYf2A) 
- WCHL Regional Round BIT10 Code Structure Demo: [youtube.com/watch?v=64hIUoCsRNo](https://www.youtube.com/watch?v=64hIUoCsRNo) 
- WCHL Regional Round BIT10 Demo: [youtube.com/watch?v=_AT_RgoXSog](https://www.youtube.com/watch?v=_AT_RgoXSog)
- WCHL Regional Round Cross Chain Lending and Borrowing Demo: [youtube.com/watch?v=GnrcTsCXQco](https://www.youtube.com/watch?v=GnrcTsCXQco)
- WCHL Regional Buy BIT10 on Base Mainnet Demo: [youtube.com/watch?v=qfaFKKOQZVs](https://www.youtube.com/watch?v=qfaFKKOQZVs)

### Extra instructions on how to use the entire system and FAQ's are in the Part 3 of the Gitbook.

- [gitbook.bit10.app](https://gitbook.bit10.app)

## 🚀 The Problem

Investing in DeFi is often complex, requiring extensive research. Buying individual tokens can be costly and inefficient, and most users end up with unbalanced portfolios that increase risk and expose them to underperforming assets.

## 💡 The Solution

BIT10 offers a pre-selected, diversified basket of assets, significantly reducing research time and transaction costs. Users can gain diversified exposure by purchasing a single token. With auto-rebalancing, BIT10 continuously optimizes portfolio performance by replacing underperforming assets with stronger performers.

## 🌐 Features

- **Diversified Exposure**: Gain exposure to multiple DeFi assets with a single token.
- **Auto-Rebalancing**: Regularly updates asset allocations to optimize performance.
- **Decentralized ETF**: Fully decentralized structure powered by the Internet Computer (ICP).

## 📂 Code Structure

### 🪴 Branches

* **`main`**: Contains code for Mainnet, including Smart Contracts/Canisters.
* **`testnet`**: Contains code for the Testnet version of the website.

### 🌲 Main Branch Folder Structure

⚠️ Steps to run the canister and the related architecture diagrams are present in their respective folders.

- **`icp_canisters/`** - Contains all the canisters on the ICP canister.

  - **`asset_storage/`** - Contains canister code for storing different token types:
    - `bsc_asset_storage/` - Stores BNB and BEP20 tokens.
    - `eth_asset_storage/` - Stores ETH and ERC-20 tokens.
    - `icp_asset_storage/` - Stores ICP tokens.
    - `sui_asset_storage/` - Stores SUI tokens.
    - `trx_asset_storage/` - Stores TRX tokens.

  - **`buy_bit10/`** - Swap logic for buying and selling BIT10 tokens on the ICP canister.
    - `testnet_buy_bit10/` - Canister code for buying Test BIT10 across different chains on the ICP canister.
    - `mainnet_buy_bit10/` - Canister code for buying BIT10 across different chains on the ICP canister.
  
  - **`ai_portfolio_manager/`** - AI Portfolio Manager canister running on the ICP canister.
  
  - **`dex/`** - DEX swap logic for same-chain and cross-chain token swaps on the ICP canister.
    - `testnet_dex_router/` - Canister code for the DEX router.
    - `testnet_dex_eth_asset_storage/` - Canister code for swapping tokens on Ethereum.
    - `testnet_dex_bsc_asset_storage/` - Canister code for swapping token on BSC.
    - `testnet_dex_bsc_eth_asset_storage/` - Canister code for swapping token between BSC and Ethereum.

  - **`lending_and_borrowing/`**
    - `testnet_lending_and_borrowing/` - Canister code for the Cross-Chain Lending and Borrowing on the ICP canister.

  - **`liquidity_hub/`**
    - `testnet_liquidity_hub/` - Canister code for the Liquidity Hub on ICP testnet.

- **`sol_smart_contracts/`**
  - `buy_bit10/` - Swap logic (buying BIT10 tokens with SOL) on Solana Devnet.

- **`server/`** - Lightweight Node.js server for serving data to the web app.

- **`web_app/`** - Contains frontend code for the BIT10 application.

## 🛠 Tech Stack

- **Frontend**: Next.js, Shadcn/ui, Aceternity UI, motion-primitives
- **Backend**: tRPC, Drizzle, Nodemailer, Dfinity
- **Auth**: NextAuth
- **Data Visualization**: Recharts

## 🔗 ICP Canisters

- Oracle: [egcpt-yyaaa-aaaap-qp4ia-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=egcpt-yyaaa-aaaap-qp4ia-cai)
- AI Portfolio Manager: [anic3-viaaa-aaaap-qqcaq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=anic3-viaaa-aaaap-qqcaq-cai)
- BIT10.BTC Faucet: [5wxtf-uqaaa-aaaap-qpvha-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=5wxtf-uqaaa-aaaap-qpvha-cai)
- BIT10 Exchange Canister: [6phs7-6yaaa-aaaap-qpvoq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=6phs7-6yaaa-aaaap-qpvoq-cai)
- BIT10 Testnet Buy Canister: [feujt-7iaaa-aaaap-qqc4q-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=feujt-7iaaa-aaaap-qqc4q-cai)
- BIT10 Testnet Liquidity Hub: [jskxc-iiaaa-aaaap-qpwrq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=jskxc-iiaaa-aaaap-qpwrq-cai)
- BIT10 Testnet DEX: [t2vfi-5aaaa-aaaap-qqbfa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=t2vfi-5aaaa-aaaap-qqbfa-cai)
- BIT10 Testnet Cross-Chain Lending and Borrowing: [dp57e-fyaaa-aaaap-qqclq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=dp57e-fyaaa-aaaap-qqclq-cai)
- BIT10.BTC: [eegan-kqaaa-aaaap-qhmgq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=eegan-kqaaa-aaaap-qhmgq-cai)
- Test BIT10.DEFI: [hbs3g-xyaaa-aaaap-qhmna-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=hbs3g-xyaaa-aaaap-qhmna-cai)
- Test BIT10.BRC20: [uv4pt-4qaaa-aaaap-qpuxa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=uv4pt-4qaaa-aaaap-qpuxa-cai)
- Test BIT10.TOP: [wbckh-zqaaa-aaaap-qpuza-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=wbckh-zqaaa-aaaap-qpuza-cai)
- Test BIT10.TOP (ERC20): [0x00Cb097146a5D2b1C0dFeff3A5E3b2c21Fb2864D](https://sepolia.etherscan.io/token/0x00Cb097146a5D2b1C0dFeff3A5E3b2c21Fb2864D)
- Test BIT10.MEME: [yeoei-eiaaa-aaaap-qpvzq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=yeoei-eiaaa-aaaap-qpvzq-cai)
- BIT10.DEFI: [bin4j-cyaaa-aaaap-qh7tq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bin4j-cyaaa-aaaap-qh7tq-cai)
- BIT10.TOP: [g37b3-lqaaa-aaaap-qp4hq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=g37b3-lqaaa-aaaap-qp4hq-cai)
- BIT10.TOP (Base): [0x2d309c7c5fbbf74372edfc25b10842a7237b92de](https://basescan.org/token/0x2d309c7c5fbbf74372edfc25b10842a7237b92de)

- BIT10.TOP Asset storage canister:
  - ETH Asset Storage: [g46hp-giaaa-aaaap-qp4ha-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=g46hp-giaaa-aaaap-qp4ha-cai)

<!-- - Old Oracle: [fg5vt-paaaa-aaaap-qhhra-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=fg5vt-paaaa-aaaap-qhhra-cai) -->
<!-- - BIT10.BRC20: [7bi3r-piaaa-aaaap-qpnrq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=7bi3r-piaaa-aaaap-qpnrq-cai) -->
<!-- - ICP Asset Storage: [yymp3-uaaaa-aaaap-qklqa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=yymp3-uaaaa-aaaap-qklqa-cai) -->
<!-- - ERC20 Asset Storage Sepolia Testnet: [zkrig-uqaaa-aaaap-qkmiq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=zkrig-uqaaa-aaaap-qkmiq-cai) -->
<!-- - ERC20 Asset Storage: [2bh6f-siaaa-aaaap-qkmca-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2bh6f-siaaa-aaaap-qkmca-cai) -->
<!-- - BRC20 Asset Storage: [2tbj4-6yaaa-aaaap-qkmba-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2tbj4-6yaaa-aaaap-qkmba-cai) -->
<!-- - OLD ERROR BRC20 Asset Storage: [2xxwk-lyaaa-aaaap-qkl4q-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2xxwk-lyaaa-aaaap-qkl4q-cai) -->

## 🔗 Solana Programs & SPL Tokens

### Devnet

- BIT10 Exchange Canister: [DKEKk7aLibx28g6DVMZXk3MinED489KRHfoM3wnnrd2s](https://solana.fm/address/DKEKk7aLibx28g6DVMZXk3MinED489KRHfoM3wnnrd2s?cluster=devnet-solana)
- Test BIT10.DEFI: [5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K](https://solana.fm/address/5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K?cluster=devnet-solana)

## 🏁 Getting Started

To start using BIT10, follow these steps:

1. **Navigate to web_app**:
    ```bash
    cd web_app
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Run the App**:
    ```bash
    npm run dev
    ```

3. **Access** the app at [http://localhost:3000](http://localhost:3000).

## 📐 Architecture Overview

BIT10 is structured using:

- **Next.js** for the frontend framework.
- **Node.js** for the backend framework.
- **Rust** for the ICP Canisters
- **Dfinity** for decentralized canister management.
- **Drizzle ORM** for efficient database interaction.
- **tRPC** for type-safe API routing.
