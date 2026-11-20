import type { DanmakuMessage } from '../types'

/**
 * 斗鱼弹幕私有协议（STT）实现
 * 服务地址：wss://danmuproxy.douyu.com:8506/
 * 包结构：[长度4][长度4][类型2][加密1][保留1][包体\0]，小端；客户端类型 689
 */

const SERVER = 'wss://danmuproxy.douyu.com:8506/'
const HEARTBEAT = 45000

function encode(packet: string): ArrayBuffer {
  const body = new TextEncoder().encode(packet + '\0')
  const len = 8 + body.length
  const buf = new ArrayBuffer(4 + len)
  const view = new DataView(buf)
  view.setInt32(0, len, true)
  view.setInt32(4, len, true)
  view.setInt16(8, 689, true)
  view.setInt8(10, 0)
  view.setInt8(11, 0)
  new Uint8Array(buf).set(body, 12)
  return buf
}

function unstt(s: string): string {
  return s.replace(/@A/g, '@').replace(/@S/g, '/')
}

function parseSTT(str: string): Record<string, string> {
  const obj: Record<string, string> = {}
  str.split('/').forEach((part) => {
    if (!part) return
    const i = part.indexOf('@=')
    if (i <= 0) return
    obj[part.slice(0, i)] = unstt(part.slice(i + 2))
  })
  return obj
}

export class DouyuDanmaku {
  private ws: WebSocket | null = null
  private roomId: number
  private timer: number | null = null
  private reconnectTimer: number | null = null
  private retries = 0
  private closed = true
  private pending = new Uint8Array(0)
  onMessage: (m: DanmakuMessage) => void = () => {}
  onStatus: (s: 'connecting' | 'connected' | 'disconnected' | 'error', detail?: string) => void = () => {}

  constructor(roomId: number) {
    this.roomId = roomId
  }

  connect() {
    this.closed = false
    this.retries = 0
    this.open()
  }

  private open() {
    if (this.closed) return
    this.onStatus('connecting')
    let ws: WebSocket
    try {
      ws = new WebSocket(SERVER)
      ws.binaryType = 'arraybuffer'
    } catch (e: any) {
      this.onStatus('error', e?.message || '无法创建连接')
      this.scheduleReconnect()
      return
    }
    this.ws = ws

    ws.onopen = () => {
      this.retries = 0
      this.onStatus('connected')
      ws.send(encode(`type@=loginreq/roomid@=${this.roomId}/`))
      ws.send(encode(`type@=joingroup/rid@=${this.roomId}/gid@=-9999/`))
      this.startHeartbeat()
    }

    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') return
      this.feed(new Uint8Array(ev.data as ArrayBuffer))
    }

    ws.onerror = () => {
      this.onStatus('error', '弹幕连接异常')
    }

    ws.onclose = () => {
      this.stopHeartbeat()
      if (!this.closed) {
        this.onStatus('disconnected')
        this.scheduleReconnect()
      }
    }
  }

  private feed(chunk: Uint8Array) {
    const merged = new Uint8Array(this.pending.length + chunk.length)
    merged.set(this.pending, 0)
    merged.set(chunk, this.pending.length)
    this.pending = merged
    const view = new DataView(this.pending.buffer)
    let offset = 0
    while (this.pending.length - offset >= 12) {
      const len = view.getInt32(offset, true)
      const total = 4 + len
      if (len < 8 || this.pending.length - offset < total) break
      const type = view.getInt16(offset + 8, true)
      const bodyBytes = this.pending.subarray(offset + 12, offset + total - 1)
      if (type === 690) {
        try {
          const raw = new TextDecoder().decode(bodyBytes)
          const obj = parseSTT(raw)
          const msg = this.convert(obj)
          if (msg) this.onMessage(msg)
        } catch { /* 忽略坏包 */ }
      }
      offset += total
    }
    if (offset > 0) this.pending = this.pending.slice(offset)
  }

  private convert(o: Record<string, string>): DanmakuMessage | null {
    const now = Date.now()
    switch (o.type) {
      case 'chatmsg': {
        const text = o.txt || ''
        if (!text || o.rid && o.rid !== String(this.roomId)) return null
        return {
          type: 'chat',
          user: o.nn || 'Anonymous',
          uid: o.uid || '',
          text,
          level: Number(o.level ?? o.lv) || undefined,
          color: o.colour && o.colour !== '0' ? '#' + Number(o.colour).toString(16).padStart(6, '0') : undefined,
          time: now,
        }
      }
      case 'giftmsg': {
        const name = o.gfn || o.giftname || '礼物'
        return {
          type: 'gift',
          user: o.nn || 'Anonymous',
          uid: o.uid || '',
          text: `送出 ${name}`,
          giftName: name,
          giftCount: Number(o.gc || 1),
          time: now,
        }
      }
      case 'uenter':
        return { type: 'enter', user: o.nn || 'Anonymous', uid: o.uid || '', text: '进入了直播间', time: now }
      default:
        return null
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.timer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(encode('type@=mrkl/'))
      }
    }, HEARTBEAT)
  }

  private stopHeartbeat() {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null }
  }

  private scheduleReconnect() {
    if (this.closed || this.reconnectTimer !== null) return
    this.retries++
    if (this.retries > 8) { this.onStatus('error', '连接失败次数过多'); return }
    const delay = Math.min(2000 + this.retries * 1000, 8000)
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.open()
    }, delay)
  }

  close() {
    this.closed = true
    this.stopHeartbeat()
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }
}
