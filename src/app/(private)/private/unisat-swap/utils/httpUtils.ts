/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'

export enum NetworkType {
    livenet = 'livenet',
    testnet = 'testnet',
}

export const NETWORK = NetworkType.testnet

export const isTestnet = NETWORK === NetworkType.testnet;

// let apiKey = localStorage.getItem('apiKey') || '';
let apiKey = 'b783c37399c7dc8097518a3d61b0f863989c048dfa9c8c911fe8a989335b7ae2';

export function setApiKey(key: string) {
    apiKey = key;
}

const api = axios.create({
    baseURL: isTestnet ? 'https://open-api-fractal-testnet.unisat.io' : 'https://open-api.unisat.io/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${apiKey}`;
    return config;
})

export const get = async (url: string, params?: any) => {
    const res = await api.get(url, { params });
    if (res.status !== 200) {
        throw new Error(res.statusText);
    }

    const responseData = res.data;

    if (responseData.code !== 0) {
        throw new Error(responseData.msg);
    }
    return responseData.data;
};

export const post = async (url: string, data?: any) => {
    const res = await api.post(url, data,);
    if (res.status !== 200) {
        throw new Error(res.statusText);
    }

    const responseData = res.data;
    console.log(responseData);

    if (responseData.code !== 0) {
        throw new Error(responseData.msg);
    }

    return responseData.data;
}