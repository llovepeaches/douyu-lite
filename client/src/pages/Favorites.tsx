import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Radio, Trash2, Bell, RefreshCw, Loader2 } from 'lucide-react'
import { api, hotText } from '../api/douyu'
import { useStore } from '../store/useStore'

export default function Favorites() {
  const navigate = useNavigate()
  const { favorites, removeFavorite, markLive, settings, notify } = useStore()
  const [checking, setChecking] = useState(false)

  const check = async () => {
    if (!favorites.length) return
    setChecking(true)
    for (const f of favorites.slice(0, 30)) {
      try {
        const d = await api.getRoomDetail(f.id)
        if (!d) continue
        const live = d.show_status === 1
        const wasOffline = f.liveNow === false
        if (live && wasOffline) notify('主播开播了', `${d.nickname}：${d.room_name}`)
        markLive(f.id, live)
      } catch { /* 跳过失败项 */ }
    }
    setChecking(false)
  }

  useEffect(() => {
    check()
    const t = setInterval(check, 60000)
    return () => clearInterval(t)
  }, [favorites.length])

  return (
    <div className="page">
      <div className="section-head">
        <span className="section-dot" />
        <h1 className="section-title">我的关注</h1>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{favorites.length} 位主播 · {favorites.filter((f) => f.liveNow).length} 位直播中</span>
        <button className="btn-sm section-more" onClick={check} disabled={checking}><RefreshCw size={13} className={checking ? 'spinner' : ''} /> 检查开播</button>
      </div>

      {!settings.notify && (
        <div style={{ background: 'rgba(109,92,255,.1)', border: '1px solid rgba(109,92,255,.25)', borderRadius: 12, padding: 13, marginBottom: 18, fontSize: 12, color: '#b9c3e0' }}>
          <Bell size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
          开启浏览器通知后，关注的主播开播时会第一时间提醒你。<a href="/settings" onClick={(e) => { e.preventDefault(); navigate('/settings') }} style={{ color: '#9f92ff', textDecoration: 'underline' }}>前往设置 →</a>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="empty"><Heart size={36} color="var(--muted)" /><h3>还没有关注的主播</h3><p>在直播间或列表卡片上点击星标即可关注</p></div>
      ) : favorites.map((f) => (
        <div className="fav-item" key={f.id}>
          {f.avatar && <img src={`/api/proxy?url=${encodeURIComponent(f.avatar)}`} alt="" />}
          <div className="fav-info">
            <div className="fav-name">{f.anchor}</div>
            <div className="fav-desc">{f.title} · {f.cate}</div>
            <div className="fav-desc">关注于 {new Date(f.addedAt).toLocaleDateString('zh-CN')}</div>
          </div>
          <span className={f.liveNow ? 'live-pill' : 'off-pill'}>{f.liveNow ? <><Radio size={11} style={{ verticalAlign: -1 }} /> 直播中</> : '未开播'}</span>
          <button className="btn-sm btn-primary" onClick={() => navigate(`/room/${f.id}`)}>进入</button>
          <button className="btn-sm btn-danger" onClick={() => removeFavorite(f.id)} title="取消关注"><Trash2 size={14} /></button>
        </div>
      ))}
      {checking && <div className="loader"><Loader2 className="spinner" /> 正在检查开播状态…</div>}
    </div>
  )
}
