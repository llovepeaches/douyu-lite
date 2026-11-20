import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, RefreshCw, Compass } from 'lucide-react'
import RoomCard from '../components/RoomCard'
import { api } from '../api/douyu'
import { useInfinite } from '../hooks/useInfinite'
import type { Game } from '../types'

export default function Discover() {
  const [params, setParams] = useSearchParams()
  const cate = params.get('cate') || ''
  const [games, setGames] = useState<Game[]>([])
  const { rooms, loading, error, sentinel } = useInfinite(
    (p) => api.getRooms(cate ? `2_${cate}` : '0_0', p),
    [cate],
  )

  useEffect(() => {
    api.getCate().then((d) => setGames(d.games)).catch(() => {})
  }, [])

  return (
    <div className="page">
      <div className="section-head">
        <span className="section-dot" />
        <h1 className="section-title">分区发现</h1>
        <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 4 }}>按游戏与品类浏览</span>
      </div>

      <div className="cate-scroll">
        <button className={`cate-pill ${!cate ? 'active' : ''}`} onClick={() => setParams({})}>综合</button>
        {games.map((g) => (
          <button key={g.cate_id} className={`cate-pill ${cate === String(g.cate_id) ? 'active' : ''}`} onClick={() => setParams({ cate: String(g.cate_id) })}>
            {g.game_name}
          </button>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 18 }}>
        <Compass size={18} color="var(--primary)" />
        <h2 className="section-title" style={{ fontSize: 17 }}>
          {cate ? games.find((g) => String(g.cate_id) === cate)?.game_name || '该分区' : '综合热门'}
        </h2>
        <span className="section-more">{rooms.length} 个直播间</span>
      </div>

      <div className="grid">
        {rooms.map((r) => <RoomCard key={r.id} room={r} />)}
      </div>
      <div ref={sentinel} />
      {loading && <div className="loader"><Loader2 className="spinner" /> 加载中…</div>}
      {error && <div className="empty"><RefreshCw size={26} /><h3>加载失败</h3><p>{error}</p></div>}
    </div>
  )
}
