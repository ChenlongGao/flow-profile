import React, { useState } from 'react'
import { AlertTriangle, Search, Camera, Zap, Layers, ListChecks, Shuffle } from 'lucide-react'
import { Tag, Button, Tabs, Select, Input, Pagination, Drawer, message } from 'antd'

const violations = Array.from({ length: 30 }, (_, i) => {
  const stores = ['IFS国金中心', '太平街店', '德思勤店', '悦方ID店', '梅溪湖步步高店', '开福万达店',
    '湖滨银泰店', '广州天河城店', '深圳万象天地', '成都太古里店', '南京新街口店', '重庆解放碑店',
    '青岛万象城店', '西安钟楼店', '武汉江汉路旗舰店', '雨花亭店']
  const types = ['人员规范', '环境卫生', '后厨食安', '服务流程', '设备管理', '安全消防']
  const names = ['未戴厨师帽', '地面清洁不到位', '垃圾桶未加盖', '收台不及时', '厨具未归位',
    '消防通道堵塞', '未佩戴口罩', '冷藏温度超标', '蟑螂鼠迹', '餐具破损', '消毒记录缺失',
    '食材过期', '排烟故障', '通道积水', '标签不规范']
  const modes = ['实时巡检', '组合巡检', '流程巡检', '临时抽检']
  const managers = ['张拓', '李建', '王鹏', '陈静', '刘洋', '赵敏', '周明', '吴磊']
  const severities = ['紧急', '告警', '轻微', '告警', '告警', '轻微', '告警', '轻微']
  const s = stores[i % stores.length]
  const hh = '10'
  const mm = String((i + 20) % 60).padStart(2, '0')
  const ss = String(i % 60).padStart(2, '0')
  return {
    id: 'V' + String(i + 1).padStart(3, '0'),
    type: types[i % types.length],
    name: names[i % names.length],
    store: s,
    manager: managers[i % managers.length],
    time: hh + ':' + mm + ':' + ss,
    mode: modes[i % 4],
    severity: severities[i % severities.length],
  }
})

const PS = 15

export const ViolationPending: React.FC = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState('全部')
  const [typeFilter, setTypeFilter] = useState('全部')
  const [modeTab, setModeTab] = useState('全部')
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: string } | null>(null)
  const [confirmReason, setConfirmReason] = useState('')

  let filtered = violations.filter(function (v) {
    if (modeTab !== '全部' && v.mode !== modeTab) { return false }
    if (search && v.store.indexOf(search) === -1 && v.name.indexOf(search) === -1) { return false }
    if (storeFilter !== '全部' && v.store !== storeFilter) { return false }
    if (typeFilter !== '全部' && v.type !== typeFilter) { return false }
    return true
  })

  const storeOptions = Array.from(new Set(violations.map(function (v) { return v.store })))
  const typeOptions = Array.from(new Set(violations.map(function (v) { return v.type })))

  const pageData = filtered.slice((page - 1) * PS, page * PS)

  function handleConfirm(id: string) {
    setConfirmModal({ id: id, action: 'confirm' })
    setConfirmReason('')
  }
  function handleMisreport(id: string) {
    setConfirmModal({ id: id, action: 'misreport' })
    setConfirmReason('')
  }

  function getSevColor(sev: string) {
    if (sev === '紧急') { return 'red' }
    if (sev === '告警') { return 'orange' }
    return 'blue'
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            待办违规
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            全部门店 · AI抓拍+人工上报 · 来源：实时/组合/流程/临时巡检
          </p>
        </div>
        <Tabs
          activeKey={modeTab}
          onChange={function (v) { setModeTab(v); setPage(1) }}
          size="small"
          items={[
            { key: '全部', label: '全部(' + violations.length + ')' },
            { key: '实时巡检', label: React.createElement('span', { className: 'flex items-center gap-1.5' }, React.createElement(Zap, { className: 'w-3 h-3' }), '实时巡检(' + violations.filter(function (v) { return v.mode === '实时巡检' }).length + ')') },
            { key: '组合巡检', label: React.createElement('span', { className: 'flex items-center gap-1.5' }, React.createElement(Layers, { className: 'w-3 h-3' }), '组合巡检(' + violations.filter(function (v) { return v.mode === '组合巡检' }).length + ')') },
            { key: '流程巡检', label: React.createElement('span', { className: 'flex items-center gap-1.5' }, React.createElement(ListChecks, { className: 'w-3 h-3' }), '流程巡检(' + violations.filter(function (v) { return v.mode === '流程巡检' }).length + ')') },
            { key: '临时抽检', label: React.createElement('span', { className: 'flex items-center gap-1.5' }, React.createElement(Shuffle, { className: 'w-3 h-3' }), '临时抽检(' + violations.filter(function (v) { return v.mode === '临时抽检' }).length + ')') },
          ]}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Input size="middle" prefix={<Search className="w-3 h-3" />} value={search}
            onChange={function (e) { setSearch(e.target.value); setPage(1) }}
            placeholder="搜索门店/违规项..." style={{ width: 180 }} allowClear />
          <Select size="middle" value={storeFilter}
            onChange={function (v) { setStoreFilter(v); setPage(1) }}
            style={{ width: 140 }}
            options={[{ value: '全部', label: '全部门店' }].concat(storeOptions.map(function (s) { return { value: s, label: s } }))} />
          <Select size="middle" value={typeFilter}
            onChange={function (v) { setTypeFilter(v); setPage(1) }}
            style={{ width: 120 }}
            options={[{ value: '全部', label: '全部类型' }].concat(typeOptions.map(function (t) { return { value: t, label: t } }))} />
          <div className="flex-1" />
          <span className="text-[10px] text-[var(--text-muted)]">共 {filtered.length} 条</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        <div className="card-level-1 overflow-hidden" style={{ padding: 0 }}>
          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-center" style={{ width: 30 }}>#</th>
                <th className="px-3 py-2.5 text-center whitespace-nowrap" style={{ width: 64 }}>抓拍图片</th>
                <th className="px-3 py-2.5 text-left">违规项</th>
                <th className="px-3 py-2.5 text-left">门店</th>
                <th className="px-3 py-2.5 text-center whitespace-nowrap" style={{ width: 60 }}>参考图例</th>
                <th className="px-3 py-2.5 text-left">门店规范</th>
                <th className="px-3 py-2.5 text-center">事件等级</th>
                <th className="px-3 py-2.5 text-left">店长</th>
                <th className="px-3 py-2.5 text-left">巡检模式</th>
                <th className="px-3 py-2.5 text-center">时间</th>
                <th className="px-3 py-2.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(function (v, i) {
                var sevColor = getSevColor(v.severity)
                var idx = (page - 1) * PS + i + 1
                return (
                  <tr key={v.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]">
                    <td className="px-3 py-2.5 text-center text-[var(--text-muted)]">{idx}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="w-10 h-10 rounded bg-black/60 mx-auto flex items-center justify-center cursor-pointer">
                        <Camera className="w-3.5 h-3.5 text-white/15" />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{v.name}</td>
                    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{v.store}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="w-10 h-10 rounded bg-black/60 mx-auto flex items-center justify-center cursor-pointer">
                        <Camera className="w-3.5 h-3.5 text-white/15" />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                      {v.name === '未戴厨师帽' ? '《食安条例》§1.2·着装规范' : v.name === '地面清洁不到位' ? '《门店卫生标准》§1·地面清洁' : '《门店巡检规范》相关条款'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Tag color={sevColor} style={{ fontSize: 12 }}>{v.severity}</Tag>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{v.manager}</td>
                    <td className="px-3 py-2.5">
                      <Tag color="blue" style={{ fontSize: 12 }}>{v.mode}</Tag>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">{v.time}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="small" danger style={{ fontSize: 10 }} onClick={function () { handleConfirm(v.id) }}>确认</Button>
                        <Button size="small" style={{ fontSize: 10 }} onClick={function () { handleMisreport(v.id) }}>误报</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)]">
          共 {filtered.length} 条，第 {page}/{Math.ceil(filtered.length / PS)} 页
        </span>
        <Pagination current={page} pageSize={PS} total={filtered.length}
          onChange={setPage} size="small" showSizeChanger={false} />
      </div>

      <Drawer
        open={confirmModal != null}
        onClose={function () { setConfirmModal(null) }}
        title={confirmModal != null ? (confirmModal.action === 'confirm' ? '确认违规' : '标记误报') : ''}
        width={400}
        styles={{ header: { background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }, body: { background: 'var(--bg-primary)', padding: 16 } }}
      >
        {confirmModal != null && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              {confirmModal.action === 'confirm'
                ? '确认该条记录为违规项，将自动创建整改任务并通知店长。'
                : '标记该条记录为AI误报，将归档至误报库供算法优化。'}
            </p>
            <div>
              <span className="text-[10px] text-[var(--text-muted)]">
                {confirmModal.action === 'confirm' ? '确认原因（非必填）' : '误报原因（非必填）'}
              </span>
              <Input.TextArea size="small" rows={2} value={confirmReason}
                onChange={function (e) { setConfirmReason(e.target.value) }}
                placeholder={confirmModal.action === 'confirm' ? '如：现场核验确认为违规' : '如：灯光阴影导致误判'}
                style={{ marginTop: 4 }} />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button onClick={function () { setConfirmModal(null) }}>取消</Button>
              <Button type="primary" danger={confirmModal.action === 'confirm'}
                onClick={function () {
                  message.success(confirmModal.action === 'confirm' ? '已确认违规' : '已标记误报')
                  setConfirmModal(null)
                }}>
                {confirmModal.action === 'confirm' ? '确认违规' : '确认误报'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
