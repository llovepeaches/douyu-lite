export interface Cate1 {
  cate1Id: number
  cate1Name: string
  shortName: string
}

export interface Game {
  cate_id: number
  game_name: string
  short_name: string
  game_icon: string
  game_src: string
}

export interface RoomItem {
  rid: number
  rn: string
  nn: string
  uid: number
  ol: number
  av: string
  rs1?: string
  rs16?: string
  c2name?: string
  c2url?: string
  cid2?: number
  cid1?: number
  roomLabel?: string[]
  url?: string
  show_status?: number
}

export interface NormalizedRoom {
  id: number
  title: string
  anchor: string
  uid: number
  hot: number
  cover: string
  avatar: string
  cate: string
  cateId: number
  labels: string[]
  url: string
}

export interface RoomDetail {
  room_id: number
  nickname: string
  room_name: string
  owner_uid: number
  show_status: number
  avatar: string
  cover: string
  cate2_id: number
  second_lvl_name?: string
  show_time?: number
  show_details?: string
  ol?: number
}

export interface DanmakuMessage {
  type: 'chat' | 'gift' | 'enter' | 'system'
  user: string
  uid: string
  text: string
  level?: number
  color?: string
  giftName?: string
  giftCount?: number
  time: number
}

export interface Favorite {
  id: number
  title: string
  anchor: string
  avatar: string
  cover: string
  cate: string
  addedAt: number
  lastLiveAt?: number
  liveNow?: boolean
}
