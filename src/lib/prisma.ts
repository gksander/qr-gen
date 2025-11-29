import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '../../generated/prisma/client'

/**
 * Creates a Prisma Client instance configured for Cloudflare D1
 * @param db - The D1 database binding from Cloudflare Workers environment
 * @returns A configured Prisma Client instance
 */
export function createPrismaClient(db: D1Database) {
  const adapter = new PrismaD1(db)
  return new PrismaClient({ adapter })
}

