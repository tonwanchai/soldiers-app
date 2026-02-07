const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const soldiers = [
  // กรก.เทิด (8 นาย)
  { fullName: "พลฯรัฐศาสตร์ ตรียุทธ", batch: "2/68", department: "คลังอาวุธ", status: "กรก.เทิด" },
  { fullName: "พลฯจักรพันธุ์ ทองทิพ", batch: "2/68", department: "คลังอาวุธ", status: "กรก.เทิด" },
  { fullName: "พลฯภูริภัชร์ จันทะวงษ์", batch: "2/68", department: "กองร้อย", status: "กรก.เทิด" },
  { fullName: "พลฯภูวิศ พิเศษกุล", batch: "2/68", department: "กองร้อย", status: "กรก.เทิด" },
  { fullName: "พลฯนำพล ลบพึ่งชู", batch: "2/68", department: "กองร้อย", status: "กรก.เทิด" },
  { fullName: "พลฯธิติอนันต์ เขียวชอุ่ม", batch: "2/68", department: "ช่าง", status: "กรก.เทิด" },
  { fullName: "พลฯกฤตภาส อ่อนศรี", batch: "2/68", department: "กองร้อย", status: "กรก.เทิด" },
  { fullName: "พลฯวสุ ศรีพารัตน์", batch: "2/68", department: "พลแตร", status: "กรก.เทิด" },

  // คลังอาวุธ (4 นาย)
  { fullName: "พลฯชินวัฒน์ สายบุตร", batch: "2/68", department: "คลังอาวุธ", status: "คลังอาวุธ" },
  { fullName: "พลฯวรวิช อุ่นอารมณ์", batch: "2/68", department: "กองร้อย", status: "คลังอาวุธ" },
  { fullName: "พลฯนนท์ บัวศรี", batch: "2/68", department: "กองร้อย", status: "คลังอาวุธ" },
  { fullName: "พลฯกัปตัน แจ่มเชื้อ", batch: "2/68", department: "PX", status: "คลังอาวุธ" },

  // เวรปืน (4 นาย)
  { fullName: "พลฯเขมชาติ สีสนิท", batch: "2/68", department: "ช่าง", status: "เวรปืน" },
  { fullName: "พลฯธนเดช พามั่งคั่ง", batch: "2/68", department: "บก.", status: "เวรปืน" },
  { fullName: "พลฯวันชัย ธนาประเสริฐสุข", batch: "2/68", department: "บก.", status: "เวรปืน" },
  { fullName: "พลฯธันยบูรณ์ กมลดำรงสกุล", batch: "2/68", department: "ช่างตัดผม", status: "เวรปืน" },

  // บก. (4 นาย)
  { fullName: "พลฯมนัส เจริญเกษ", batch: "2/68", department: "บก.", status: "บก." },
  { fullName: "พลฯศักดิ์สิทธิ์ โมราลาย", batch: "2/67", department: "บก.", status: "บก." },
  { fullName: "พลฯรัชชานนท์ แก้วกล้า", batch: "1/68", department: "บก.", status: "บก." },
  { fullName: "พลฯพงศธร ทับจันทร์", batch: "1/68", department: "บก.", status: "บก." },

  // ช่าง (1 นาย)
  { fullName: "พลฯเจษฎา ศิริเขียว", batch: "2/68", department: "ช่าง", status: "ช่าง" },

  // PX (3 นาย)
  { fullName: "พลฯกานต์ ศรีวิพัฒน์", batch: "2/67", department: "PX", status: "PX" },
  { fullName: "พลฯมัชพล คลังผา", batch: "2/68", department: "PX", status: "PX" },
  { fullName: "พลฯพงษ์วรินทร์ ประสานสิน", batch: "2/68", department: "PX", status: "PX" },

  // พลแตร (2 นาย)
  { fullName: "พลฯอิทธิพล สืบยาว", batch: "2/67", department: "พลแตร", status: "พลแตร" },
  { fullName: "พลฯภานุวัฒน์ พูลสุข", batch: "2/68", department: "พลแตร", status: "พลแตร" },

  // สวน (4 นาย)
  { fullName: "พลฯธวัชชัย คงแสงบุตร", batch: "2/67", department: "สวน", status: "สวน" },
  { fullName: "พลฯพิศุทธิ์ มณีประสิทธิ์", batch: "2/68", department: "สวน", status: "สวน" },
  { fullName: "พลฯจิรศักดิ์ พิมพาลุน", batch: "2/68", department: "สวน", status: "สวน" },
  { fullName: "พลฯธนกฤต จุมจา", batch: "2/68", department: "สวน", status: "สวน" },

  // ช่างตัดผม (1 นาย)
  { fullName: "พลฯอิสรา สังขดิถี", batch: "2/68", department: "ช่างตัดผม", status: "ช่างตัดผม" },

  // กองร้อย (13 นาย)
  { fullName: "พลฯอนิรุต ทองปาน", batch: "2/68", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯอภิชาติ จันทร์ลอย", batch: "2/67", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯสิทธิโชค จินดา", batch: "2/67", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯอัครชา สายสุจริต", batch: "1/67", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯชยากร พวงทับทิม", batch: "1/68", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯชิติภัทร ศรีใจ", batch: "1/67", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯชานนท์ โพธิ์จิตร", batch: "2/68", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯวัฒนพล สุริวงศ์", batch: "2/68", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯณัฐนันท์ นักร้อง", batch: "2/68", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯพีรรัตน์ ไตรรักษ์ฐาปนกุล", batch: "2/68", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯชัยนัฐ บรรลุกิจ", batch: "2/68", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯอมรินทร์ แก้วศรีงาม", batch: "2/68", department: "กองร้อย", status: "กองร้อย" },
  { fullName: "พลฯสุธีร์ โขงรัมย์", batch: "2/68", department: "กองร้อย", status: "กองร้อย" },

  // กรก.ศรีสมาน (12 นาย)
  { fullName: "พลฯสุรชัย ศรีวงษ์หัตถ์", batch: "2/67", department: "พลแตร", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯธงไชย ตรงคมาลี", batch: "2/68", department: "พลแตร", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯปิติพงษ์ ศรีสวาท", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯพัชรพล ป้อมกล่ำ", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯพงศธร กิจโสภี", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯพีรยุทธ ปีปริต", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯวัชรพล คล้ายวันเพ็ญ", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯณัชพล ศรีสุวรรณ", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯกรกช จูฑะโกสิทธิ์กานนท์", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯณัฐวุฒิ นัยเสถียร", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯณัฐพล อุดมพันธ์", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },
  { fullName: "พลฯชลภัทร ปันเจริญ", batch: "2/68", department: "กองร้อย", status: "กรก.ศรีสมาน" },

  // ผลัดลา (22 นาย)
  { fullName: "พลฯสุทธิชัย เชิดฉาย", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯรอสมี สุขถาวร", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯณัชฐนนท์ นุชนนทรีย์", batch: "2/68", department: "บก.", status: "ผลัดลา" },
  { fullName: "พลฯธีรเจต สนธิ", batch: "2/68", department: "บก.", status: "ผลัดลา" },
  { fullName: "พลฯนพดล เมธากุล", batch: "2/68", department: "PX", status: "ผลัดลา" },
  { fullName: "พลฯธนวัฒน์ ผิวขำ", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯสมบูรณ์ ประกอบทรัพย์", batch: "2/68", department: "พลแตร", status: "ผลัดลา" },
  { fullName: "พลฯศิลป์แผ่นดิน ไทยวงศาเจริญ", batch: "2/68", department: "คลังอาวุธ", status: "ผลัดลา" },
  { fullName: "พลฯพีรพล พอกพูน", batch: "2/68", department: "ช่าง", status: "ผลัดลา" },
  { fullName: "พลฯทักษ์ดนัย วิบูรอัต", batch: "2/68", department: "ช่าง", status: "ผลัดลา" },
  { fullName: "พลฯวรัญญู ร่างสม", batch: "2/68", department: "สวน", status: "ผลัดลา" },
  { fullName: "พลฯธีรภัทร ตั้งวิริยไพศาล", batch: "2/68", department: "สวน", status: "ผลัดลา" },
  { fullName: "พลฯโรจน์ศักดิ์ ทองสร้อย", batch: "2/68", department: "สวน", status: "ผลัดลา" },
  { fullName: "พลฯสุชานนท์ นรสิงห์", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯภูวดล บินฮาซัน", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯนภัส ยูนุช", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯสิทธิศักดิ์ อ่วมวิจิตร์", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯเจ้านาย ฉํ่าบุรุษ", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯภาณุวัฒน์ ชาวไกล", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯนฤเบศร์ สนกัน", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯสายลับ พานรัมย์", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" },
  { fullName: "พลฯมนต์ชัย บัวนารถ", batch: "2/68", department: "กองร้อย", status: "ผลัดลา" }
];

async function main() {
  console.log('กำลังนำเข้าข้อมูล...');
  await prisma.soldier.deleteMany({});
  for (const s of soldiers) {
    await prisma.soldier.create({
      data: s
    });
  }
  console.log('นำเข้าข้อมูลสำเร็จ!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());