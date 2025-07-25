# BIT10

BIT10 pioneers the concept of an "S&P 500 for crypto assets." It provides users with a streamlined way to diversify their exposure to DeFi assets by tracking major crypto tokens, including BRC-20s and ERC-20s, across the ecosystem.

## 🖥️ Presentation

For the World Computer Hacker League (WCHL) 2025, we have created the following demo videos to help you better understand BIT10. Please start by watching the Loom video presentation — it provides a smooth walkthrough of the platform.

- Loom Overview: [loom.com/share/db31b0fcfceb4738828cebd976c7e8fb](https://www.loom.com/share/db31b0fcfceb4738828cebd976c7e8fb)
- Auto-Rebalancing Demo: [youtube.com/watch?v=ICuc97bdzbw](https://www.youtube.com/watch?v=ICuc97bdzbw)
- BIT10 Technical Demo: [youtube.com/watch?v=NdYtbdXXe1Y](https://www.youtube.com/watch?v=NdYtbdXXe1Y)
- BIT10 Testnet DEX Demo: [youtube.com/watch?v=zTjBIXnzJ1s ](https://www.youtube.com/watch?v=zTjBIXnzJ1s )

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

- **`icp_canister/`** - Contains all the canisters on ICP

  - **`asset_storage/`** - Contains canister code for storing different token types:
    - `bsc_asset_storage/` - Stores BNB and BEP20 tokens.
    - `erc20_asset_storage/` - Stores ETH and ERC-20 tokens.
    - `icp_asset_storage/` - Stores ICP tokens.
    - `sui_asset_storage/` - Stores SUI tokens.
    - `trx_asset_storage/` - Stores TRX tokens.

  - **`buy_bit10/`** - Swap logic (buying BIT10 tokens) on ICP.
  
  - **`dex/`** - DEX Swap logic (buying tokens on same and cross-chain) on ICP.

  - **`liquidity_hub/`**
    - `testnet_liquidity_hub/` - Canister code for the Liquidity Hub on ICP testnet.

- **`sol_smart_contracts/`**
  - `buy_bit10/` - Swap logic (buying BIT10 tokens with SOL) on Solana Devnet.

- **`server/`** - Lightweight Node.js server for serving data to the web app.

- **`web_app/`** - Contains frontend code for the BIT10 application.

<!-- * **`asset_storage/`** - Contains canister code for storing different token types:

  * `bsc_asset_storage/` - Stores BNB and BEP20 tokens.
  * `erc20_asset_storage/` - Stores ETH and ERC-20 tokens.
  * `icp_asset_storage/` - Stores ICP tokens.
  * `sui_asset_storage/` - Stores SUI tokens.
  * `trx_asset_storage/` - Stores TRX tokens.

* **`swap/`**

  * `sol_dev/` - Swap logic (buying BIT10 tokens with SOL) on Solana Devnet.

* **`liquidity_hub/`**

  * `icp/`

    * `testnet_liquidity_hub/` - Canister code for the Liquidity Hub on ICP testnet.

* **`oracle/`** - Canister code for price oracle functionality.

* **`server/`** - Lightweight Node.js server for serving data to the web app.

* **`web_app/`** - Contains frontend code for the BIT10 application. -->


## 🛠 Tech Stack

- **Frontend**: Next.js, Shadcn/ui, Aceternity UI, motion-primitives
- **Backend**: tRPC, Drizzle, Nodemailer, Dfinity
- **Auth**: NextAuth
- **Data Visualization**: Recharts

## 🔗 ICP Canisters

- Oracle: [egcpt-yyaaa-aaaap-qp4ia-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=egcpt-yyaaa-aaaap-qp4ia-cai)
- BIT10.BTC Faucet: [5wxtf-uqaaa-aaaap-qpvha-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=5wxtf-uqaaa-aaaap-qpvha-cai)
- BIT10 Exchange Canister: [6phs7-6yaaa-aaaap-qpvoq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=6phs7-6yaaa-aaaap-qpvoq-cai)
- BIT10 Testnet Liquidity Hub: [jskxc-iiaaa-aaaap-qpwrq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=jskxc-iiaaa-aaaap-qpwrq-cai)
- BIT10 Testnet DEX: [vlda4-oaaaa-aaaap-qp7cq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=vlda4-oaaaa-aaaap-qp7cq-cai)
- BIT10.BTC: [eegan-kqaaa-aaaap-qhmgq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=eegan-kqaaa-aaaap-qhmgq-cai)
- Test BIT10.DEFI: [hbs3g-xyaaa-aaaap-qhmna-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=hbs3g-xyaaa-aaaap-qhmna-cai)
- Test BIT10.BRC20: [uv4pt-4qaaa-aaaap-qpuxa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=uv4pt-4qaaa-aaaap-qpuxa-cai)
- Test BIT10.TOP: [wbckh-zqaaa-aaaap-qpuza-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=wbckh-zqaaa-aaaap-qpuza-cai)
- Test BIT10.MEME: [yeoei-eiaaa-aaaap-qpvzq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=yeoei-eiaaa-aaaap-qpvzq-cai)
- BIT10.DEFI: [bin4j-cyaaa-aaaap-qh7tq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bin4j-cyaaa-aaaap-qh7tq-cai)
- BIT10.TOP: [g37b3-lqaaa-aaaap-qp4hq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=g37b3-lqaaa-aaaap-qp4hq-cai)

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
