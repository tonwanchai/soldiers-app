import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// แก้ไขข้อมูลรายคน
export async function PUT(req, { params }) {
  try {
    // เพิ่ม await ตรงนี้เพื่อให้ได้ค่า id ที่ถูกต้อง
    const { id } = await params; 
    const data = await req.json();

    const updated = await prisma.soldier.update({
      where: { id: parseInt(id) },
      data: {
        fullName: data.fullName,
        batch: data.batch,
        department: data.department,
        // ไม่ต้องอัปเดต status ตรงนี้เพื่อป้องกันยอดรวน
      }
    });
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ลบรายชื่อ
export async function DELETE(req, { params }) {
  try {
    const { id } = await params; // เพิ่ม await ตรงนี้ด้วย
    await prisma.soldier.delete({
      where: { id: parseInt(id) }
    });
    return Response.json({ message: 'Deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}