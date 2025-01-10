# Oracle

The Oracle canister is responsible for checking the price feed of Index fund tokens. 

### 🌐 **Features**

- **On-Chain Data**: Fully decentralized on-data for price feed powered by Chainsight.
- **Token Supply Info**: Live token supply info

### 🛠 **Tech Stack**

- **Backend**: Snapshot Indexer HTTPS, Algorithm Lens, and Relayer
- **Data hub**: Chainsight

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

If you have made changes to your backend canister, you can generate a new candid interface with

```bash
npm run generate
```

at any time. This is recommended before starting the frontend development server, and will be run automatically any time you run `dfx deploy`.

If you are making frontend changes, you can start a development server with

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.
