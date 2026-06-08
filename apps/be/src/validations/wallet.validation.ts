import { z } from 'zod'

export const createWalletSchema = z.object({
  accountId: z.string().trim().min(1, 'accountId must be a non-empty string'),
  initialBalance: z.preprocess(
    (val) => (val === undefined ? 0 : Number(val)),
    z.number().nonnegative('initialBalance must be a non-negative number')
  )
})

export const transferFundsSchema = z.object({
  transactionId: z.string().uuid('transactionId must be a valid UUID'),
  fromAccountId: z.string().min(1, 'fromAccountId is required'),
  toAccountId: z.string().min(1, 'toAccountId is required'),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().positive('amount must be a positive number')
  )
})

export const accountIdParamSchema = z.object({
  accountId: z.string().min(1, 'accountId is required')
})
