import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (value: number, options: Intl.NumberFormatOptions = {}) =>
  Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 2,
    ...options
  }).format(value);

export const formatPercent = (value: number, options: Intl.NumberFormatOptions = {}) =>
  Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
