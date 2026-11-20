import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import RoomCard from '../components/RoomCard'
import { api } from '../api/douyu'
import { useInfinite } from '../hooks/useInfinite'
import type { Game } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const { rooms, loading, error, sentinel } = useInfinite((p) => api.getRecommend(p), [])

  useEffect(() => {
    api.getCate().then((d) => setGames(d.games.slice(0, 14))).catch(() => {})
  }, [])

  return (
    <div className="page">
      <div className="section-head">
        <span className="section-dot" />
        <h1 className="section-title">发现直播</h1>
        <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 4 }}>精选热门，实时更新</span>
      </div>

      <div className="cate-scroll">
        <button className="cate-pill active" onClick={() => navigate('/discover')}>全部</button>
        {games.map((g) => (
          <button key={g.cate_id} className="cate-pill" onClick={() => navigate(`/discover?cate=${g.cate_id}`)}>
            {g.game_name}
          </button>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 18 }}>
        <Flame size={18} color="#ff8a5b" />
        <h2 className="section-title" style={{ fontSize: 17 }}>为你推荐</h2>
        <span className="section-more" onClick={() => navigate('/discover')}>查看全部分区 <ArrowRight size={14} /></span>
      </div>

      <div className="grid">
        {rooms.map((r) => <RoomCard key={r.id} room={r} />)}
      </div>

      <div ref={sentinel} />
      {loading && <div className="loader"><Loader2 className="spinner" /> 正在加载更多直播…</div>}
      {error && <div className="empty"><RefreshCw size={26} /><h3>加载失败</h3><p>{error}，请确认代理服务已启动</p></div>}
      {!loading && rooms.length === 0 && !error && <div className="empty"><h3>暂无数据</h3></div>}
    </div>
  )
}
