import { Router } from 'express'
import { walletController } from '../controllers/wallet.controller.js'
import { validate } from '../middlewares/validation.middleware.js'
import {
  createWalletSchema,
  transferFundsSchema,
  accountIdParamSchema,
} from '../validations/wallet.validation.js'

const router = Router()

router.post('/wallets', validate(createWalletSchema, 'body'), (req, res) => walletController.createWallet(req, res))
router.get('/wallets', (req, res) => walletController.getAllWallets(req, res))
router.get('/wallets/:accountId/balance', validate(accountIdParamSchema, 'params'), (req, res) => walletController.getWalletBalance(req, res))
router.get('/wallets/:accountId/history', validate(accountIdParamSchema, 'params'), (req, res) => walletController.getWalletHistory(req, res))
router.post('/wallets/transfer', validate(transferFundsSchema, 'body'), (req, res) => walletController.transferFunds(req, res))

export default router
