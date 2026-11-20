import type { Cate1, Game, NormalizedRoom, RoomDetail, RoomItem } from '../types'

async function request<T = any>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`请求失败 ${res.status}`)
  return res.json()
}

export function hotText(n = 0): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return String(n)
}

export function avatarUrl(av = ''): string {
  if (!av) return ''
  if (av.startsWith('http')) return av
  return `https://apic.douyucdn.cn/upload/${av}_middle.jpg`
}

export function normalizeRoom(r: RoomItem): NormalizedRoom {
  const cover = r.rs1 || r.rs16 || (r as any).room_src || ''
  return {
    id: Number(r.rid),
    title: r.rn || '无标题直播',
    anchor: r.nn || '未知主播',
    uid: Number(r.uid) || 0,
    hot: Number(r.ol) || 0,
    cover: cover.startsWith('http') ? cover : `https://rpic.douyucdn.cn/${cover}`,
    avatar: avatarUrl(r.av),
    cate: r.c2name || '其他',
    cateId: Number(r.cid2) || Number(r.cid1) || 0,
    labels: Array.isArray(r.roomLabel) ? r.roomLabel : [],
    url: r.url || `/${r.rid}`,
  }
}

export const api = {
  async getCate(): Promise<{ cate1: Cate1[]; games: Game[] }> {
    const data = await request<any>('/api/cate')
    const cate1 = data?.cate?.data?.cate1Info || []
    const games = data?.games?.data || []
    return { cate1, games }
  },

  async getRooms(cate = '0_0', page = 1): Promise<{ rooms: NormalizedRoom[]; totalPages: number }> {
    const d = await request<any>(`/api/rooms?cate=${encodeURIComponent(cate)}&page=${page}`)
    const list = d?.data?.rl || []
    return { rooms: list.map(normalizeRoom), totalPages: Number(d?.data?.pgcnt) || 1 }
  },

  async getRecommend(page = 1): Promise<{ rooms: NormalizedRoom[]; totalPages: number }> {
    const d = await request<any>(`/api/recommend?page=${page}`)
    const list = d?.data?.rl || []
    return { rooms: list.map(normalizeRoom), totalPages: Number(d?.data?.pgcnt) || 1 }
  },

  async search(kw: string, type: 'room' | 'user' = 'room'): Promise<{ rooms: NormalizedRoom[]; error?: number; msg?: string }> {
    const d = await request<any>(`/api/search?kw=${encodeURIComponent(kw)}&type=${type}`)
    if (d?.error && d.error !== 0) return { rooms: [], error: d.error, msg: d.msg }
    let raw: any[] = []
    const data = d?.data || {}
    if (Array.isArray(data)) raw = data
    else if (Array.isArray(data.rl)) raw = data.rl
    else if (Array.isArray(data.list)) raw = data.list
    else if (Array.isArray(data.userList)) raw = data.userList
    else raw = Object.values(data).find((v: any) => Array.isArray(v)) as any[] || []
    return { rooms: raw.filter((x) => x && (x.rid || x.room_id)).map((x) => normalizeRoom({ ...x, rid: x.rid || x.room_id, rn: x.rn || x.room_name || x.nickname, nn: x.nn || x.nickname })) }
  },

  async getRoomDetail(rid: number): Promise<RoomDetail | null> {
    const d = await request<any>(`/api/room/${rid}`)
    const r = d?.room
    if (!r) return null
    const cover = r.rs1 || r.room_src || ''
    return {
      room_id: Number(r.room_id) || rid,
      nickname: r.nickname || '',
      room_name: r.room_name || '',
      owner_uid: Number(r.owner_uid) || 0,
      show_status: Number(r.show_status ?? r.status) || 0,
      avatar: r.avatar?.middle || r.avatar_mid || avatarUrl(r.avatar) || '',
      cover: cover.startsWith('http') ? cover : `https://rpic.douyucdn.cn/${cover}`,
      cate2_id: Number(r.cate2_id) || 0,
      second_lvl_name: r.second_lvl_name,
      show_time: Number(r.show_time) || 0,
      show_details: r.show_details || '',
      ol: Number(r.ol) || 0,
    }
  },

  async getPlayUrl(rid: number): Promise<string> {
    const d = await request<any>(`/api/play/${rid}`)
    const d1 = d?.data
    if (d1?.hls_url) return d1.hls_url
    if (d1?.rtmp_url && d1?.rtmp_live) return `${d1.rtmp_url}/${d1.rtmp_live}`
    return ''
  },
}
