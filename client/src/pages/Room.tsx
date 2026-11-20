import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play, Star, Radio, ExternalLink, Wifi, WifiOff, Loader2, Plus, X, Gift, Users } from 'lucide-react'
import Hls from 'hls.js'
import { api, hotText } from '../api/douyu'
import { DouyuDanmaku } from '../danmaku/douyuDanmaku'
import { useStore } from '../store/useStore'
import type { DanmakuMessage, RoomDetail } from '../types'

type Status = 'connecting' | 'connected' | 'disconnected' | 'error'

export default function Room() {
  const { id } = useParams()
  const rid = Number(id) || 0
  const { isFavorite, toggleFavorite, settings, setSettings, notify, markLive } = useStore()
  const [detail, setDetail] = useState<RoomDetail | null>(null)
  const [playUrl, setPlayUrl] = useState('')
  const [playError, setPlayError] = useState(false)
  const [msgs, setMsgs] = useState<DanmakuMessage[]>([])
  const [status, setStatus] = useState<Status>('connecting')
  const [statusDetail, setStatusDetail] = useState('')
  const [kwInput, setKwInput] = useState('')
  const [counter, setCounter] = useState({ chat: 0, gift: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const dmRef = useRef<DouyuDanmaku | null>(null)

  useEffect(() => {
    if (!rid) return
    api.getRoomDetail(rid).then((d) => {
      setDetail(d)
      if (d) markLive(d.room_id, d.show_status === 1)
    }).catch(() => {})
    api.getPlayUrl(rid).then(setPlayUrl).catch(() => setPlayError(true))
  }, [rid])

  // 播放器
  useEffect(() => {
    const video = videoRef.current
    if (!video || !playUrl) return
    setPlayError(false)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playUrl
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
      hls.loadSource(playUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setPlayError(true)
      })
      return () => hls.destroy()
    } else {
      setPlayError(true)
    }
  }, [playUrl])

  // 弹幕连接：用详情里的真实房间号
  useEffect(() => {
    const realId = detail?.room_id || rid
    if (!realId) return
    const dm = new DouyuDanmaku(realId)
    dmRef.current = dm
    dm.onStatus = (s, d) => { setStatus(s); setStatusDetail(d || '') }
    dm.onMessage = (m) => {
      setMsgs((prev) => [...prev.slice(-199), m])
      setCounter((c) => ({ chat: c.chat + (m.type === 'chat' ? 1 : 0), gift: c.gift + (m.type === 'gift' ? 1 : 0) }))
      if (m.type === 'chat' && settings.keywords.some((k) => k && m.text.includes(k))) {
        notify('弹幕关键词提醒', `${m.user}: ${m.text}`)
      }
    }
    dm.connect()
    return () => dm.close()
  }, [detail?.room_id, rid])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault()
    const k = kwInput.trim()
    if (k && !settings.keywords.includes(k)) setSettings({ keywords: [...settings.keywords, k] })
    setKwInput('')
  }

  const liveUrl = `https://www.douyu.com/${rid}`
  const room = { id: rid, title: detail?.room_name || '', anchor: detail?.nickname || '', uid: detail?.owner_uid || 0, hot: detail?.ol || 0, cover: detail?.cover || '', avatar: detail?.avatar || '', cate: detail?.second_lvl_name || '', cateId: detail?.cate2_id || 0, labels: [], url: `/${rid}` }

  return (
    <div className="page">
      <div className="room-layout">
        <div>
          <div className="player-box">
            {detail?.cover && <img src={`/api/proxy?url=${encodeURIComponent(detail.cover)}`} alt="" />}
            <video ref={videoRef} controls playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: playUrl && !playError ? 'block' : 'none' }} />
            {(!playUrl || playError) && (
              <div className="player-cta">
                <a className="play-btn" href={liveUrl} target="_blank" rel="noopener">
                  <Play size={20} fill="currentColor" /> 在斗鱼观看直播 <ExternalLink size={15} />
                </a>
                <div className="player-tip">
                  {playError ? '直播流受源站限制，已为你切换到官方观看' : '画面由斗鱼官方提供，弹幕在本应用内实时同步'}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <h1 style={{ fontSize: 19, fontWeight: 700 }}>{detail?.room_name || '直播间'}</h1>
                  {detail?.show_status === 1 && <span className="live-tag" style={{ fontSize: 10 }}><Radio size={11} style={{ verticalAlign: -1 }} /> 直播中</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
                  {detail?.avatar && <img src={`/api/proxy?url=${encodeURIComponent(detail.avatar)}`} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} alt="" />}
                  <strong style={{ color: '#cfd6ea' }}>{detail?.nickname || '主播信息加载中'}</strong>
                  <span>·</span>
                  <span>{detail?.second_lvl_name || '斗鱼直播'}</span>
                  {!!detail?.ol && <><span>·</span><span style={{ color: '#ffb86b' }}>{hotText(detail.ol)} 人气</span></>}
                </div>
              </div>
              <button className={`btn-sm ${isFavorite(rid) ? 'btn-primary' : ''}`} onClick={() => toggleFavorite(room)}>
                <Star size={14} fill={isFavorite(rid) ? 'currentColor' : 'none'} style={{ verticalAlign: -2, marginRight: 5 }} />
                {isFavorite(rid) ? '已关注' : '关注'}
              </button>
            </div>
            {detail?.show_details && <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{detail.show_details}</p>}
          </div>
        </div>

        <aside className="danmaku-panel">
          <div className="dm-head">
            {status === 'connected' ? <Wifi size={15} color="#34d399" /> : status === 'connecting' ? <Loader2 className="spinner" size={15} /> : <WifiOff size={15} />}
            <span>实时弹幕</span>
            <span className={`status-dot ${status === 'connected' ? 'on' : ''}`} />
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
              {status === 'connected' ? '已连接' : status === 'connecting' ? '连接中' : statusDetail || '未连接'}
            </span>
          </div>
          <div className="dm-body" ref={bodyRef}>
            {msgs.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--muted)', fontSize: 12, lineHeight: 2 }}>
                {status === 'connected' ? '等待弹幕…' : '正在连接斗鱼弹幕服务器…'}
              </div>
            )}
            {msgs.map((m, i) => {
              const hit = settings.keywords.some((k) => k && m.text.includes(k))
              return (
                <div key={i} className={`dm-msg ${m.type === 'gift' ? 'dm-gift' : ''} ${m.type === 'enter' ? 'dm-enter' : ''}`} style={hit ? { background: 'rgba(255,107,157,.12)', borderRadius: 6, padding: '3px 7px', borderLeft: '2px solid var(--accent)' } : undefined}>
                  {m.type === 'gift' && <Gift size={12} style={{ verticalAlign: -1, marginRight: 4 }} />}
                  {m.level && m.level > 0 && <span className="dm-level">Lv{m.level}</span>}
                  <span className="dm-user">{m.user}</span>
                  <span className="dm-text" style={m.color && m.type === 'chat' ? { color: m.color } : undefined}>
                    {m.type === 'gift' ? ` ${m.text} ×${m.giftCount}` : m.type === 'enter' ? ` ${m.text}` : `：${m.text}`}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="dm-foot">
            <form onSubmit={addKeyword} style={{ display: 'flex', gap: 7 }}>
              <input className="keyword-input" value={kwInput} onChange={(e) => setKwInput(e.target.value)} placeholder="添加关键词，命中时高亮提醒" />
              <button className="btn-sm" type="submit" title="添加关键词"><Plus size={15} /></button>
            </form>
            {settings.keywords.length > 0 && (
              <div className="keyword-chips">
                {settings.keywords.map((k) => (
                  <span key={k}>#{k}
                    <X size={10} style={{ cursor: 'pointer', verticalAlign: -1, marginLeft: 3 }} onClick={() => setSettings({ keywords: settings.keywords.filter((x) => x !== k) })} />
                  </span>
                ))}
              </div>
            )}
            <div className="dm-stats">
              <span><Users size={12} style={{ verticalAlign: -2 }} /> 弹幕 {counter.chat}</span>
              <span><Gift size={12} style={{ verticalAlign: -2 }} /> 礼物 {counter.gift}</span>
              <span style={{ marginLeft: 'auto' }}>保留最近 200 条</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
