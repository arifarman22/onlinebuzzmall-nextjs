import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number, currency = '$'): string {
  return `${currency}${amount.toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateTrx(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateOrderNo(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = letters.charAt(Math.floor(Math.random() * 26)) + letters.charAt(Math.floor(Math.random() * 26));
  const numbers = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${numbers}`;
}

export function getStatusBadge(status: number): { label: string; color: string } {
  switch (status) {
    case 0: return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    case 1: return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    case 2: return { label: 'Processing', color: 'bg-blue-100 text-blue-800' };
    case 3: return { label: 'Rejected', color: 'bg-red-100 text-red-800' };
    default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  }
}

export function getPaymentStatusBadge(status: number): { label: string; color: string } {
  switch (status) {
    case 0: return { label: 'Initiated', color: 'bg-gray-100 text-gray-800' };
    case 1: return { label: 'Approved', color: 'bg-green-100 text-green-800' };
    case 2: return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    case 3: return { label: 'Rejected', color: 'bg-red-100 text-red-800' };
    default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  }
}
