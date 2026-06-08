declare namespace Express {
  interface Request {
    user?: {
      id: string
      email: string
      emailVerified: boolean
      name: string
      createdAt: Date
      updatedAt: Date
      image?: string | null
    }
    session?: {
      id: string
      userId: string
      expiresAt: Date
      token: string
      createdAt: Date
      updatedAt: Date
      ipAddress?: string | null
      userAgent?: string | null
    }
  }
}
