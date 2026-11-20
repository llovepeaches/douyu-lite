import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Loader2, AlertCircle } from 'lucide-react'
import RoomCard from '../components/RoomCard'
import { api } from '../api/douyu'
import type { NormalizedRoom } from '../types'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [type, setType] = useState<'room' | 'user'>('room')
  const [rooms, setRooms] = useState<NormalizedRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!q) return
    setLoading(true); setErr('')
    api.search(q, type).then((r) => {
      setRooms(r.rooms)
      if (r.error) setErr(r.msg || '搜索受限，请稍后再试')
    }).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [q, type])

  return (
    <div className="page">
      <div className="section-head">
        <span className="section-dot" />
        <h1 className="section-title">搜索结果</h1>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>关键词：{q}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button className={`cate-pill ${type === 'room' ? 'active' : ''}`} onClick={() => setType('room')}>直播间</button>
        <button className={`cate-pill ${type === 'user' ? 'active' : ''}`} onClick={() => setType('user')}>主播</button>
      </div>

      {err && (
        <div style={{ background: 'rgba(255,107,157,.08)', border: '1px solid rgba(255,107,157,.25)', borderRadius: 12, padding: 16, marginBottom: 18, fontSize: 13, color: '#ffb3c9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {err}（斗鱼搜索接口有频率限制，属正常现象）
        </div>
      )}
      {loading && <div className="loader"><Loader2 className="spinner" /> 搜索中…</div>}
      {!loading && !err && rooms.length === 0 && <div className="empty"><Search size={34} /><h3>没有找到相关结果</h3><p>换个关键词试试</p></div>}
      <div className="grid">{rooms.map((r) => <RoomCard key={r.id} room={r} />)}</div>
    </div>
  )
}
