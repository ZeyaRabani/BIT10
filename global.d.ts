/* eslint-disable @typescript-eslint/no-explicit-any */
interface Window {
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
