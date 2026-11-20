/**
 * DouyuHub 本地 API 代理
 * 斗鱼 Web 接口有 CORS 限制，浏览器无法直接请求；本服务负责转发并注入 UA/Referer。
 * 仅访问斗鱼公开域名，不做登录、不抓取私有数据。
 */
const express = require('express')
const https = require('https')
const http = require('http')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3001

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const ALLOWED = ['www.douyu.com', 'm.douyu.com', 'open.douyucdn.cn', 'apic.douyucdn.cn', 'sta-op.douyucdn.cn']
function isAllowed(host) {
  return ALLOWED.includes(host) || host.endsWith('.douyucdn.cn') || host.endsWith('.douyu.com')
}

// 简单内存缓存：key -> { at, ttl, data }
const cache = new Map()
function getCache(key, ttl) {
  const c = cache.get(key)
  if (c && Date.now() - c.at < ttl) return c.data
  return null
}
function setCache(key, data) {
  cache.set(key, { at: Date.now(), data })
  if (cache.size > 500) {
    const first = cache.keys().next().value
    cache.delete(first)
  }
}

function fetchUrl(url, { headers = {}, timeout = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.douyu.com/',
        ...headers,
      },
    }, (res) => {
      // 跟随重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        const next = new URL(res.headers.location, url).toString()
        if (!isAllowed(new URL(next).hostname)) return reject(new Error('redirect blocked'))
        return fetchUrl(next, { headers, timeout }).then(resolve, reject)
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        let buf = Buffer.concat(chunks)
        const enc = res.headers['content-encoding']
        try {
          if (enc === 'gzip') buf = require('zlib').gunzipSync(buf)
          else if (enc === 'deflate') buf = require('zlib').inflateSync(buf)
          else if (enc === 'br') buf = require('zlib').brotliDecompressSync(buf)
        } catch (e) { /* 用原始内容 */ }
        resolve({ status: res.statusCode, buffer: buf, body: buf.toString('utf8'), headers: res.headers })
      })
    })
    req.setTimeout(timeout, () => req.destroy(new Error('timeout')))
    req.on('error', reject)
  })
}

async function jsonp(url, ttl) {
  const r = await fetchUrl(url)
  if (r.status !== 200) throw new Error(`upstream ${r.status}`)
  const data = JSON.parse(r.body)
  setCache(url, data)
  return data
}

function send(fn, ttl = 60000) {
  return async (req, res) => {
    try {
      const key = req.originalUrl
      const hit = getCache(key, ttl)
      if (hit) return res.json({ ...hit, __cache: true })
      const data = await fn(req)
      res.json(data)
    } catch (e) {
      console.error('[api error]', req.originalUrl, e.message)
      res.status(502).json({ error: e.message })
    }
  }
}

// 一级+二级分类（含图标）
app.get('/api/cate', send(async () => {
  const [cate, games] = await Promise.all([
    jsonp('https://m.douyu.com/api/cate/list', 600000),
    jsonp('http://open.douyucdn.cn/api/RoomApi/game', 600000),
  ])
  return { cate, games }
}, 600000))

// 分区房间列表：cate = 2_1 / 0_0，page 页数
app.get('/api/rooms', send(async (req) => {
  const cate = String(req.query.cate || '0_0').replace(/[^\d_]/g, '')
  const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
  return jsonp(`https://www.douyu.com/gapi/rkc/directory/mixList/${cate}/${page}`, 60000)
}, 60000))

// 推荐/综合列表
app.get('/api/recommend', send(async (req) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
  return jsonp(`https://www.douyu.com/japi/weblist/apinc/allpage/6/${page}`, 60000)
}, 60000))

// 搜索：type = room | user
app.get('/api/search', send(async (req) => {
  const kw = String(req.query.kw || '').trim()
  if (!kw) return { code: 0, data: { rl: [] }, error: 0 }
  const type = req.query.type === 'user' ? 'searchUser' : 'searchShow'
  const url = `https://www.douyu.com/japi/search/api/${type}?kw=${encodeURIComponent(kw)}`
  return jsonp(url, 30000)
}, 30000))

// 房间详情（含真实 room_id / 主播信息 / 房间签名）
app.get('/api/room/:rid', send(async (req) => {
  const rid = String(req.params.rid).replace(/\D/g, '')
  if (!rid) throw new Error('invalid room id')
  return jsonp(`https://www.douyu.com/betard/${rid}`, 300000)
}, 300000))

// H5 播放地址（公开接口，不保证可用）
app.get('/api/play/:rid', send(async (req) => {
  const rid = String(req.params.rid).replace(/\D/g, '')
  return jsonp(`https://www.douyu.com/lapi/live/getH5PlayV1/${rid}`, 60000)
}, 60000))

// 通用白名单代理（用于卡片图片等）
app.get('/api/proxy', async (req, res) => {
  try {
    const target = new URL(String(req.query.url || ''))
    if (!isAllowed(target.hostname)) return res.status(403).json({ error: 'host not allowed' })
    const r = await fetchUrl(target.toString(), { timeout: 8000 })
    res.set('Content-Type', (r.headers['content-type'] || 'application/octet-stream').split(';')[0])
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(r.buffer)
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

// 生产环境托管前端静态文件
const dist = path.join(__dirname, '..', 'client', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DouyuHub API 已启动: http://localhost:${PORT}`)
})
