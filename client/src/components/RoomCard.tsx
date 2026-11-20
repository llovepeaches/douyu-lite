import { Eye, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { hotText } from '../api/douyu'
import { useStore } from '../store/useStore'
import type { NormalizedRoom } from '../types'

export default function RoomCard({ room }: { room: NormalizedRoom }) {
  const { isFavorite, toggleFavorite } = useStore()
  const navigate = useNavigate()
  const on = isFavorite(room.id)

  return (
    <article className="room-card" onClick={() => navigate(`/room/${room.id}`)}>
      <div className="thumb">
        {room.cover && <img src={`/api/proxy?url=${encodeURIComponent(room.cover)}`} alt={room.title} loading="lazy" />}
        <div className="thumb-top">
          <span className="live-tag">直播中</span>
          <span className="hot-tag"><Eye size={12} />{hotText(room.hot)}</span>
        </div>
        <button
          className={`fav-btn ${on ? 'on' : ''}`}
          title={on ? '取消关注' : '关注主播'}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(room) }}
        >
          <Star size={15} fill={on ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="room-info">
        <div className="room-title">{room.title}</div>
        <div className="room-meta">
          {room.avatar && <img src={`/api/proxy?url=${encodeURIComponent(room.avatar)}`} alt="" loading="lazy" />}
          <span className="anchor">{room.anchor}</span>
          <span className="cate-chip">{room.cate}</span>
        </div>
        {room.labels.length > 0 && (
          <div className="tags">{room.labels.slice(0, 2).map((l, i) => <span className="tag" key={i}>{l}</span>)}</div>
        )}
      </div>
    </article>
  )
}
