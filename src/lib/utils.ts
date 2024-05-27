import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
var store = require("store");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const saveToLocalStorage = (key: any, item: any) => {
  try {
    store.set(key, item);
  } catch (e) {
    console.error(e);
  }
};

export const loadFromLocalStorage = (key: any) => {
  try {
    const stateStr = store.get(key);
    return stateStr ? stateStr : undefined;
  } catch (e) {
    return undefined;
  }
};

export const clearLocalStorage = () => {
  try {
    store.clearAll();
  } catch (e) {
    console.error(e);
  }
};