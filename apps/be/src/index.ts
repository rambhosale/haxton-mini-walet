import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Load .env first if present
dotenv.config({ path: path.resolve(__dirname, '../.env') })
// Fallback to .env.local for variables not defined in .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import walletRoutes from './routes/wallet.js'

const app = express()

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}))
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Wallet Endpoints
app.use('/api', walletRoutes)

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
