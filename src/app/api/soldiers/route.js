import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ดึงข้อมูลทั้งหมด
export async function GET() {
  const soldiers = await prisma.soldier.findMany({
    orderBy: { id: 'asc' }
  })
  return Response.json(soldiers)
}

// เพิ่มข้อมูลใหม่
export async function POST(req) {
  const data = await req.json()
  const newSoldier = await prisma.soldier.create({ data })
  return Response.json(newSoldier)
}