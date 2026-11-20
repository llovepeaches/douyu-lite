import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Compass, BarChart3, Heart, Search, Bell, Settings, Radio } from 'lucide-react'
import { useStore } from '../store/useStore'

const navs = [
  { to: '/', icon: Home, label: '首页推荐', end: true },
  { to: '/discover', icon: Compass, label: '分区发现' },
  { to: '/dashboard', icon: BarChart3, label: '数据看板' },
  { to: '/favorites', icon: Heart, label: '我的关注' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Layout() {
  const [kw, setKw] = useState('')
  const navigate = useNavigate()
  const { favorites } = useStore()
  const liveCount = favorites.filter((f) => f.liveNow).length

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (kw.trim()) navigate(`/search?q=${encodeURIComponent(kw.trim())}`)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <div className="brand-logo">🐟</div>
          <div>
            <div className="brand-name">DouyuHub</div>
            <div className="brand-sub">LIVE · DATA · FOCUS</div>
          </div>
        </NavLink>
        <div className="nav-label">浏览</div>
        {navs.slice(0, 3).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <n.icon size={18} />{n.label}
          </NavLink>
        ))}
        <div className="nav-label">个人</div>
        {navs.slice(3).map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <n.icon size={18} />{n.label}
            {n.to === '/favorites' && liveCount > 0 && <span className="nav-badge">{liveCount}</span>}
          </NavLink>
        ))}
        <div className="sidebar-foot">
          数据来自斗鱼公开接口<br />仅供学习与研究使用
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <form className="search-wrap" onSubmit={submit}>
            <Search className="search-icon" size={17} />
            <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="搜索主播或直播间…" aria-label="搜索" />
          </form>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => navigate('/favorites')} title="关注提醒"><Bell size={18} /></button>
            <button className="icon-btn" onClick={() => navigate('/settings')} title="设置"><Settings size={18} /></button>
          </div>
        </header>
        <Outlet />
      </div>

      <nav className="mobile-nav">
        {navs.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => isActive ? 'active' : ''}>
            <n.icon size={20} /><span>{n.label.replace('推荐', '').replace('发现', '').replace('数据', '').replace('我的', '')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
