import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function POST() {
  // ใช้ SQL คำสั่งเดียวสั่งให้ status กลับไปเท่ากับ department
  await prisma.$executeRawUnsafe(`UPDATE Soldier SET status = department`)
  return Response.json({ success: true })
}