/**
 * Electron 主进程：把本地 Web App 包装成 Windows / macOS / Linux 桌面应用。
 * 启动时自动拉起 API 代理服务，窗口加载本机 3001 端口。
 */
const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

let serverProcess = null
let mainWindow = null

function startServer() {
  const entry = path.join(__dirname, '..', 'server', 'index.js')
  serverProcess = spawn(process.execPath, [entry], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'ignore',
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'DouyuHub · 斗鱼直播聚合',
    backgroundColor: '#0a0d16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  })
  mainWindow.loadURL('http://localhost:3001')
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  startServer()
  setTimeout(createWindow, 900)
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})
app.on('before-quit', () => { if (serverProcess) serverProcess.kill() })
