/* eslint-disable @typescript-eslint/no-explicit-any */
export type UnisatWalletInterface = {
    getAccounts(): Promise<string[]>;
    requestAccounts(): Promise<string[]>;
    getNetwork(): Promise<string>;
    switchNetwork(network: string): Promise<void>;
    sendBitcoin(address: string, amount: number, options: any): Promise<string>;
    on(event: string, listener: (event: any) => void): void;
    removeListener(event: string, listener: (event: any) => void): void;
    signMessage(message: string, type?: string): Promise<string>;
    signPsbt(psbt: string, opt: { autoFinalized: boolean }): Promise<string>;
    getPublicKey(): Promise<string>;
    getBalance(): Promise<{
        confirmed: number,
        unconfirmed: number,
        total: number
    }>;
    inscribeTransfer(tick: string, amount?: number | string): Promise<{
        amount: string,
        inscriptionId: string
        inscriptionNumber: number
        ticker: string
    }>;
    getInscriptions(num: number): Promise<void>;
    switchChain(network: string): Promise<void>;
}

declare global {
    interface Window {
        unisat: UnisatWalletInterface;
        ic: {
            plug: {
                requestConnect: (options: { whitelist: string[] }) => Promise<void>;
                agent: {
                    getPrincipal: () => Promise<string>;
                };
                requestBalance?: () => Promise<any>;
                requestTransfer?: (args: { to: string; amount: number }) => Promise<any>;
                createActor: (args: { canisterId: string; interfaceFactory: any }) => Promise<any>;
            };
        };
    }
}