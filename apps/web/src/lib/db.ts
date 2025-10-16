// src/lib/db.ts
// Prisma Client singleton with query logging and connection configuration

import { PrismaClient } from '@/generated/prisma'
import { prismaConfig } from '../../prisma/prisma-config'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [...prismaConfig.log],
    errorFormat: prismaConfig.errorFormat,
    datasources: prismaConfig.datasources,
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
