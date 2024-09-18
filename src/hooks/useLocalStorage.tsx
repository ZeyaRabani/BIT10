"use client"

import { useState, useEffect } from 'react'

export function useLocalStorage<T extends string = string>(
    key: string
): [T | undefined, (value: T | undefined) => void];

export function useLocalStorage<T extends string = string>(
    key: string,
    initialValue: T
): [T, (value: T) => void];

export function useLocalStorage<T extends string = string>(
    key: string,
    initialValue?: T
): [T | undefined, (value: T | undefined) => void] | [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T | undefined>(() => {
        if (typeof window !== 'undefined') {
            const item = localStorage.getItem(key);
            return item ? (item as T) : initialValue;
        }
        return initialValue;
    });

    const setValue = (value: T | undefined) => {
        setStoredValue(value);

        if (typeof window !== 'undefined') {
            if (value === undefined) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, value);
            }
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const item = localStorage.getItem(key);
            if (item) {
                setStoredValue(item as T);
            }
        }
    }, [key]);

    return [storedValue, setValue];
}
