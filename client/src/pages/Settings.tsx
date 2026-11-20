import { ShieldCheck, Bell, Trash2, Info, ExternalLink } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Settings() {
  const { settings, setSettings, favorites } = useStore()

  const toggleNotify = async () => {
    if (settings.notify) { setSettings({ notify: false }); return }
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const p = await Notification.requestPermission()
      if (p !== 'granted') return
    }
    setSettings({ notify: true })
  }

  const clearData = () => {
    if (!confirm('确定清除本地收藏、采样和设置吗？此操作不可恢复。')) return
    localStorage.removeItem('dy_favorites')
    localStorage.removeItem('dy_samples')
    localStorage.removeItem('dy_settings')
    location.reload()
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="section-head"><span className="section-dot" /><h1 className="section-title">设置</h1></div>

      <div className="chart-card">
        <div className="chart-title">提醒与通知</div>
        <div className="setting-row">
          <Bell size={17} color="var(--primary)" />
          <div style={{ flex: 1 }}><div>开播通知</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>关注的主播开播时发送系统通知</div></div>
          <button className={`switch ${settings.notify ? 'on' : ''}`} onClick={toggleNotify} aria-label="开播通知开关" />
        </div>
        <div className="setting-row">
          <Info size={17} color="var(--primary)" />
          <div style={{ flex: 1 }}><div>关键词提醒</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>在直播间添加关键词，命中弹幕时高亮并提醒</div></div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{settings.keywords.length} 个</span>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">数据说明</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.9 }}>
          本应用仅使用斗鱼对外公开的 HTTP 接口与弹幕 WebSocket 服务，不登录、不抓取用户私有数据、不存储任何账号凭据。直播画面由斗鱼官方提供，本应用不转码、不分发直播流。
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.9, marginTop: 10 }}>
          收藏、设置与采样数据仅保存在你的设备本地（localStorage），不会上传到任何服务器。代理服务只做接口转发与缓存。
        </p>
        <a href="https://www.douyu.com" target="_blank" rel="noopener" className="btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
          访问斗鱼官网 <ExternalLink size={13} />
        </a>
      </div>

      <div className="chart-card">
        <div className="chart-title">本地数据</div>
        <div className="setting-row">
          <ShieldCheck size={17} color="var(--green)" />
          <div style={{ flex: 1 }}><div>收藏主播</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>当前设备共 {favorites.length} 条</div></div>
        </div>
        <button className="btn-sm btn-danger" onClick={clearData} style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Trash2 size={14} /> 清除所有本地数据
        </button>
      </div>
    </div>
  )
}
