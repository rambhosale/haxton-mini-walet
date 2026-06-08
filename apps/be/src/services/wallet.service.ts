import { prisma } from '../db.js'
import { randomUUID } from 'node:crypto'
import type { WalletAccount, LedgerHistoryItem } from '@repo/shared-types'

export class WalletService {
  async createWallet(accountId: string, initialBalance: number) {
    const cleanAccountId = accountId.trim()
    const existing = await prisma.walletAccount.findUnique({
      where: { accountId: cleanAccountId }
    })
    if (existing) {
      throw new Error(`Account with ID '${cleanAccountId}' already exists`)
    }

    const cleanInitial = Math.round(initialBalance * 100) / 100
    if (initialBalance > 0 && cleanInitial <= 0) {
      throw new Error('Initial deposit must be at least 0.01 after rounding')
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.walletAccount.create({
        data: { accountId: cleanAccountId }
      })

      if (cleanInitial > 0) {
        const txId = randomUUID()
        const createdTx = await tx.transaction.create({ data: {} })
        await tx.idempotency.create({
          data: {
            key: txId,
            transactionId: createdTx.id
          }
        })
        await tx.ledgerEntry.create({
          data: {
            transactionId: createdTx.id,
            accountId: cleanAccountId,
            amount: cleanInitial
          }
        })
      }

      return wallet
    })
  }

  async getAllWallets() {
    return prisma.walletAccount.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  async getWalletBalance(accountId: string) {
    const account = await prisma.walletAccount.findUnique({
      where: { accountId }
    })
    if (!account) {
      throw new Error('Account not found')
    }

    const balanceResult = await prisma.ledgerEntry.aggregate({
      where: { accountId },
      _sum: { amount: true }
    })

    const balance = balanceResult._sum.amount ?? 0
    return { accountId, balance: Math.round(balance * 100) / 100 }
  }

  async getWalletHistory(accountId: string): Promise<LedgerHistoryItem[]> {
    const account = await prisma.walletAccount.findUnique({
      where: { accountId }
    })
    if (!account) {
      throw new Error('Account not found')
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: { accountId },
      include: { transaction: true },
      orderBy: { timestamp: 'desc' }
    })

    return entries.map(entry => ({
      id: entry.id,
      transactionId: entry.transaction.uuid,
      type: entry.amount >= 0 ? 'credit' : 'debit',
      amount: Math.abs(entry.amount),
      timestamp: entry.timestamp
    }))
  }

  async transferFunds(transactionId: string, fromAccountId: string, toAccountId: string, amount: number) {
    if (fromAccountId === toAccountId) {
      throw new Error('Source and destination accounts must be different')
    }
    if (amount <= 0) {
      throw new Error('amount must be a positive number')
    }

    const cleanAmount = Math.round(amount * 100) / 100
    if (cleanAmount <= 0) {
      throw new Error('amount must be at least 0.01 after rounding')
    }

    return prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      const existingIdempotency = await tx.idempotency.findUnique({
        where: { key: transactionId },
        include: { transaction: true }
      })
      if (existingIdempotency) {
        return {
          idempotent: true,
          success: true,
          transactionId: existingIdempotency.transaction.uuid,
          message: 'Transaction already processed'
        }
      }

      // 2. Account existence checks
      const fromAcc = await tx.walletAccount.findUnique({ where: { accountId: fromAccountId } })
      if (!fromAcc) {
        throw new Error(`Source account '${fromAccountId}' does not exist`)
      }
      const toAcc = await tx.walletAccount.findUnique({ where: { accountId: toAccountId } })
      if (!toAcc) {
        throw new Error(`Destination account '${toAccountId}' does not exist`)
      }

      // 3. Balance verification
      const balanceAgg = await tx.ledgerEntry.aggregate({
        where: { accountId: fromAccountId },
        _sum: { amount: true }
      })
      const balance = balanceAgg._sum.amount ?? 0
      if (balance < cleanAmount) {
        throw new Error(`Insufficient funds: account '${fromAccountId}' balance is ${balance}, cannot transfer ${cleanAmount}`)
      }

      // 4. Create Transaction record
      const createdTx = await tx.transaction.create({ data: {} })

      // 5. Create Idempotency record
      await tx.idempotency.create({
        data: {
          key: transactionId,
          transactionId: createdTx.id
        }
      })

      // 6. Debit source
      await tx.ledgerEntry.create({
        data: {
          transactionId: createdTx.id,
          accountId: fromAccountId,
          amount: -cleanAmount
        }
      })

      // 7. Credit destination
      await tx.ledgerEntry.create({
        data: {
          transactionId: createdTx.id,
          accountId: toAccountId,
          amount: cleanAmount
        }
      })

      return {
        idempotent: false,
        success: true,
        transactionId: createdTx.uuid
      }
    })
  }
}

export const walletService = new WalletService()
