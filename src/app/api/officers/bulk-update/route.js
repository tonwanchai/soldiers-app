import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const { updates } = await req.json() // ข้อมูลจาก Excel [{name, code}, ...]

    // วนลูปอัปเดตสถานะข้าราชการทุกคน
    for (const item of updates) {
      await prisma.officer.upsert({
        where: { fullName: item.name },
        update: { status: item.code },
        create: { fullName: item.name, status: item.code }
      })
    }

    return NextResponse.json({ message: 'Success' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const officers = await prisma.officer.findMany()
  return NextResponse.json(officers)
}