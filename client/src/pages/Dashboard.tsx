import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { RefreshCw, TrendingUp, Flame, Heart, Activity, Loader2 } from 'lucide-react'
import { api, hotText } from '../api/douyu'
import { useStore } from '../store/useStore'
import type { NormalizedRoom } from '../types'

const chartText = '#8994b5'
const axisLine = 'rgba(255,255,255,.08)'

export default function Dashboard() {
  const { favorites, samples, addSample } = useStore()
  const [rooms, setRooms] = useState<NormalizedRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState<Date | null>(null)

  const refresh = async (record = false) => {
    setLoading(true)
    try {
      const { rooms: list } = await api.getRecommend(1)
      setRooms(list)
      setUpdated(new Date())
      if (record && list.length) {
        const total = list.reduce((s, r) => s + r.hot, 0)
        addSample({ t: Date.now(), total, top: Math.max(...list.map((r) => r.hot)) })
      }
    } catch { /* 保留旧数据 */ }
    setLoading(false)
  }

  useEffect(() => {
    refresh(true)
    const t = setInterval(() => refresh(true), 60000)
    return () => clearInterval(t)
  }, [])

  const totalHot = rooms.reduce((s, r) => s + r.hot, 0)
  const topCate = useMemo(() => {
    const map = new Map<string, number>()
    rooms.forEach((r) => map.set(r.cate, (map.get(r.cate) || 0) + r.hot))
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [rooms])

  const lineOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 46, right: 18, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: '#1a2038', borderColor: '#2a3150', textStyle: { color: '#e9edfa', fontSize: 11 } },
    xAxis: {
      type: 'category',
      data: samples.map((s) => new Date(s.t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })),
      axisLine: { lineStyle: { color: axisLine } }, axisLabel: { color: chartText, fontSize: 10 }, axisTick: { show: false },
    },
    yAxis: {
      type: 'value', splitLine: { lineStyle: { color: axisLine, type: 'dashed' } },
      axisLabel: { color: chartText, fontSize: 10, formatter: (v: number) => hotText(v) },
    },
    series: [{
      type: 'line', smooth: true, showSymbol: false, data: samples.map((s) => s.total),
      lineStyle: { color: '#6d5cff', width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(109,92,255,.35)' }, { offset: 1, color: 'rgba(109,92,255,0)' }] } },
    }],
  }), [samples])

  const pieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#1a2038', borderColor: '#2a3150', textStyle: { color: '#e9edfa', fontSize: 11 }, formatter: (p: any) => `${p.name}<br/>${hotText(p.value)} (${p.percent}%)` },
    legend: { orient: 'vertical', right: 8, top: 'middle', textStyle: { color: chartText, fontSize: 11 }, itemWidth: 9, itemHeight: 9 },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['35%', '50%'], avoidLabelOverlap: true,
      itemStyle: { borderColor: '#131829', borderWidth: 2 },
      label: { show: false },
      data: topCate.map(([name, value], i) => ({ name, value, itemStyle: { color: ['#6d5cff', '#4a8cff', '#ff6b9d', '#34d399', '#ffb86b', '#a78bfa', '#22d3ee', '#f472b6'][i % 8] } })),
    }],
  }), [topCate])

  return (
    <div className="page">
      <div className="section-head">
        <span className="section-dot" />
        <h1 className="section-title">数据看板</h1>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>基于斗鱼公开接口的实时人气观测</span>
        <button className="btn-sm section-more" onClick={() => refresh(true)}><RefreshCw size={13} /> 刷新</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">观测直播间</div><div className="stat-value">{rooms.length}</div><div className="stat-sub">每次采样 TOP {rooms.length}</div></div>
        <div className="stat-card"><div className="stat-label">总人气热度</div><div className="stat-value">{hotText(totalHot)}</div><div className="stat-sub">实时聚合计算</div></div>
        <div className="stat-card"><div className="stat-label">头部房间热度</div><div className="stat-value">{hotText(rooms[0]?.hot || 0)}</div><div className="stat-sub">{rooms[0]?.anchor || '—'}</div></div>
        <div className="stat-card"><div className="stat-label">我的关注</div><div className="stat-value">{favorites.length}</div><div className="stat-sub">{favorites.filter((f) => f.liveNow).length} 个正在直播</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18 }}>
        <div className="chart-card">
          <div className="chart-title"><TrendingUp size={15} style={{ verticalAlign: -2, marginRight: 6 }} />全站人气趋势（本地采样）</div>
          {samples.length > 1 ? <ReactECharts option={lineOption} style={{ height: 260 }} notMerge /> :
            <div className="empty" style={{ padding: '70px 0' }}><Loader2 size={24} /><h3>采集中</h3><p>每分钟自动记录一次，多采几次即可看到趋势</p></div>}
        </div>
        <div className="chart-card">
          <div className="chart-title"><Activity size={15} style={{ verticalAlign: -2, marginRight: 6 }} />分区人气分布</div>
          {topCate.length ? <ReactECharts option={pieOption} style={{ height: 260 }} notMerge /> : <div className="empty">暂无数据</div>}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title"><Flame size={15} style={{ verticalAlign: -2, marginRight: 6, color: '#ff8a5b' }} />热度排行榜 · TOP 15</div>
        {loading && rooms.length === 0 ? <div className="loader"><Loader2 className="spinner" /> 加载中…</div> :
          rooms.slice(0, 15).map((r, i) => (
            <div className="rank-row" key={r.id} onClick={() => window.open(`https://www.douyu.com/${r.id}`, '_blank')} style={{ cursor: 'pointer' }}>
              <span className={`rank-num ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
              <img src={r.avatar ? `/api/proxy?url=${encodeURIComponent(r.avatar)}` : ''} alt="" />
              <div className="rank-info"><div className="rank-name">{r.title}</div><div className="rank-sub">{r.anchor} · {r.cate}</div></div>
              <span className="rank-hot">{hotText(r.hot)}</span>
            </div>
          ))}
      </div>
      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11 }}>
        <Heart size={11} style={{ verticalAlign: -1 }} /> 最后更新：{updated?.toLocaleTimeString('zh-CN') || '—'} · 数据仅用于个人观察与研究
      </div>
    </div>
  )
}
