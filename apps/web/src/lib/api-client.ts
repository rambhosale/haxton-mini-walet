import type { WalletAccount, LedgerHistoryItem } from '@repo/shared-types'

const BE_PORT = import.meta.env.BE_PORT || '3001'
const BACKEND_URL = `http://localhost:${BE_PORT}`

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BACKEND_URL}${path}`
    
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `HTTP error ${res.status}: ${res.statusText}`)
    }

    if (res.status === 204) {
      return null as any
    }

    return await res.json() as T
  }

  async getWallets(): Promise<WalletAccount[]> {
    return this.request<WalletAccount[]>('/api/wallets')
  }

  async createWallet(accountId: string, initialBalance: number): Promise<WalletAccount> {
    return this.request<WalletAccount>('/api/wallets', {
      method: 'POST',
      body: JSON.stringify({ accountId, initialBalance }),
    })
  }

  async getWalletBalance(accountId: string): Promise<{ accountId: string; balance: number }> {
    return this.request<{ accountId: string; balance: number }>(`/api/wallets/${accountId}/balance`)
  }

  async getWalletHistory(accountId: string): Promise<LedgerHistoryItem[]> {
    return this.request<LedgerHistoryItem[]>(`/api/wallets/${accountId}/history`)
  }

  async transfer(payload: { transactionId: string; fromAccountId: string; toAccountId: string; amount: number }): Promise<any> {
    return this.request<any>('/api/wallets/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}

export const api = new ApiClient()
