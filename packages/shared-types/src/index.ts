export type User = {
  id: string;
  username: string;
  email: string;
};

export type Message = {
  id: string;
  sender: User;
  content: string;
  timestamp: Date;
};

export interface WalletAccount {
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerHistoryItem {
  id: number;
  transactionId: string;
  type: 'credit' | 'debit';
  amount: number;
  timestamp: Date;
}
