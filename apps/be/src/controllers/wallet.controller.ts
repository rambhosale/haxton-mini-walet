import { Request, Response } from 'express'
import { walletService } from '../services/wallet.service.js'

export class WalletController {
  async createWallet(req: Request, res: Response): Promise<void> {
    try {
      const { accountId, initialBalance } = req.body
      const wallet = await walletService.createWallet(accountId, initialBalance)
      res.status(201).json(wallet)
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Internal Server Error' })
    }
  }

  async getAllWallets(req: Request, res: Response): Promise<void> {
    try {
      const wallets = await walletService.getAllWallets()
      res.json(wallets)
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
  }

  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params
      const balance = await walletService.getWalletBalance(accountId)
      res.json(balance)
    } catch (error: any) {
      const status = error.message === 'Account not found' ? 404 : 400
      res.status(status).json({ error: error.message || 'Internal Server Error' })
    }
  }

  async getWalletHistory(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params
      const history = await walletService.getWalletHistory(accountId)
      res.json(history)
    } catch (error: any) {
      const status = error.message === 'Account not found' ? 404 : 500
      res.status(status).json({ error: error.message || 'Internal Server Error' })
    }
  }

  async transferFunds(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId, fromAccountId, toAccountId, amount } = req.body
      const result = await walletService.transferFunds(transactionId, fromAccountId, toAccountId, amount)
      res.json(result)
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Internal Server Error' })
    }
  }
}

export const walletController = new WalletController()
