"use client"
import React, { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  Table, Button, Input, Form, Space, Popconfirm,
  message, Card, Tabs, Select, Tag, Divider, Row, Col, Statistic, DatePicker, Upload, Empty, Switch
} from 'antd'
import {
  EditOutlined, DeleteOutlined,
  CopyOutlined, TeamOutlined, DeploymentUnitOutlined,
  PlusOutlined, CloseCircleOutlined, SearchOutlined,
  FileExcelOutlined, EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

export default function SoldierApp() {
  // --- State พลทหาร ---
  const [soldiers, setSoldiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [reportDate, setReportDate] = useState(dayjs())
  const [form] = Form.useForm()
  const [editId, setEditId] = useState(null)

  const fixedTasks = ['กรก.เทิด', 'คลังอาวุธ', 'เวรปืน', 'กรก.ศรีสมาน', 'ผลัดลา', 'กองร้อย']
  const [taskGroups, setTaskGroups] = useState({})
  const [extraTasks, setExtraTasks] = useState([])

  const activeSoldiers = useMemo(() => soldiers.filter(s => s.isActive !== false), [soldiers]);

  // --- State ข้าราชการ ---
  const [allOfficers, setAllOfficers] = useState([])
  const [officerSwaps, setOfficerSwaps] = useState([])
  const [officerLeave, setOfficerLeave] = useState({ business: [], sick: [], vacation: [] })
  const [manualLeaves, setManualLeaves] = useState([]) 
  const [witnessProtection, setWitnessProtection] = useState([])
  const [rawExcelData, setRawExcelData] = useState([]) 

  useEffect(() => {
    fetchSoldiers()
    fetchOfficers()
  }, [])

  useEffect(() => {
    const groups = {}
    fixedTasks.forEach(task => {
      groups[task] = activeSoldiers.filter(s => s.status === task).map(s => s.id)
    })
    const activeStatusNames = activeSoldiers.map(s => s.status)
    const customStatusNames = [...new Set(activeStatusNames.filter(s =>
      !fixedTasks.includes(s) &&
      !activeSoldiers.some(soldier => soldier.department === s)
    ))]
    setExtraTasks(customStatusNames.map((name, index) => ({ id: `extra-${index}`, name })))
    customStatusNames.forEach(name => {
      groups[name] = activeSoldiers.filter(s => s.status === name).map(s => s.id)
    })
    setTaskGroups(groups)
  }, [activeSoldiers])

  const allSelectedIds = useMemo(() => Object.values(taskGroups).flat(), [taskGroups]);

  // --- Functions พลทหาร ---
  const fetchSoldiers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/soldiers')
      const data = await res.json()
      setSoldiers(data)
    } catch (error) { message.error('โหลดข้อมูลล้มเหลว') }
    setLoading(false)
  }

  const toggleSoldierStatus = async (id, currentStatus) => {
    const updatedSoldiers = soldiers.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s);
    setSoldiers(updatedSoldiers);
    try {
      const res = await fetch(`/api/soldiers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      if (!res.ok) throw new Error('Failed to update');
      message.success('อัปเดตสถานะสำเร็จ');
    } catch (error) {
      message.error('อัปเดตสถานะล้มเหลว');
      fetchSoldiers(); 
    }
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const method = editId ? 'PUT' : 'POST'
      const url = editId ? `/api/soldiers/${editId}` : '/api/soldiers'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, isActive: true })
      })
      if (res.ok) {
        message.success(editId ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มรายชื่อสำเร็จ')
        form.resetFields(); setEditId(null); fetchSoldiers();
      }
    } catch (error) { message.error('เกิดข้อผิดพลาด') }
    setLoading(false)
  }

  const addExtraTask = () => {
    const name = prompt("ระบุชื่อภารกิจข้างนอก:");
    if (name && name.trim() !== "") {
      if (taskGroups[name]) return message.warning("มีภารกิจนี้อยู่แล้ว");
      setExtraTasks([...extraTasks, { id: Date.now(), name }]);
      setTaskGroups({ ...taskGroups, [name]: [] });
    }
  }

  const handleUpdateGroups = async () => {
    setLoading(true)
    try {
      await fetch('/api/soldiers/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: taskGroups })
      })
      message.success('บันทึกยอดจำหน่ายเรียบร้อย'); fetchSoldiers();
    } catch (error) { message.error('เกิดข้อผิดพลาดในการบันทึก') }
    setLoading(false)
  }

  // --- Functions ข้าราชการ ---
  const fetchOfficers = async () => {
    try {
      const res = await fetch('/api/officers/bulk-update')
      const data = await res.json()
      const uniqueData = []
      const seen = new Set()
      data.forEach(item => { if (!seen.has(item.fullName)) { seen.add(item.fullName); uniqueData.push(item); } })
      setAllOfficers(uniqueData)
    } catch (e) { }
  }

  const handleOfficerExcel = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      setRawExcelData(rows);
      const day = reportDate.date().toString();
      const resetData = allOfficers.map(o => ({ name: o.fullName, code: 'ปกติ' }));
      const currentDayData = rows.map(row => {
        const name = row['fullName'] || row['ชื่อ-นามสกุล'] || row['ชื่อ'];
        const code = row[day]?.toString().trim();
        return (code && name) ? { name: name.toString().trim(), code: code } : null;
      }).filter(item => item !== null);
      try {
        setLoading(true);
        const finalUpdates = [...resetData, ...currentDayData];
        await fetch('/api/officers/bulk-update', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: finalUpdates })
        });
        message.success(`อัปเดตข้อมูลสำเร็จ`); fetchOfficers();
      } catch (err) { }
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleWitnessExcel = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      const day = reportDate.date().toString();
      const names = rows.map(row => {
        const name = (row['fullName'] || row['ชื่อ-นามสกุล'] || row['ชื่อ'])?.toString().trim();
        const code = row[day]?.toString().trim();
        return (code && name && name !== "ร้อย 2") ? name : null;
      }).filter(n => n);
      setWitnessProtection([...new Set(names)]);
      message.success(`โหลดคุ้มครองพยานสำเร็จ`);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const addSwapPair = () => setOfficerSwaps([...officerSwaps, { original: null, substitute: null, task: 'สิบเวร ร้อย.รวป.ที่ 1' }]);
  const removeSwapPair = (i) => { const n = [...officerSwaps]; n.splice(i, 1); setOfficerSwaps(n); };
  const updateSwapPair = (i, k, v) => { const n = [...officerSwaps]; n[i][k] = v; setOfficerSwaps(n); };

  const addManualLeave = () => setManualLeaves([...manualLeaves, { name: '', type: 'ลากิจ' }]);
  const removeManualLeave = (i) => { const n = [...manualLeaves]; n.splice(i, 1); setManualLeaves(n); };
  const updateManualLeave = (i, k, v) => { const n = [...manualLeaves]; n[i][k] = v; setManualLeaves(n); };

  const copyOfficerReport = () => {
    const displayDate = reportDate.add(543, 'year').format('DD/MM/YY');
    const reportOfficers = allOfficers.filter(o => o.status !== 'ปกติ');
    
    const getActiveName = (originalName, taskType) => {
      const swap = officerSwaps.find(s => s.original === originalName && s.task === taskType);
      return swap && swap.substitute ? swap.substitute : originalName;
    };

    // 1. สายตรวจ
    let patrolToday = reportOfficers.find(o => o.status === 'สต' || o.status === 'สต.')?.fullName;
    let patrolYesterday = "";
    if (!patrolToday) {
      const yesterdayDate = reportDate.subtract(1, 'day').date().toString();
      if (rawExcelData.length > 0) {
        const found = rawExcelData.find(row => {
          const code = row[yesterdayDate]?.toString().trim();
          return code === 'สต' || code === 'สต.';
        });
        if (found) patrolYesterday = found['fullName'] || found['ชื่อ-นามสกุล'] || found['ชื่อ'];
      }
    }
    if (patrolToday) patrolToday = getActiveName(patrolToday, 'สายตรวจ');
    if (patrolYesterday) patrolYesterday = getActiveName(patrolYesterday, 'สายตรวจ');

    // 2. ตำแหน่งหลัก
    let commander = reportOfficers.find(o => o.status === 'ผบ' || o.status === 'ผบ.')?.fullName;
    if (commander) commander = getActiveName(commander, 'ผบ.กรก.ศรีสมาน');

    let assistantCmd = reportOfficers.find(o => o.status === 'ผช' || o.status === 'ผช.')?.fullName;
    if (assistantCmd) assistantCmd = getActiveName(assistantCmd, 'ผช.ผบ.กรก.ศรีสมาน');

    let policeOfficers = reportOfficers.filter(o => o.status.includes('สห')).map(o => o.fullName);
    policeOfficers = policeOfficers.map(name => getActiveName(name, 'สห.ศรีสมาน'));

    let originalOnDutyChief = reportOfficers.find(o => o.status === 'ว' || o.status === 'ว.')?.fullName;
    let onDutyChief = originalOnDutyChief ? getActiveName(originalOnDutyChief, 'สิบเวร ร้อย.รวป.ที่ 1') : null;

    let trainingOfficers = reportOfficers.filter(o => o.status === 'ฝ' || o.status === 'ฝ.').map(o => o.fullName);
    let currentWitness = [...witnessProtection].map(name => getActiveName(name, 'คุ้มครองพยาน'));

    let text = `ขออนุญาต ผบ.ร้อย รวป.ที่ 1\nภารกิจประจำวันที่...${displayDate}\n\n`;

    const { business, sick, vacation } = officerLeave;
    const mBusiness = manualLeaves.filter(l => l.type === 'ลากิจ' && l.name).map(l => l.name);
    const mSick = manualLeaves.filter(l => l.type === 'ลาป่วย' && l.name).map(l => l.name);
    const mVacation = manualLeaves.filter(l => l.type === 'ลาพักผ่อน' && l.name).map(l => l.name);
    const allBusiness = [...business, ...mBusiness];
    const allSick = [...sick, ...mSick];
    const allVacation = [...vacation, ...mVacation];

    if (allBusiness.length > 0) text += `${displayDate}\n>>ลากิจ\n${allBusiness.join('\n')}\n\n`;
    if (allSick.length > 0) text += `${displayDate}\n>>ลาป่วย\n${allSick.join('\n')}\n\n`;
    if (allVacation.length > 0) text += `${displayDate}\n>>ลาพักผ่อน\n${allVacation.join('\n')}\n\n`;

    officerSwaps.forEach(swap => {
      if (swap.original && swap.substitute) {
        text += `${displayDate}\n(แทนเวร)>>${swap.task}\n${swap.original}\nให้\n${swap.substitute}\nแทนเวร\n\n`;
      }
    });

    if (commander) text += `${displayDate}\n>>ผบ.กรก.ศรีสมาน\n${commander}\n\n`;
    if (assistantCmd) text += `${displayDate}\n>>ผช.ผบ.กรก.ศรีสมาน\n${assistantCmd}\n\n`;
    if (patrolToday) text += `${displayDate}\n>>สายตรวจ\n${patrolToday}\n\n`;
    else if (patrolYesterday) text += `${displayDate}\n(ออกเวร)>>สายตรวจ\n${patrolYesterday}\n\n`;

    if (policeOfficers.length > 0) text += `${displayDate}\n>>สห.ศรีสมาน\n${policeOfficers.join('\n')}\n\n`;
    if (currentWitness.length > 0) text += `${displayDate}\n>>คุ้มครองพยาน\n${currentWitness.join('\n')}\n\n`;

    if (onDutyChief) text += `${displayDate}\n>>สิบเวร ร้อย.รวป.ที่ 1\n${onDutyChief}\n\n`;
    if (trainingOfficers.length > 0) text += `${displayDate}\n>>ฝึก หมู่ ตอน หมวด\n${trainingOfficers.join('\n')}\n\n`;

    // --- ส่วนที่ 7: เตรียมพร้อม (ต.) ---
    const readyList = reportOfficers
      .filter(o => {
        const s = o.status;
        return !isNaN(parseInt(s)) && !s.includes('สต') && !s.includes('สห') && 
               !['ว', 'ว.', 'ผบ', 'ผช', 'ฝ', 'ฝ.'].includes(s);
      })
      .sort((a, b) => parseInt(a.status) - parseInt(b.status));

    if (readyList.length > 0) {
      text += `${displayDate}\n>>เตรียมพร้อมประจำวัน\n`;
      readyList.forEach((item, i) => {
        let nameToShow = item.fullName;
        
        // เงื่อนไขสิบเวร: ถ้าคนในลำดับ ต. นี้ไปแทนสิบเวร ให้เอาชื่อสิบเวรเดิมมาใส่แทนที่นี่
        const isSubstitutingDutyChief = officerSwaps.find(s => s.substitute === item.fullName && s.task === 'สิบเวร ร้อย.รวป.ที่ 1');
        if (isSubstitutingDutyChief) {
            nameToShow = isSubstitutingDutyChief.original; // ดึงชื่อสิบเวรตัวจริงมาใส่ในเตรียมแทน
        }

        let notes = [];
        if (allBusiness.includes(nameToShow)) notes.push("ลากิจ"); 
        else if (allSick.includes(nameToShow)) notes.push("ลาป่วย"); 
        else if (allVacation.includes(nameToShow)) notes.push("ลาพักผ่อน");
        if (currentWitness.includes(nameToShow)) notes.push("คุ้มครองพยาน");

        const noteStr = notes.length > 0 ? ` (${notes.join(', ')})` : "";
        text += `ต.${i + 1} ${nameToShow}${noteStr}\n`;
      });
    }

    text += `__________________________\n`;
    copyToClipboard(text, `ก๊อปปี้รายงานสำเร็จ`);
  }

  const copyToClipboard = (text, msg) => {
    const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); message.success(msg);
  }

  // --- Functions ยอดพลทหาร ---
  const copyReport = () => {
    const displayDate = reportDate.add(543, 'year').format('DD/MM/YY');
    const total = activeSoldiers.length;
    const srisaman = activeSoldiers.filter(s => s.status === 'กรก.ศรีสมาน').length;
    const onLeave = activeSoldiers.filter(s => s.status === 'ผลัดลา').length;
    const extraTaskCount = extraTasks.reduce((acc, task) => acc + (taskGroups[task.name]?.length || 0), 0);
    const totalDischarge = srisaman + onLeave + extraTaskCount;
    const remaining = total - totalDischarge;
    let text = `วันที่ ${displayDate}\nยอดเต็ม ${total} นาย\n\n`;
    text += `เข้าเวร กรก.ศรีสมาน ${srisaman} นาย\nลา ${onLeave} นาย\n`;
    extraTasks.forEach(t => { const count = taskGroups[t.name]?.length || 0; if (count > 0) text += `${t.name} ${count} นาย\n`; });
    text += `รวมจำหน่าย ${totalDischarge} นาย\n\nคงเหลือ ${remaining} นาย\n______________________________________\n\n`;
    const reportOrder = ['กรก.เทิด', 'คลังอาวุธ', 'เวรปืน', 'บก.', 'ช่าง', 'PX', 'พลแตร', 'สวน', 'ช่างตัดผม', 'กองร้อย', 'กรก.ศรีสมาน', ...extraTasks.map(t => t.name), 'ผลัดลา'];
    reportOrder.forEach(status => {
      const members = activeSoldiers.filter(s => s.status === status);
      if (members.length > 0) {
        text += `${status} ${members.length} นาย\n`;
        members.forEach((m, i) => { text += `${i + 1}.${m.fullName} ${m.batch}\n`; });
        text += `______________________________________\n\n`;
      }
    });
    copyToClipboard(text, 'ก๊อปปี้รายงานยอดเต็มเรียบร้อย!');
  };

  const copyReportSmall = () => {
    const displayDate = reportDate.add(543, 'year').format('DD/MM/YY');
    const total = activeSoldiers.length;
    const srisaman = activeSoldiers.filter(s => s.status === 'กรก.ศรีสมาน').length;
    const onLeave = activeSoldiers.filter(s => s.status === 'ผลัดลา').length;
    const extraTaskCount = extraTasks.reduce((acc, task) => acc + (taskGroups[task.name]?.length || 0), 0);
    const d1 = srisaman + onLeave + extraTaskCount;
    const r1 = total - d1;
    const t1 = activeSoldiers.filter(s => s.status === 'กรก.เทิด').length;
    const a1 = activeSoldiers.filter(s => s.status === 'คลังอาวุธ').length;
    const g1 = activeSoldiers.filter(s => s.status === 'เวรปืน').length;
    const d2 = t1 + a1 + g1;
    const r2 = r1 - d2;
    let text = `รายงานยอดพลทหาร\nร้อย รวป.ที่ 1\nวันที่ ${displayDate}\nยอดเต็ม ${total} นาย\n\n`;
    text += `กรก.ศรีสมาน ${srisaman} นาย\nผลัดลา ${onLeave} นาย\n`;
    extraTasks.forEach(t => { const count = taskGroups[t.name]?.length || 0; if (count > 0) text += `${t.name} ${count} นาย\n`; });
    text += `รวมจำหน่าย ${d1} นาย\n\n>> คงเหลือ ${r1} นาย\n\n-ปฏิบัติหน้าที่\n`;
    text += `กรก.เทิด ${t1} นาย\nคลังอาวุธ ${a1} นาย\nเวรปืน ${g1} นาย\nรวมจำหน่าย ${d2} นาย\n\n>> คงเหลือ ${r2} นาย\n`;
    ['บก.', 'ช่าง', 'PX', 'พลแตร', 'สวน', 'ช่างตัดผม', 'กองร้อย'].forEach(s => {
      const count = activeSoldiers.filter(m => m.status === s).length; text += `${s.replace('.', '')} ${count} นาย\n`;
    });
    copyToClipboard(text, 'ก๊อปปี้ยอดเล็กเรียบร้อย!');
  };

  const columns = [
    { title: 'ชื่อ-นามสกุล', dataIndex: 'fullName', key: 'fullName', sorter: (a, b) => a.fullName.localeCompare(b.fullName) },
    { title: 'ผลัด', dataIndex: 'batch', key: 'batch', width: 80, align: 'center' },
    { title: 'สายงานเดิม', dataIndex: 'department', key: 'department' }, 
    {
      title: 'สถานะ',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (val, r) => (
        <Switch 
          checkedChildren={<EyeOutlined />} 
          unCheckedChildren={<EyeInvisibleOutlined />} 
          checked={val !== false} 
          onChange={() => toggleSoldierStatus(r.id, val !== false)} 
        />
      )
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 90,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditId(r.id); form.setFieldsValue(r); }} />
          <Popconfirm title="ลบรายชื่อ?" onConfirm={() => fetch(`/api/soldiers/${r.id}`, { method: 'DELETE' }).then(fetchSoldiers)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '15px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card bordered={false} style={{ maxWidth: 1100, margin: '0 auto', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <Tabs defaultActiveKey="2" animated items={[
          {
            key: '1',
            label: <span><TeamOutlined /> จัดการรายชื่อ</span>,
            children: (
              <>
                <Form form={form} layout="inline" onFinish={onFinish} style={{ marginBottom: 20, padding: '20px', background: '#f9f9f9', borderRadius: 12 }}>
                  <Form.Item name="fullName" rules={[{ required: true }]}><Input placeholder="ชื่อ-นามสกุล" /></Form.Item>
                  <Form.Item name="batch" rules={[{ required: true }]}><Input placeholder="ผลัด" style={{ width: 80 }} /></Form.Item>
                  <Form.Item name="department" rules={[{ required: true }]}><Input placeholder="สายงานเดิม" /></Form.Item>
                  <Button type="primary" htmlType="submit">{editId ? 'บันทึก' : 'เพิ่มทหาร'}</Button>
                </Form>
                <Input prefix={<SearchOutlined />} placeholder="ค้นหาตามชื่อ ผลัด หรือสายงาน..." onChange={e => setSearchText(e.target.value)} style={{ marginBottom: 15 }} allowClear />
                <Table columns={columns} dataSource={soldiers.filter(s => s.fullName.includes(searchText) || s.batch.includes(searchText) || (s.department && s.department.includes(searchText)))} rowKey="id" pagination={{ pageSize: 50 }} size="small" scroll={{ y: 500 }} />
              </>
            )
          },
          {
            key: '2',
            label: <span><DeploymentUnitOutlined /> ระบบลงยอดพลทหาร</span>,
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <Col xs={24} sm={10}><Card size="small" title="วันที่รายงาน"><DatePicker value={reportDate} format="DD/MM/YYYY" style={{ width: '100%' }} onChange={(d) => setReportDate(d || dayjs())} /></Card></Col>
                  <Col xs={12} sm={7}><Card size="small"><Statistic title="ยอดเต็ม" value={activeSoldiers.length} /></Card></Col>
                  <Col xs={12} sm={7}><Card size="small"><Statistic title="คงเหลือ" value={activeSoldiers.length - (activeSoldiers.filter(s => s.status === 'กรก.ศรีสมาน' || s.status === 'ผลัดลา').length + extraTasks.reduce((acc, t) => acc + (taskGroups[t.name]?.length || 0), 0))} valueStyle={{ color: '#3f8600' }} /></Card></Col>
                </Row>
                {fixedTasks.map(task => (
                  <Card size="small" key={task} title={task} style={{ marginBottom: 10 }}>
                    <Select mode="multiple" style={{ width: '100%' }} value={taskGroups[task] || []} onChange={(v) => setTaskGroups({ ...taskGroups, [task]: v })} showSearch optionFilterProp="label" options={activeSoldiers.map(s => ({ label: `${s.fullName} (${s.department})`, value: s.id, disabled: allSelectedIds.includes(s.id) && !(taskGroups[task] || []).includes(s.id) }))} />
                  </Card>
                ))}
                {extraTasks.map(task => (
                  <Card size="small" key={task.id} title={task.name} style={{ marginBottom: 10 }}>
                    <Select mode="multiple" style={{ width: '100%' }} value={taskGroups[task.name] || []} onChange={(v) => setTaskGroups({ ...taskGroups, [task.name]: v })} options={activeSoldiers.map(s => ({ label: `${s.fullName} (${s.department})`, value: s.id, disabled: allSelectedIds.includes(s.id) && !(taskGroups[task.name] || []).includes(s.id) }))} />
                  </Card>
                ))}
                <Button type="dashed" onClick={addExtraTask} block>เพิ่มภารกิจข้างนอก</Button>
                <Divider />
                <Row gutter={12}>
                  <Col span={10}><Button type="primary" size="large" onClick={handleUpdateGroups} block loading={loading}>บันทึกยอด</Button></Col>
                  <Col span={7}><Button block size="large" onClick={copyReport}>ยอดเต็ม</Button></Col>
                  <Col span={7}><Button block size="large" onClick={copyReportSmall}>ยอดเล็ก</Button></Col>
                </Row>
              </div>
            )
          },
          {
            key: '3',
            label: <span><FileExcelOutlined /> ยอดข้าราชการ</span>,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="1. อัปโหลดตาราง">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Upload beforeUpload={handleOfficerExcel} showUploadList={false}><Button icon={<FileExcelOutlined />} block>โหลดตารางเวรหลัก</Button></Upload>
                        <Upload beforeUpload={handleWitnessExcel} showUploadList={false}><Button icon={<FileExcelOutlined />} block type="dashed">โหลดตารางคุ้มครองพยาน</Button></Upload>
                      </Space>
                    </Card>
                    <Card size="small" title="2. ข้อมูลการแทนเวร" extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={addSwapPair}>เพิ่มคู่แทน</Button>} style={{ marginTop: 16 }}>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {officerSwaps.map((swap, index) => (
                          <div key={index} style={{ marginBottom: 15, padding: 10, border: '1px solid #f0f0f0', borderRadius: 8, position: 'relative' }}>
                            <Button size="small" type="text" danger icon={<CloseCircleOutlined />} onClick={() => removeSwapPair(index)} style={{ position: 'absolute', right: 0, top: 0 }} />
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Select size="small" placeholder="แทนตำแหน่ง" style={{ width: '100%' }} value={swap.task} onChange={(v) => updateSwapPair(index, 'task', v)}>
                                <Select.Option value="สิบเวร ร้อย.รวป.ที่ 1">สิบเวร ร้อย.รวป.ที่ 1</Select.Option>
                                <Select.Option value="สายตรวจ">สายตรวจ</Select.Option>
                                <Select.Option value="ผบ.กรก.ศรีสมาน">ผบ.กรก.ศรีสมาน</Select.Option>
                                <Select.Option value="ผช.ผบ.กรก.ศรีสมาน">ผช.ผบ.กรก.ศรีสมาน</Select.Option>
                                <Select.Option value="สห.ศรีสมาน">สห.ศรีสมาน</Select.Option>
                                <Select.Option value="คุ้มครองพยาน">คุ้มครองพยาน</Select.Option>
                              </Select>
                              <Select size="small" showSearch placeholder="คนเดิม" style={{ width: '100%' }} value={swap.original} onChange={(v) => updateSwapPair(index, 'original', v)} options={allOfficers.map(o => ({ label: o.fullName, value: o.fullName }))} />
                              <Select size="small" showSearch placeholder="คนใหม่" style={{ width: '100%' }} value={swap.substitute} onChange={(v) => updateSwapPair(index, 'substitute', v)} options={allOfficers.map(o => ({ label: o.fullName, value: o.fullName }))} />
                            </Space>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="3. เลือกรายชื่อคนลาจากไฟล์" extra={<Button size="small" type="text" onClick={() => setOfficerLeave({ business: [], sick: [], vacation: [] })}>ล้าง</Button>}>
                      <Row gutter={[8, 8]}>
                        <Col span={24}><Select mode="multiple" placeholder="ลากิจ" style={{ width: '100%' }} value={officerLeave.business} onChange={(v) => setOfficerLeave({ ...officerLeave, business: v })} options={allOfficers.map(o => ({ label: o.fullName, value: o.fullName }))} /></Col>
                        <Col span={24}><Select mode="multiple" placeholder="ลาป่วย" style={{ width: '100%' }} value={officerLeave.sick} onChange={(v) => setOfficerLeave({ ...officerLeave, sick: v })} options={allOfficers.map(o => ({ label: o.fullName, value: o.fullName }))} /></Col>
                        <Col span={24}><Select mode="multiple" placeholder="ลาพักผ่อน" style={{ width: '100%' }} value={officerLeave.vacation} onChange={(v) => setOfficerLeave({ ...officerLeave, vacation: v })} options={allOfficers.map(o => ({ label: o.fullName, value: o.fullName }))} /></Col>
                      </Row>
                    </Card>
                    <Card size="small" title="4. บันทึกการลาเพิ่มเติม (นอกเหนือจากลิสต์)" extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={addManualLeave}>เพิ่มคนลา</Button>} style={{ marginTop: 16 }}>
                       <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {manualLeaves.map((leave, index) => (
                          <div key={index} style={{ marginBottom: 8, padding: 8, border: '1px solid #f0f0f0', borderRadius: 8, position: 'relative' }}>
                             <Button size="small" type="text" danger icon={<CloseCircleOutlined />} onClick={() => removeManualLeave(index)} style={{ position: 'absolute', right: 0, top: 0 }} />
                             <Space direction="vertical" style={{ width: '100%' }}>
                                <Input size="small" placeholder="ระบุชื่อ-นามสกุล" value={leave.name} onChange={(e) => updateManualLeave(index, 'name', e.target.value)} />
                                <Select size="small" style={{ width: '100%' }} value={leave.type} onChange={(v) => updateManualLeave(index, 'type', v)}>
                                  <Select.Option value="ลากิจ">ลากิจ</Select.Option>
                                  <Select.Option value="ลาป่วย">ลาป่วย</Select.Option>
                                  <Select.Option value="ลาพักผ่อน">ลาพักผ่อน</Select.Option>
                                </Select>
                             </Space>
                          </div>
                        ))}
                       </div>
                    </Card>
                  </Col>
                </Row>
                <Button type="primary" size="large" danger icon={<CopyOutlined />} onClick={copyOfficerReport} style={{ height: 65, fontSize: 18 }} block>ก๊อปปี้ยอดข้าราชการ</Button>
                <Card size="small" title="รายชื่อเวรจากไฟล์ (วันนี้)">
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {allOfficers.filter(o => o.status !== 'ปกติ').map((d, i) => <div key={i}><Tag color="blue">{d.status}</Tag> {d.fullName}</div>)}
                    {witnessProtection.length > 0 && <Divider style={{ margin: '8px 0' }} />}
                    {witnessProtection.map((name, i) => <div key={`wp-${i}`}><Tag color="orange">คุ้มครองพยาน</Tag> {name}</div>)}
                  </div>
                </Card>
              </div>
            )
          }
        ]} />
      </Card>
    </div>
  )
}