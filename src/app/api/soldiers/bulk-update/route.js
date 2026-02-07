import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function POST(req) {
  const { groups } = await req.json()

  try {
    // ใช้ Transaction เพื่อความชัวร์ว่าข้อมูลอัปเดตครบทุกกลุ่ม
    await prisma.$transaction(async (tx) => {
      for (const [status, ids] of Object.entries(groups)) {
        // 1. อัปเดตคนที่มีชื่อในลิสต์ให้เป็น status นั้นๆ
        if (ids.length > 0) {
          await tx.soldier.updateMany({
            where: { id: { in: ids } },
            data: { status: status }
          })
        }

        // 2. คนที่เคยมี status นี้ แต่ตอนนี้ไม่มีชื่อในลิสต์ (โดนลบออก)
        // ให้เด้งกลับไปเป็นสายงานเดิม (status = department)
        const idListStr = ids.length > 0 ? ids.join(',') : '0'
        await tx.$executeRawUnsafe(`
          UPDATE Soldier 
          SET status = department 
          WHERE status = '${status}' AND id NOT IN (${idListStr})
        `)
      }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}