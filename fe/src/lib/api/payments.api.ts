import { apiClient } from './client';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  escrow: number;
  totalEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'EARNED' | 'WITHDRAW' | 'ESCROW' | 'DEPOSIT' | 'REFUND';
  amount: number;
  description: string;
  descKey?: string;
  descParams?: any;
  date: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

export interface DepositDto {
  amount: number;
  gateway: string;
}

export interface WithdrawDto {
  amount: number;
  method: string;
  details: string;
}

export const paymentsApi = {
  getWallet: async (): Promise<Wallet> => {
    const response = await apiClient.get('/payments/wallet');
    return response.data.data;
  },

  deposit: async (data: DepositDto): Promise<{ success: boolean; transactionId: string }> => {
    const response = await apiClient.post('/payments/deposit', data);
    return response.data.data;
  },

  withdraw: async (data: WithdrawDto): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/payments/withdraw', data);
    return response.data.data;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await apiClient.get('/payments/transactions');
    return response.data.data;
  },
};
