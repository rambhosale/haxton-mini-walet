import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate = (schema: ZodSchema, target: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parseResult = schema.safeParse(req[target])
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((err) => err.message).join(', ')
      res.status(400).json({ error: errorMsg })
      return
    }
    // Assign parsed data back to target to guarantee types
    req[target] = parseResult.data
    next()
  }
}
