import type { PrismaClient as PrismaClientType } from '@prisma/client'

const shouldRun = process.env.RUN_DB_INTEGRATION === '1' && !!process.env.DATABASE_URL

const describeIf = shouldRun ? describe : describe.skip

describeIf('DB integration: Prisma smoke', () => {
  let prisma: PrismaClientType

  beforeAll(async () => {
    const { PrismaClient } = jest.requireActual('@prisma/client') as {
      PrismaClient: new () => PrismaClientType
    }
    prisma = new PrismaClient()
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('SELECT 1 returns { one: 1 }', async () => {
    const rows = await (prisma as any).$queryRaw<{ one: number }[]>`SELECT 1 as one`
    expect(Array.isArray(rows)).toBe(true)
    expect(rows[0]).toHaveProperty('one', 1)
  })
})