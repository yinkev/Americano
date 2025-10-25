// Compatibility shim: unify imports that expect '@/generated/prisma'
// to the actual Prisma Client from '@prisma/client'.
export * from '@prisma/client'
export { PrismaClient } from '@prisma/client'

