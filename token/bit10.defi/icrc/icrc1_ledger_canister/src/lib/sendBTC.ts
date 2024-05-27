import store from 'store';

export const saveToLocalStorage = (key: string, item: any): void => {
    try {
        store.set(key, item);
    } catch (e) {
        // console.error(e);
    }
};

export const loadFromLocalStorage = (key: string): any | undefined => {
    try {
        const stateStr = store.get(key);
        return stateStr ? stateStr : undefined;
    } catch (e) {
        return undefined;
    }
};

export const clearLocalStorage = (): void => {
    try {
        store.clearAll();
    } catch (e) {
        // console.error(e);
    }
};
