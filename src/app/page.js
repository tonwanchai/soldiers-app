"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { 
  Table, Button, Input, Form, Space, Popconfirm, 
  message, Card, Tabs, Select, Tag, Divider, Row, Col, Statistic, DatePicker
} from 'antd'
import { 
  EditOutlined, DeleteOutlined, UserAddOutlined, 
  CopyOutlined, SaveOutlined, TeamOutlined, DeploymentUnitOutlined,
  PlusOutlined, CloseCircleOutlined, SearchOutlined, CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

export default function SoldierApp() {
  const [soldiers, setSoldiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [reportDate, setReportDate] = useState(dayjs()) 
  const [form] = Form.useForm()
  const [editId, setEditId] = useState(null)
  
  const fixedTasks = ['กรก.เทิด', 'คลังอาวุธ', 'เวรปืน', 'กรก.ศรีสมาน', 'ผลัดลา']
  const [taskGroups, setTaskGroups] = useState({})
  const [extraTasks, setExtraTasks] = useState([])

  useEffect(() => {
    fetchSoldiers()
  }, [])

  useEffect(() => {
    const groups = {}
    fixedTasks.forEach(task => {
      groups[task] = soldiers.filter(s => s.status === task).map(s => s.id)
    })
    
    const activeStatusNames = soldiers.map(s => s.status)
    const customStatusNames = [...new Set(activeStatusNames.filter(s => 
      !fixedTasks.includes(s) && 
      !soldiers.some(soldier => soldier.department === s)
    ))]
    
    setExtraTasks(customStatusNames.map((name, index) => ({ id: `extra-${index}`, name })))
    
    customStatusNames.forEach(name => {
      groups[name] = soldiers.filter(s => s.status === name).map(s => s.id)
    })

    setTaskGroups(groups)
  }, [soldiers])

  const allSelectedIds = useMemo(() => Object.values(taskGroups).flat(), [taskGroups]);

  const fetchSoldiers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/soldiers')
      const data = await res.json()
      setSoldiers(data)
    } catch (error) {
      message.error('โหลดข้อมูลล้มเหลว')
    }
    setLoading(false)
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const method = editId ? 'PUT' : 'POST'
      const url = editId ? `/api/soldiers/${editId}` : '/api/soldiers'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      if (res.ok) {
        message.success(editId ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มรายชื่อสำเร็จ')
        form.resetFields()
        setEditId(null)
        fetchSoldiers()
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
      message.success('บันทึกยอดจำหน่ายเรียบร้อย')
      fetchSoldiers()
    } catch (error) { message.error('เกิดข้อผิดพลาดในการบันทึก') }
    setLoading(false)
  }

  const copyReport = () => {
    const displayDate = reportDate.add(543, 'year').format('DD/MM/YY');
    const total = soldiers.length
    const srisaman = soldiers.filter(s => s.status === 'กรก.ศรีสมาน').length
    const onLeave = soldiers.filter(s => s.status === 'ผลัดลา').length
    const extraTaskCount = extraTasks.reduce((acc, task) => acc + (taskGroups[task.name]?.length || 0), 0);
    const totalDischarge = srisaman + onLeave + extraTaskCount
    const remaining = total - totalDischarge

    let text = `วันที่ ${displayDate}\nยอดเต็ม ${total} นาย\n\n`
    text += `เข้าเวร กรก.ศรีสมาน ${srisaman} นาย\n`
    text += `ลา ${onLeave} นาย\n`
    extraTasks.forEach(t => {
        const count = taskGroups[t.name]?.length || 0;
        if (count > 0) text += `${t.name} ${count} นาย\n`;
    });
    text += `รวมจำหน่าย ${totalDischarge} นาย\n\n`
    text += `คงเหลือ ${remaining} นาย\n`
    text += `______________________________________\n\n`

    const reportOrder = [
      'กรก.เทิด', 'คลังอาวุธ', 'เวรปืน', 'บก.', 'ช่าง', 'PX', 
      'พลแตร', 'สวน', 'ช่างตัดผม', 'กองร้อย', 'กรก.ศรีสมาน',
      ...extraTasks.map(t => t.name), 'ผลัดลา'
    ]

    reportOrder.forEach(status => {
      const members = soldiers.filter(s => s.status === status)
      if (members.length > 0) {
        text += `${status} ${members.length} นาย\n`
        members.forEach((m, i) => { text += `${i + 1}.${m.fullName} ${m.batch}\n` })
        text += `______________________________________\n\n`
      }
    });
    navigator.clipboard.writeText(text);
    message.success('ก๊อปปี้รายงานเรียบร้อย!');
  }

  const columns = [
    { 
      title: 'ชื่อ-นามสกุล', 
      dataIndex: 'fullName', 
      key: 'fullName', 
      sorter: (a, b) => a.fullName.localeCompare(b.fullName) 
    },
    { 
      title: 'ผลัด', 
      dataIndex: 'batch', 
      key: 'batch', 
      width: 100,
      sorter: (a, b) => a.batch.localeCompare(b.batch)
    },
    { 
      title: 'สายงานเดิม', 
      dataIndex: 'department', 
      key: 'department', 
      sorter: (a, b) => a.department.localeCompare(b.department) 
    },
    { 
      title: 'สถานะปัจจุบัน', 
      dataIndex: 'status', 
      key: 'status',
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (st) => {
        let color = 'blue';
        if (st === 'ผลัดลา') color = 'volcano';
        else if (st === 'กรก.ศรีสมาน') color = 'purple';
        else if (fixedTasks.includes(st)) color = 'gold';
        else if (st !== soldiers.find(s => s.status === st)?.department) color = 'green';
        return <Tag color={color}>{st}</Tag>
      }
    },
    {
      title: 'จัดการ',
      key: 'action',
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
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card bordered={false} style={{ maxWidth: 1000, margin: '0 auto', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <Tabs defaultActiveKey="2" items={[
          {
            key: '1', 
            label: <span><TeamOutlined /> จัดการรายชื่อ</span>,
            children: (
              <>
                <Form form={form} layout="inline" onFinish={onFinish} style={{ marginBottom: 20, padding: 15, background: '#fafafa', borderRadius: 8 }}>
                  <Form.Item name="fullName" rules={[{ required: true }]}><Input placeholder="ชื่อ-นามสกุล" /></Form.Item>
                  <Form.Item name="batch" rules={[{ required: true }]}><Input placeholder="ผลัด" style={{ width: 80 }} /></Form.Item>
                  <Form.Item name="department" rules={[{ required: true }]}><Input placeholder="สายงานเดิม" /></Form.Item>
                  <Button type="primary" htmlType="submit" icon={editId ? <SaveOutlined /> : <PlusOutlined />}>{editId ? 'บันทึก' : 'เพิ่มทหาร'}</Button>
                  {editId && <Button style={{ marginLeft: 8 }} onClick={() => { setEditId(null); form.resetFields(); }}>ยกเลิก</Button>}
                </Form>
                
                {/* ช่องค้นหาชื่อกลับมาแล้ว */}
                <Input 
                  prefix={<SearchOutlined />} 
                  placeholder="ค้นหาชื่อหรือผลัดในตาราง..." 
                  onChange={e => setSearchText(e.target.value)} 
                  style={{ marginBottom: 15, borderRadius: 6 }} 
                  allowClear
                />
                
                <Table 
                  columns={columns} 
                  dataSource={soldiers.filter(s => s.fullName.includes(searchText) || s.batch.includes(searchText))} 
                  rowKey="id" 
                  pagination={false} 
                  size="small" 
                  scroll={{ y: 450 }} 
                />
              </>
            )
          },
          {
            key: '2', 
            label: <span><DeploymentUnitOutlined /> ระบบลงยอดจำหน่าย</span>,
            children: (
              <div>
                <Row gutter={16} style={{ marginBottom: 15 }}>
                  <Col span={10}>
                    <Card size="small" title={<span><CalendarOutlined /> วันที่รายงาน</span>}>
                      <DatePicker defaultValue={dayjs()} format="DD/MM/YYYY" style={{ width: '100%' }} onChange={(d) => setReportDate(d || dayjs())} />
                    </Card>
                  </Col>
                  <Col span={7}><Card size="small"><Statistic title="ยอดเต็ม" value={soldiers.length} /></Card></Col>
                  <Col span={7}>
                    <Card size="small">
                      <Statistic 
                        title="คงเหลือ" 
                        value={soldiers.length - (soldiers.filter(s => s.status === 'กรก.ศรีสมาน' || s.status === 'ผลัดลา').length + extraTasks.reduce((acc, t) => acc + (taskGroups[t.name]?.length || 0), 0))} 
                        formatter={(val) => <span style={{ color: '#3f8600', fontWeight: 'bold' }}>{val}</span>}
                      />
                    </Card>
                  </Col>
                </Row>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {fixedTasks.map(task => (
                    <Card size="small" key={task} title={<span style={{color: '#d4380d'}}>{task}</span>} extra={<Button type="text" danger size="small" onClick={() => setTaskGroups({...taskGroups, [task]: []})}>ล้าง</Button>}>
                      <Select 
                        mode="multiple" 
                        style={{ width: '100%' }} 
                        value={taskGroups[task] || []} 
                        onChange={(v) => setTaskGroups({ ...taskGroups, [task]: v })}
                        showSearch
                        optionFilterProp="label"
                        placeholder={`เลือกคนลงยอด ${task}...`}
                        options={soldiers.map(s => ({ 
                          label: `${s.fullName} (${s.department})`, 
                          value: s.id, 
                          disabled: allSelectedIds.includes(s.id) && !(taskGroups[task] || []).includes(s.id) 
                        }))}
                      />
                    </Card>
                  ))}

                  {extraTasks.map(task => (
                    <Card size="small" key={task.id} title={<Tag color="processing">{task.name}</Tag>} 
                      extra={
                        <Popconfirm
                          title="ยกเลิกภารกิจนี้และส่งทุกคนกลับสายงานเดิม?"
                          onConfirm={async () => {
                            setLoading(true);
                            try {
                              const updatedGroups = { ...taskGroups, [task.name]: [] };
                              await fetch('/api/soldiers/bulk-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groups: updatedGroups }) });
                              setExtraTasks(prev => prev.filter(t => t.name !== task.name));
                              message.success(`ลบภารกิจ ${task.name} แล้ว`);
                              await fetchSoldiers();
                            } catch (e) { message.error('ล้มเหลว'); }
                            setLoading(false);
                          }}
                        >
                          <Button type="text" danger size="small" icon={<CloseCircleOutlined />}>ลบภารกิจนี้</Button>
                        </Popconfirm>
                      }
                    >
                      <Select 
                        mode="multiple" 
                        style={{ width: '100%' }} 
                        value={taskGroups[task.name] || []} 
                        onChange={(v) => setTaskGroups({ ...taskGroups, [task.name]: v })}
                        showSearch
                        optionFilterProp="label"
                        options={soldiers.map(s => ({ label: `${s.fullName} (${s.department})`, value: s.id, disabled: allSelectedIds.includes(s.id) && !(taskGroups[task.name] || []).includes(s.id) }))}
                      />
                    </Card>
                  ))}

                  <Button type="dashed" icon={<PlusOutlined />} onClick={addExtraTask} block style={{ height: 45, marginTop: 10 }}>เพิ่มภารกิจข้างนอก</Button>
                  <Divider style={{ margin: '15px 0' }} />
                  <Row gutter={12}>
                    <Col span={16}><Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleUpdateGroups} style={{ height: 60, fontSize: 18 }} block loading={loading}>บันทึกยอดจำหน่าย</Button></Col>
                    <Col span={8}><Button block type="default" size="large" icon={<CopyOutlined />} onClick={copyReport} style={{ height: 60, border: '2px solid #52c41a', color: '#52c41a' }}>ก๊อปรายงาน</Button></Col>
                  </Row>
                </div>
              </div>
            )
          }
        ]} />
      </Card>
    </div>
  )
}